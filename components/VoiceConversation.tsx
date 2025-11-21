'use client';

import { useState, useEffect, useRef } from 'react';
import { Room, RoomEvent, RemoteParticipant, LocalAudioTrack } from 'livekit-client';
import { ConnectionStatus } from './ConnectionStatus';
import { ConversationControls } from './ConversationControls';
import { MicrophoneStatus } from './MicrophoneStatus';
import { useOpenAIRealtime } from '@/hooks/useOpenAIRealtime';

type ConnectionState = 'disconnected' | 'connecting' | 'connected';

export function VoiceConversation() {
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');
  const [isMicActive, setIsMicActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transcription, setTranscription] = useState<string>('');
  const [aiResponse, setAiResponse] = useState<string>('');

  const roomRef = useRef<Room | null>(null);
  const localAudioTrackRef = useRef<LocalAudioTrack | null>(null);
  const { 
    processAudioWithAI, 
    triggerResponse,
    isProcessing, 
    cleanup: cleanupAI,
    setUpdateCallback,
    getCurrentTranscription,
    getCurrentResponse,
  } = useOpenAIRealtime();

  // Set up callback to update UI when transcription/response changes
  useEffect(() => {
    setUpdateCallback((transcription, response) => {
      if (transcription) setTranscription(transcription);
      if (response) setAiResponse(response);
    });
  }, [setUpdateCallback]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
      cleanupAI();
    };
  }, [cleanupAI]);

  const connect = async () => {
    try {
      setError(null);
      setConnectionState('connecting');

      // Generate access token from backend
      const response = await fetch('http://localhost:3001/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          roomName: 'voice-conversation-room',
          participantName: `user-${Date.now()}`,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get access token');
      }

      const { token, url } = await response.json();

      // Create and connect to room
      const room = new Room({
        adaptiveStream: true,
        dynacast: true,
      });

      roomRef.current = room;

      // Set up event listeners
      room.on(RoomEvent.Connected, () => {
        console.log('Connected to room');
        setConnectionState('connected');
      });

      room.on(RoomEvent.Disconnected, () => {
        console.log('Disconnected from room');
        setConnectionState('disconnected');
        setIsMicActive(false);
        localAudioTrackRef.current = null;
      });

      room.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
        if (track.kind === 'audio' && participant instanceof RemoteParticipant) {
          // Handle remote audio track
          const audioElement = track.attach();
          audioElement.play().catch(console.error);
        }
      });

      // Connect to room
      await room.connect(url, token);

      // Enable microphone
      await enableMicrophone(room);
    } catch (err) {
      console.error('Connection error:', err);
      setError(err instanceof Error ? err.message : 'Failed to connect');
      setConnectionState('disconnected');
    }
  };

  const enableMicrophone = async (room: Room) => {
    try {
      // Request microphone permission and create audio track
      await room.localParticipant.enableCameraAndMicrophone(false, true);
      
      // Wait a bit for the track to be created
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Get the audio track from the participant using getTrackPublications
      const audioPublications = Array.from(room.localParticipant.audioTrackPublications.values());
      const audioPublication = audioPublications.find(pub => pub.track !== undefined);
      
      if (audioPublication && audioPublication.track instanceof LocalAudioTrack) {
        const audioTrack = audioPublication.track;
        localAudioTrackRef.current = audioTrack;
        setIsMicActive(true);

        // Process audio with AI
        if (audioTrack.mediaStream) {
          processAudioStream(audioTrack.mediaStream);
        }
      } else {
        // Fallback: try to get media stream from getUserMedia
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          processAudioStream(stream);
          setIsMicActive(true);
        } catch (getUserMediaError) {
          console.error('getUserMedia error:', getUserMediaError);
          throw new Error('Microphone access denied. Please allow microphone permissions in your browser.');
        }
      }
    } catch (err) {
      console.error('Microphone error:', err);
      setError(err instanceof Error ? err.message : 'Failed to enable microphone. Please check permissions.');
    }
  };

  const processAudioStream = async (stream: MediaStream) => {
    try {
      const audioContext = new AudioContext({ sampleRate: 24000 });
      const source = audioContext.createMediaStreamSource(stream);
      const processor = audioContext.createScriptProcessor(4096, 1, 1);

      // Accumulate audio data and process in batches
      let audioBuffer: Int16Array[] = [];
      let lastProcessTime = Date.now();
      let lastResponseTime = Date.now();
      const PROCESS_INTERVAL = 1000; // Send audio every 1 second
      const RESPONSE_INTERVAL = 2000; // Trigger response every 2 seconds

      processor.onaudioprocess = async (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        const pcm16 = convertFloat32ToPCM16(inputData);
        audioBuffer.push(pcm16);

        const now = Date.now();
        
        // Send audio data periodically
        if (now - lastProcessTime >= PROCESS_INTERVAL && audioBuffer.length > 0) {
          lastProcessTime = now;
          
          // Combine audio chunks
          const totalLength = audioBuffer.reduce((sum, arr) => sum + arr.length, 0);
          const combined = new Int16Array(totalLength);
          let offset = 0;
          for (const chunk of audioBuffer) {
            combined.set(chunk, offset);
            offset += chunk.length;
          }
          audioBuffer = [];

          // Process with OpenAI Realtime API
          try {
            await processAudioWithAI(combined);
          } catch (error) {
            console.error('Audio processing error:', error);
          }
        }

        // Trigger response generation periodically (after accumulating some audio)
        if (now - lastResponseTime >= RESPONSE_INTERVAL) {
          lastResponseTime = now;
          triggerResponse();
        }

        // Check for updates periodically
        const currentTranscription = getCurrentTranscription();
        const currentResponse = getCurrentResponse();
        if (currentTranscription && currentTranscription !== transcription) {
          setTranscription(currentTranscription);
        }
        if (currentResponse && currentResponse !== aiResponse) {
          setAiResponse(currentResponse);
        }
      };

      source.connect(processor);
      processor.connect(audioContext.destination);
    } catch (err) {
      console.error('Audio processing error:', err);
    }
  };

  const convertFloat32ToPCM16 = (float32Array: Float32Array): Int16Array => {
    const pcm16 = new Int16Array(float32Array.length);
    for (let i = 0; i < float32Array.length; i++) {
      const s = Math.max(-1, Math.min(1, float32Array[i]));
      pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }
    return pcm16;
  };

  const disconnect = async () => {
    try {
      // Wait a bit to ensure any pending responses are received
      console.log('Disconnecting... Waiting for final responses...');
      
      // Get final transcription and response before clearing
      const finalTranscription = getCurrentTranscription();
      const finalResponse = getCurrentResponse();
      
      if (finalTranscription) {
        setTranscription(finalTranscription);
      }
      if (finalResponse) {
        setAiResponse(finalResponse);
      }

      // Wait a moment for any final updates
      await new Promise(resolve => setTimeout(resolve, 500));

      if (localAudioTrackRef.current) {
        localAudioTrackRef.current.stop();
        localAudioTrackRef.current = null;
      }

      if (roomRef.current) {
        await roomRef.current.disconnect();
        roomRef.current = null;
      }

      setIsMicActive(false);
      setConnectionState('disconnected');
      
      // Don't clear transcription and response immediately - keep them visible
      // They will be cleared when starting a new conversation
    } catch (err) {
      console.error('Disconnect error:', err);
    }
  };

  return (
    <div className="conversation-container">
      <div className="conversation-card">
        <h1 className="title">Real-Time AI Voice Conversation</h1>
        
        <ConnectionStatus state={connectionState} />
        
        {error && (
          <div className="error-message">
            <p>Error: {error}</p>
          </div>
        )}

        <MicrophoneStatus isActive={isMicActive} />

        <ConversationControls
          connectionState={connectionState}
          onConnect={connect}
          onDisconnect={disconnect}
        />

        <div className="conversation-display">
          {transcription ? (
            <div className="transcription">
              <h3>You said:</h3>
              <p>{transcription || 'Listening...'}</p>
            </div>
          ) : (
            <div className="transcription-placeholder">
              <p>Your speech will appear here...</p>
            </div>
          )}
          {aiResponse ? (
            <div className="ai-response">
              <h3>AI Response:</h3>
              <p>{aiResponse}</p>
            </div>
          ) : (
            connectionState === 'connected' && (
              <div className="ai-response-placeholder">
                <p>AI response will appear here...</p>
              </div>
            )
          )}
        </div>

        {isProcessing && (
          <div className="processing-indicator">
            <p>AI is processing...</p>
          </div>
        )}
      </div>

      <style jsx>{`
        .conversation-container {
          width: 100%;
          max-width: 600px;
        }

        .conversation-card {
          background: white;
          border-radius: 16px;
          padding: 32px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        }

        .title {
          font-size: 28px;
          font-weight: 700;
          color: #333;
          margin-bottom: 24px;
          text-align: center;
        }

        .error-message {
          background: #fee;
          border: 1px solid #fcc;
          border-radius: 8px;
          padding: 12px;
          margin: 16px 0;
          color: #c33;
        }

        .conversation-display {
          margin-top: 24px;
          padding-top: 24px;
          border-top: 1px solid #eee;
        }

        .transcription,
        .ai-response {
          margin: 16px 0;
          padding: 16px;
          background: #f8f9fa;
          border-radius: 8px;
        }

        .transcription h3,
        .ai-response h3 {
          font-size: 14px;
          font-weight: 600;
          color: #666;
          margin-bottom: 8px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .transcription p,
        .ai-response p {
          font-size: 16px;
          color: #333;
          line-height: 1.6;
        }

        .processing-indicator {
          margin-top: 16px;
          text-align: center;
          color: #667eea;
          font-style: italic;
        }
      `}</style>
    </div>
  );
}

