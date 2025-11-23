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
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const isProcessingRef = useRef<boolean>(false);
  const isConnectedRef = useRef<boolean>(false);
  const { 
    processAudioWithAI, 
    triggerResponse,
    isProcessing,
    error: aiError,
    connectionStatus: aiConnectionStatus,
    retry: retryAI,
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

  // Cleanup on unmount only
  useEffect(() => {
    return () => {
      // Only disconnect if actually connected (check refs, not state)
      if (roomRef.current || audioContextRef.current || isProcessingRef.current) {
        disconnect();
      }
      cleanupAI();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cleanupAI]); // Only depend on cleanupAI, not connectionState

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
        isConnectedRef.current = true; // Update ref immediately
      });

      room.on(RoomEvent.Disconnected, () => {
        console.log('Disconnected from room');
        setConnectionState('disconnected');
        isConnectedRef.current = false; // Update ref immediately
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
      // LiveKit API: enableCameraAndMicrophone(enableVideo, enableAudio)
      await room.localParticipant.setMicrophoneEnabled(true);
      
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
      // Stop any existing audio processing
      if (audioProcessorRef.current) {
        audioProcessorRef.current.disconnect();
        audioProcessorRef.current = null;
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        await audioContextRef.current.close();
      }
      
      // OpenAI Realtime API expects 24kHz sample rate
      const audioContext = new AudioContext({ sampleRate: 24000 });
      audioContextRef.current = audioContext;
      const source = audioContext.createMediaStreamSource(stream);
      
      // Use smaller buffer size to reduce latency and avoid large chunks
      // 4096 samples at 24kHz = ~170ms of audio
      const processor = audioContext.createScriptProcessor(2048, 1, 1);
      audioProcessorRef.current = processor;
      isProcessingRef.current = true;

      // Accumulate audio data and process in batches
      let audioBuffer: Int16Array[] = [];
      let lastProcessTime = Date.now();
      let lastResponseTime = Date.now();
      let hasStartedSpeaking = false;
      let totalAudioSent = 0;
      const PROCESS_INTERVAL = 500; // Send audio every 500ms (more frequent, smaller chunks)
      const RESPONSE_INTERVAL = 3000; // Trigger response every 3 seconds
      const MIN_AUDIO_BEFORE_RESPONSE = 2000; // Send at least 2 seconds of audio before responding
      const MAX_AUDIO_BUFFER_SIZE = 10; // Limit buffer size to prevent memory issues

      processor.onaudioprocess = async (e) => {
        // Check if we should continue processing (use refs for immediate checks)
        if (!isProcessingRef.current || !isConnectedRef.current || !roomRef.current) {
          // Only log once per condition to avoid spam
          if (!isProcessingRef.current && Math.random() < 0.01) {
            console.log('⚠️ Audio processing stopped: isProcessingRef is false');
          }
          if (!isConnectedRef.current && Math.random() < 0.01) {
            console.log('⚠️ Audio processing stopped: isConnectedRef is false');
          }
          if (!roomRef.current && Math.random() < 0.01) {
            console.log('⚠️ Audio processing stopped: roomRef is null');
          }
          return;
        }
        
        const inputData = e.inputBuffer.getChannelData(0);
        const pcm16 = convertFloat32ToPCM16(inputData);
        audioBuffer.push(pcm16);

        const now = Date.now();
        
        // Send audio data periodically
        if (now - lastProcessTime >= PROCESS_INTERVAL && audioBuffer.length > 0) {
          lastProcessTime = now;
          
          // Limit buffer size to prevent memory issues
          if (audioBuffer.length > MAX_AUDIO_BUFFER_SIZE) {
            console.warn(`⚠️ Audio buffer too large (${audioBuffer.length}), keeping only last ${MAX_AUDIO_BUFFER_SIZE} chunks`);
            audioBuffer = audioBuffer.slice(-MAX_AUDIO_BUFFER_SIZE);
          }
          
          // Combine audio chunks
          const totalLength = audioBuffer.reduce((sum, arr) => sum + arr.length, 0);
          const combined = new Int16Array(totalLength);
          let offset = 0;
          for (const chunk of audioBuffer) {
            combined.set(chunk, offset);
            offset += chunk.length;
          }
          audioBuffer = []; // Clear buffer after processing
          
          // Track total audio sent (in milliseconds, assuming 24kHz)
          const audioDurationMs = (combined.length / 24000) * 1000;
          totalAudioSent += audioDurationMs;

          // Process with OpenAI Realtime API
          try {
            console.log(`📤 Sending audio batch: ${combined.length} samples (~${audioDurationMs.toFixed(0)}ms), total sent: ${totalAudioSent.toFixed(0)}ms`);
            const result = await processAudioWithAI(combined);
            if (result) {
              console.log('✅ Audio processed, transcription:', result.transcription?.substring(0, 50) || 'none', 'response:', result.response?.substring(0, 50) || 'none');
            } else {
              console.log('⚠️ Audio processing returned null (may be queued)');
            }
          } catch (error) {
            console.error('❌ Audio processing error:', error);
            // Don't stop, continue processing
          }
        }

        // Trigger response generation periodically (after accumulating enough audio)
        if (now - lastResponseTime >= RESPONSE_INTERVAL && totalAudioSent >= MIN_AUDIO_BEFORE_RESPONSE) {
          lastResponseTime = now;
          hasStartedSpeaking = true;
          console.log(`🎙️ Triggering response after ${totalAudioSent.toFixed(0)}ms of audio`);
          triggerResponse();
          totalAudioSent = 0; // Reset counter
        }

        // Check for updates periodically (more frequent updates)
        const currentTranscription = getCurrentTranscription();
        const currentResponse = getCurrentResponse();
        if (currentTranscription && currentTranscription !== transcription) {
          setTranscription(currentTranscription);
          console.log('📝 Updated transcription:', currentTranscription);
        }
        if (currentResponse && currentResponse !== aiResponse) {
          setAiResponse(currentResponse);
          console.log('🤖 Updated AI response:', currentResponse);
        }
      };

      source.connect(processor);
      processor.connect(audioContext.destination);
    } catch (err) {
      console.error('Audio processing error:', err);
      isProcessingRef.current = false;
    }
  };

  const convertFloat32ToPCM16 = (float32Array: Float32Array): Int16Array => {
    const pcm16 = new Int16Array(float32Array.length);
    for (let i = 0; i < float32Array.length; i++) {
      let s = float32Array[i];
      
      // Check for invalid values (NaN, Infinity)
      if (!isFinite(s)) {
        console.warn(`⚠️ Invalid audio sample at index ${i}: ${s}, replacing with 0`);
        s = 0;
      }
      
      // Clamp to [-1, 1] range
      s = Math.max(-1, Math.min(1, s));
      
      // Convert to 16-bit signed integer
      // Standard PCM16 conversion: multiply by 32767 and clamp to [-32768, 32767]
      const sample = Math.round(s * 32767);
      pcm16[i] = Math.max(-32768, Math.min(32767, sample));
      
      // Final check for NaN (shouldn't happen, but just in case)
      if (isNaN(pcm16[i])) {
        console.warn(`⚠️ NaN detected in PCM16 at index ${i}, replacing with 0`);
        pcm16[i] = 0;
      }
    }
    return pcm16;
  };

  const disconnect = async () => {
    // Skip if already disconnected
    if (connectionState === 'disconnected' && !roomRef.current) {
      return;
    }
    
    try {
      console.log('Disconnecting...');
      
      // Stop audio processing IMMEDIATELY to prevent more audio from being sent
      isProcessingRef.current = false;
      
      // Get final transcription and response before clearing (non-blocking)
      const finalTranscription = getCurrentTranscription();
      const finalResponse = getCurrentResponse();
      
      if (finalTranscription) {
        setTranscription(finalTranscription);
        console.log('📝 Final transcription:', finalTranscription);
      }
      if (finalResponse) {
        setAiResponse(finalResponse);
        console.log('🤖 Final AI response:', finalResponse);
      }
      
      // Try to trigger final response (non-blocking, don't wait)
      try {
        triggerResponse();
        console.log('📤 Triggered final response generation');
      } catch (error) {
        console.warn('⚠️ Could not trigger final response:', error);
      }
      
      // Wait briefly for any final responses (non-blocking, don't wait too long)
      // Use a shorter timeout to avoid blocking
      setTimeout(() => {
        const currentTranscription = getCurrentTranscription();
        const currentResponse = getCurrentResponse();
        
        if (currentTranscription && currentTranscription !== finalTranscription) {
          setTranscription(currentTranscription);
        }
        if (currentResponse && currentResponse !== finalResponse) {
          setAiResponse(currentResponse);
        }
      }, 500); // Only wait 500ms, don't block
      
      if (audioProcessorRef.current) {
        audioProcessorRef.current.disconnect();
        audioProcessorRef.current = null;
      }
      
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        await audioContextRef.current.close();
        audioContextRef.current = null;
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
      isConnectedRef.current = false; // Update ref immediately
      
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
        
        {/* AI Connection Status */}
        {aiConnectionStatus !== 'disconnected' && (
          <div className="ai-connection-status">
            <div className={`status-indicator ${aiConnectionStatus}`} />
            <span className="status-text">
              AI: {aiConnectionStatus === 'connecting' ? 'Connecting...' : aiConnectionStatus === 'connected' ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        )}
        
        {/* Error Messages */}
        {(error || aiError) && (
          <div className="error-message">
            <p><strong>Error:</strong> {error || aiError}</p>
            {aiError && (
              <button onClick={retryAI} className="retry-button">
                Retry Connection
              </button>
            )}
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

        {/* Loading and Processing Indicators */}
        {(isProcessing || aiConnectionStatus === 'connecting') && (
          <div className="processing-indicator">
            <div className="spinner" />
            <p>
              {aiConnectionStatus === 'connecting' ? 'Connecting to AI...' : 'AI is processing...'}
            </p>
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

        .error-message p {
          margin: 0 0 8px 0;
        }

        .retry-button {
          background: #667eea;
          color: white;
          border: none;
          border-radius: 6px;
          padding: 8px 16px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          margin-top: 8px;
          transition: background 0.2s;
        }

        .retry-button:hover {
          background: #5568d3;
        }

        .retry-button:active {
          background: #4457c2;
        }

        .ai-connection-status {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          margin-bottom: 16px;
          padding: 8px 12px;
          background: #f8f9fa;
          border-radius: 8px;
          font-size: 13px;
        }

        .ai-connection-status .status-indicator {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }

        .ai-connection-status .status-indicator.connecting {
          background: #f59e0b;
          animation: pulse 2s infinite;
        }

        .ai-connection-status .status-indicator.connected {
          background: #10b981;
        }

        .ai-connection-status .status-indicator.disconnected {
          background: #ef4444;
        }

        .ai-connection-status .status-text {
          font-weight: 500;
          color: #666;
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
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .spinner {
          width: 16px;
          height: 16px;
          border: 2px solid #667eea;
          border-top-color: transparent;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}

