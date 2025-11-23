'use client';

import { useState, useEffect, useRef } from 'react';
import { Room, RoomEvent, RemoteParticipant, LocalAudioTrack } from 'livekit-client';
import { ConnectionStatus } from './ConnectionStatus';
import { ConversationControls } from './ConversationControls';
import { MicrophoneStatus } from './MicrophoneStatus';
import { useOpenAIWhisperChat } from '@/hooks/useOpenAIWhisperChat';

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
    processAudio,
    isProcessing,
    error: aiError,
    connectionStatus: aiConnectionStatus,
    resetConversation,
  } = useOpenAIWhisperChat();

  // MediaRecorder for audio recording
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup on unmount only
  useEffect(() => {
    return () => {
      // Only disconnect if actually connected (check refs, not state)
      if (roomRef.current || mediaRecorderRef.current || isProcessingRef.current) {
        disconnect();
      }
      resetConversation();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetConversation]); // Only depend on resetConversation

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
      // Stop any existing recording
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
      audioChunksRef.current = [];

      // Create MediaRecorder to record audio as Blob
      // Try to use WAV format first (more compatible with Whisper API)
      // Fallback to webm if WAV is not supported
      let mimeType = 'audio/webm;codecs=opus';
      if (MediaRecorder.isTypeSupported('audio/wav')) {
        mimeType = 'audio/wav';
      } else if (MediaRecorder.isTypeSupported('audio/webm')) {
        mimeType = 'audio/webm';
      }
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: mimeType,
      });
      console.log('🎙️ Using audio format:', mimeType);
      mediaRecorderRef.current = mediaRecorder;
      isProcessingRef.current = true;

      // Collect audio chunks
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      // Process audio periodically (every 3 seconds)
      const PROCESS_INTERVAL = 3000; // 3 seconds
      recordingIntervalRef.current = setInterval(async () => {
        if (!isProcessingRef.current || !isConnectedRef.current) {
          return;
        }

        // Stop current recording and process
        if (mediaRecorder.state === 'recording') {
          mediaRecorder.stop();
        }

        // Wait a bit for data to be available
        await new Promise(resolve => setTimeout(resolve, 100));

        // Process accumulated audio chunks
        if (audioChunksRef.current.length > 0) {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          audioChunksRef.current = []; // Clear chunks after processing

          console.log(`📤 Processing audio blob: ${audioBlob.size} bytes`);

          try {
            const result = await processAudio(audioBlob);
            if (result) {
              if (result.transcription) {
                setTranscription(prev => prev + (prev ? ' ' : '') + result.transcription);
                console.log('✅ Transcription:', result.transcription);
              }
              if (result.response) {
                setAiResponse(prev => prev + (prev ? ' ' : '') + result.response);
                console.log('✅ AI Response:', result.response);
              }
            }
          } catch (error) {
            console.error('❌ Audio processing error:', error);
          }
        }

        // Start recording again
        if (isProcessingRef.current && isConnectedRef.current && mediaRecorder.state === 'inactive') {
          mediaRecorder.start();
        }
      }, PROCESS_INTERVAL);

      // Start recording
      mediaRecorder.start();
      console.log('🎙️ Started audio recording');
    } catch (err) {
      console.error('Audio processing error:', err);
      isProcessingRef.current = false;
      setError(err instanceof Error ? err.message : 'Failed to process audio stream');
    }
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
      
      // Process any remaining audio chunks before disconnecting
      if (audioChunksRef.current.length > 0 && mediaRecorderRef.current) {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        try {
          const result = await processAudio(audioBlob);
          if (result) {
            if (result.transcription) {
              setTranscription(prev => prev + (prev ? ' ' : '') + result.transcription);
            }
            if (result.response) {
              setAiResponse(prev => prev + (prev ? ' ' : '') + result.response);
            }
          }
        } catch (error) {
          console.warn('⚠️ Could not process final audio:', error);
        }
      }
      
      // Clean up MediaRecorder
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current = null;
      }
      audioChunksRef.current = [];
      
      // Clean up audio context (if still using it)
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
        {aiConnectionStatus === 'connected' && (
          <div className="ai-connection-status">
            <div className={`status-indicator ${aiConnectionStatus}`} />
            <span className="status-text">AI: Connected</span>
          </div>
        )}
        
        {/* Error Messages */}
        {(error || aiError) && (
          <div className="error-message">
            <p><strong>Error:</strong> {error || aiError}</p>
            <p>Please try again or check your OpenAI API key and network connection.</p>
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
        {isProcessing && (
          <div className="processing-indicator">
            <div className="spinner" />
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

