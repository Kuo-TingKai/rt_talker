'use client';

import { useState, useRef, useCallback } from 'react';

interface AIResult {
  transcription?: string;
  response?: string;
}

interface RealtimeMessage {
  type: string;
  event?: string;
  item?: {
    type?: string;
    transcript?: string;
    content?: string;
  };
  delta?: {
    transcript?: string;
  };
}

export function useOpenAIRealtime() {
  const [isProcessing, setIsProcessing] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const transcriptionRef = useRef<string>('');
  const responseRef = useRef<string>('');
  const updateCallbackRef = useRef<((transcription: string, response: string) => void) | null>(null);

  // Set callback to update UI
  const setUpdateCallback = useCallback((callback: (transcription: string, response: string) => void) => {
    updateCallbackRef.current = callback;
  }, []);

  // Handle messages from OpenAI Realtime API
  const handleRealtimeMessage = useCallback((message: RealtimeMessage) => {
    let updated = false;
    
    if (message.type === 'response.audio_transcript.delta') {
      // Update transcription
      if (message.delta?.transcript) {
        transcriptionRef.current += message.delta.transcript;
        updated = true;
      }
    } else if (message.type === 'response.audio_transcript.done') {
      // Transcription complete
      if (message.item?.transcript) {
        transcriptionRef.current = message.item.transcript;
        updated = true;
      }
    } else if (message.type === 'response.content.delta') {
      // Update AI response text
      if (message.delta?.content) {
        responseRef.current += message.delta.content;
        updated = true;
      }
    } else if (message.type === 'response.content.done') {
      // Response complete
      if (message.item?.content) {
        responseRef.current = message.item.content;
        updated = true;
      }
    } else if (message.type === 'response.audio.delta') {
      // Audio response data (would need to be played)
      setIsProcessing(true);
    } else if (message.type === 'response.audio.done') {
      setIsProcessing(false);
    } else if (message.type === 'session.created') {
      console.log('✅ Session created successfully');
      console.log('Session details:', JSON.stringify(message, null, 2));
    } else if (message.type === 'session.updated') {
      console.log('✅ Session updated successfully');
      console.log('Session details:', JSON.stringify(message, null, 2));
    } else if (message.type === 'error') {
      const errorDetails = (message as any).error;
      console.error('❌ OpenAI Realtime API error:', {
        type: errorDetails?.type,
        message: errorDetails?.message,
        code: errorDetails?.code,
        param: errorDetails?.param,
        fullError: errorDetails,
      });
      
      // Log the full message for debugging
      console.error('Full error message:', JSON.stringify(message, null, 2));
    } else if (message.type === 'input_audio_buffer.speech_started') {
      console.log('🎤 Speech detected');
    } else if (message.type === 'input_audio_buffer.speech_stopped') {
      console.log('🔇 Speech stopped');
    } else {
      // Log other message types for debugging
      console.log('📨 OpenAI message type:', message.type);
    }

    // Notify UI of updates
    if (updated && updateCallbackRef.current) {
      updateCallbackRef.current(transcriptionRef.current, responseRef.current);
    }
  }, []);

  // Initialize WebSocket connection to OpenAI Realtime API
  // Note: Browser WebSocket cannot set Authorization header directly
  // We need to use a backend proxy for production, but for now we'll try the query parameter approach
  const initWebSocket = useCallback((): Promise<WebSocket> => {
    return new Promise((resolve, reject) => {
      const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY;
      if (!apiKey) {
        reject(new Error('OpenAI API key not found'));
        return;
      }

      // Use backend WebSocket proxy for OpenAI Realtime API
      // The backend handles authentication with OpenAI
      const wsUrl = `ws://localhost:3001/api/openai-realtime`;
      
      console.log('Connecting to OpenAI Realtime API via backend proxy...');
      
      const ws = new WebSocket(wsUrl);

      // Set a timeout for connection
      const connectionTimeout = setTimeout(() => {
        if (ws.readyState !== WebSocket.OPEN) {
          ws.close();
          reject(new Error('Connection timeout'));
        }
      }, 10000);

      ws.onopen = () => {
        clearTimeout(connectionTimeout);
        console.log('✅ OpenAI Realtime API WebSocket connected');
        
        // Wait a moment before sending session.update
        // Some WebSocket implementations need a brief delay
        setTimeout(() => {
          // Try the absolute minimal configuration first
          // Some parameters might be causing server_error
          const minimalConfig = {
            type: 'session.update',
            session: {
              // Only set what's absolutely necessary
              modalities: ['text'],
            },
          };
          
          console.log('📤 Step 1: Sending minimal session.update (text only)');
          console.log('Config:', JSON.stringify(minimalConfig, null, 2));
          
          try {
            ws.send(JSON.stringify(minimalConfig));
          } catch (error) {
            console.error('❌ Error sending minimal config:', error);
            reject(error);
            return;
          }
          
          // Wait for session.updated confirmation before adding audio
          // We'll add audio in a separate step after confirming text works
          const addAudioTimeout = setTimeout(() => {
            if (ws.readyState === WebSocket.OPEN && wsRef.current === ws) {
              console.log('📤 Step 2: Adding audio modality...');
              const audioConfig = {
                type: 'session.update',
                session: {
                  modalities: ['text', 'audio'],
                  voice: 'alloy',
                  input_audio_format: 'pcm16',
                  output_audio_format: 'pcm16',
                },
              };
              console.log('Config:', JSON.stringify(audioConfig, null, 2));
              
              try {
                ws.send(JSON.stringify(audioConfig));
              } catch (error) {
                console.error('❌ Error adding audio config:', error);
              }
            }
          }, 1000); // Wait 1 second for first config to be processed
          
          // Store timeout to clear if connection closes
          (ws as any)._addAudioTimeout = addAudioTimeout;
        }, 300); // Increased delay to ensure connection is stable

        wsRef.current = ws;
        resolve(ws);
      };

      ws.onerror = (error) => {
        clearTimeout(connectionTimeout);
        console.error('WebSocket error:', error);
        // Don't reject immediately, let onclose handle it
      };

      ws.onmessage = async (event) => {
        try {
          let data: string;
          
          // Handle different data types (Blob, ArrayBuffer, or string)
          if (event.data instanceof Blob) {
            data = await event.data.text();
          } else if (event.data instanceof ArrayBuffer) {
            data = new TextDecoder().decode(event.data);
          } else {
            data = event.data as string;
          }
          
          // Parse JSON message
          const message: RealtimeMessage = JSON.parse(data);
          
          // Log message type for debugging
          if (message.type === 'error') {
            console.error('❌ OpenAI error message received');
          } else if (message.type.startsWith('response.')) {
            console.log('📥 OpenAI response:', message.type);
          } else {
            console.log('📨 OpenAI message:', message.type);
          }
          
          handleRealtimeMessage(message);
        } catch (error) {
          console.error('❌ Error parsing message:', error);
          if (error instanceof Error) {
            console.error('Error message:', error.message);
          }
          console.error('Received data type:', typeof event.data);
          if (typeof event.data === 'string') {
            console.error('Received data (first 200 chars):', event.data.substring(0, 200));
          }
        }
      };

      ws.onclose = (event) => {
        clearTimeout(connectionTimeout);
        // Clear any pending timeouts
        if ((ws as any)._addAudioTimeout) {
          clearTimeout((ws as any)._addAudioTimeout);
        }
        console.log('WebSocket closed', event.code, event.reason);
        wsRef.current = null;
        // Only reject if we haven't resolved yet
        if (ws.readyState !== WebSocket.CLOSED || event.code !== 1000) {
          // Connection closed unexpectedly
        }
      };
    });
  }, [handleRealtimeMessage]);

  // Process audio with OpenAI Realtime API
  const processAudioWithAI = useCallback(async (audioData: Int16Array): Promise<AIResult | null> => {
    try {
      // Ensure WebSocket is connected
      let ws = wsRef.current;
      if (!ws || ws.readyState !== WebSocket.OPEN) {
        console.log('WebSocket not ready, initializing...');
        ws = await initWebSocket();
        // Wait longer for session to be fully ready
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      // Check if session is ready (wait for session.created or session.updated)
      // For now, we'll just proceed and let errors surface

      // Convert Int16Array to base64
      // OpenAI Realtime API expects PCM16 audio as base64-encoded string
      // PCM16 is 16-bit signed integers (little-endian)
      const buffer = new Uint8Array(audioData.buffer);
      
      // Use a more efficient base64 encoding method
      let binaryString = '';
      for (let i = 0; i < buffer.length; i++) {
        binaryString += String.fromCharCode(buffer[i]);
      }
      const base64Audio = btoa(binaryString);

      // Send audio data to OpenAI Realtime API
      if (ws.readyState === WebSocket.OPEN) {
        const audioMessage = {
          type: 'input_audio_buffer.append',
          audio: base64Audio,
        };
        
        // Log audio data size for debugging
        const audioSizeKB = (base64Audio.length * 3 / 4) / 1024; // Approximate size in KB
        console.log(`🎤 Sending audio chunk: ${audioData.length} samples, ${base64Audio.length} base64 chars (~${audioSizeKB.toFixed(2)} KB)`);
        
        // Check if audio data is too large (OpenAI may have limits)
        if (base64Audio.length > 100000) { // ~75KB of audio data
          console.warn('⚠️ Audio chunk is large, splitting might be needed');
        }
        
        try {
          ws.send(JSON.stringify(audioMessage));
          setIsProcessing(true);
        } catch (error) {
          console.error('❌ Error sending audio message:', error);
          setIsProcessing(false);
          return null;
        }
      } else {
        console.warn('⚠️ WebSocket not open, cannot send audio. State:', ws.readyState);
        return null;
      }

      // Return current transcription and response
      return {
        transcription: transcriptionRef.current,
        response: responseRef.current,
      };
    } catch (error) {
      console.error('AI processing error:', error);
      setIsProcessing(false);
      return null;
    }
  }, [initWebSocket, handleRealtimeMessage]);

  // Trigger response generation (call this after sending audio)
  const triggerResponse = useCallback(() => {
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      // First, commit the audio buffer to indicate we're done sending audio
      try {
        ws.send(JSON.stringify({
          type: 'input_audio_buffer.commit',
        }));
        console.log('📤 Committed audio buffer');
      } catch (error) {
        console.error('❌ Error committing audio buffer:', error);
      }
      
      // Then create response
      setTimeout(() => {
        const responseMessage = {
          type: 'response.create',
          response: {
            modalities: ['text', 'audio'],
          },
        };
        
        console.log('📤 Triggering response generation');
        try {
          ws.send(JSON.stringify(responseMessage));
        } catch (error) {
          console.error('❌ Error creating response:', error);
        }
      }, 100); // Small delay after commit
    } else {
      console.warn('⚠️ Cannot trigger response: WebSocket not ready. State:', ws?.readyState);
    }
  }, []);

  // Cleanup WebSocket connection
  const cleanup = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    transcriptionRef.current = '';
    responseRef.current = '';
    setIsProcessing(false);
  }, []);

  return {
    processAudioWithAI,
    triggerResponse,
    isProcessing,
    cleanup,
    setUpdateCallback,
    getCurrentTranscription: () => transcriptionRef.current,
    getCurrentResponse: () => responseRef.current,
  };
}

