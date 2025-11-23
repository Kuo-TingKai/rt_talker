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
    content?: string;
  };
}

export function useOpenAIRealtime() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const wsRef = useRef<WebSocket | null>(null);
  const transcriptionRef = useRef<string>('');
  const responseRef = useRef<string>('');
  const updateCallbackRef = useRef<((transcription: string, response: string) => void) | null>(null);
  const sessionReadyRef = useRef<boolean>(false);
  const pendingAudioRef = useRef<Int16Array[]>([]);
  const processPendingAudioRef = useRef<(() => Promise<void>) | null>(null);
  const triggerResponseRef = useRef<(() => void) | null>(null);
  const reconnectAttemptsRef = useRef<number>(0);
  const maxReconnectAttempts = 3;

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
      
      // Check if audio modality is already included in session.created
      const session = (message as any).session;
      const modalities = session?.modalities || [];
      console.log('Session modalities from session.created:', modalities);
      
      // If audio is already included, wait a bit before marking as ready
      // OpenAI needs time to fully initialize the audio processing pipeline
      if (modalities.includes('audio')) {
        console.log('✅ Audio modality already included in session.created');
        // Cancel Step 2 if it's scheduled
        if (wsRef.current && (wsRef.current as any)._addAudioTimeout) {
          clearTimeout((wsRef.current as any)._addAudioTimeout);
          (wsRef.current as any)._addAudioTimeout = null;
          console.log('⏭️ Skipping Step 2 (audio already included)');
        }
        // Wait longer before marking as ready and sending audio
        // OpenAI needs time to fully initialize audio processing
        setTimeout(() => {
          sessionReadyRef.current = true;
          console.log('✅ Session is now ready for audio (after initialization delay)');
          
          // Don't send empty commit - it might cause server_error
          // Just mark session as ready and wait for actual audio to arrive
          
          // Process any pending audio after session is confirmed ready
          // Add additional delay before processing to ensure everything is ready
          setTimeout(() => {
            // Don't process old pending audio - it might cause server_error
            // Instead, discard it and wait for new audio to arrive
            if (pendingAudioRef.current.length > 0) {
              console.log(`📤 Discarding ${pendingAudioRef.current.length} old pending audio chunks to avoid server_error`);
              pendingAudioRef.current = [];
            }
            
            // Check if there's a pending response trigger after processing audio
            // Wait longer to ensure audio processing is complete before triggering response
            const ws = wsRef.current;
            if (ws && (ws as any)._pendingResponseTrigger && triggerResponseRef.current) {
              (ws as any)._pendingResponseTrigger = false;
              console.log('📤 Processing pending response trigger now that session is ready');
              setTimeout(() => {
                // Double-check session is still ready before triggering
                if (sessionReadyRef.current && ws && ws.readyState === WebSocket.OPEN) {
                  triggerResponseRef.current?.();
                } else {
                  console.warn('⚠️ Session no longer ready, skipping pending response trigger');
                }
              }, 2000); // Increased delay to 2 seconds to ensure audio is fully processed
            }
          }, 1000); // Wait 1 second before processing pending audio
        }, 6000); // Increased delay to 6 seconds for full initialization
      } else {
        console.log('⏳ Audio modality not in session.created, waiting for Step 2...');
      }
    } else if (message.type === 'session.updated') {
      console.log('✅ Session updated successfully');
      const session = (message as any).session;
      const modalities = session?.modalities || [];
      console.log('Session modalities:', modalities);
      
      // Only mark as ready if audio modality is present
      if (modalities.includes('audio')) {
        sessionReadyRef.current = true;
        console.log('✅ Session is now ready for audio (audio modality confirmed via session.updated)');
        // Process any pending audio
        setTimeout(() => {
          if (sessionReadyRef.current && pendingAudioRef.current.length > 0 && processPendingAudioRef.current) {
            console.log('📤 Processing pending audio chunks from session.updated');
            processPendingAudioRef.current();
          }
          
          // Check if there's a pending response trigger after processing audio
          const ws = wsRef.current;
          if (ws && (ws as any)._pendingResponseTrigger && triggerResponseRef.current) {
            (ws as any)._pendingResponseTrigger = false;
            console.log('📤 Processing pending response trigger now that session is ready');
            setTimeout(() => {
              triggerResponseRef.current?.();
            }, 300); // Small delay before triggering response
          }
        }, 500); // Increased delay to ensure audio processing is complete
      } else {
        console.log('⏳ Session updated but audio modality not yet added');
      }
    } else if (message.type === 'error') {
      const errorDetails = (message as any).error;
      const errorType = errorDetails?.type || 'unknown_error';
      const errorMessage = errorDetails?.message || 'An unknown error occurred';
      
      console.error('❌ OpenAI Realtime API error:', {
        type: errorType,
        message: errorMessage,
        code: errorDetails?.code,
        param: errorDetails?.param,
        fullError: errorDetails,
      });
      
      // Log the full message for debugging
      console.error('Full error message:', JSON.stringify(message, null, 2));
      
      // Set user-friendly error message
      let userFriendlyMessage = 'An error occurred while processing your request.';
      
      if (errorType === 'server_error') {
        userFriendlyMessage = 'OpenAI server encountered an error. This may be a temporary issue. Please try again.';
      } else if (errorType === 'invalid_request_error') {
        userFriendlyMessage = 'Invalid request. Please check your configuration.';
      } else if (errorType === 'authentication_error') {
        userFriendlyMessage = 'Authentication failed. Please check your API key.';
      } else if (errorType === 'rate_limit_error') {
        userFriendlyMessage = 'Rate limit exceeded. Please wait a moment and try again.';
      }
      
      setError(userFriendlyMessage);
      setConnectionStatus('disconnected');
      
      // Don't automatically reconnect on server_error - it might be a persistent issue
      // Let the user manually retry or wait for the next audio chunk to trigger reconnection
      console.warn('⚠️ Server error received, will not auto-reconnect. Next audio chunk will trigger reconnection.');
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
        const errorMsg = 'OpenAI API key not found. Please check your environment variables.';
        setError(errorMsg);
        reject(new Error(errorMsg));
        return;
      }

      // Use backend WebSocket proxy for OpenAI Realtime API
      // The backend handles authentication with OpenAI
      const wsUrl = `ws://localhost:3001/api/openai-realtime`;
      
      console.log('Connecting to OpenAI Realtime API via backend proxy...');
      setConnectionStatus('connecting');
      setError(null);
      
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
        setConnectionStatus('connected');
        setError(null);
        reconnectAttemptsRef.current = 0; // Reset reconnect attempts on successful connection
        
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
          
          // Wait for session.created confirmation before adding audio
          // Only add audio if it's not already included in session.created
          // OpenAI sometimes includes audio modality by default
          const addAudioTimeout = setTimeout(() => {
            if (ws.readyState === WebSocket.OPEN && wsRef.current === ws) {
              // Check if session is already ready (audio was included in session.created)
              if (sessionReadyRef.current) {
                console.log('⏭️ Skipping Step 2 - audio already included in session.created');
                return;
              }
              
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
                console.log('✅ Audio modality config sent, waiting for session.updated...');
              } catch (error) {
                console.error('❌ Error adding audio config:', error);
              }
            }
          }, 1000); // Wait 1 second for session.created to be processed
          
          // Store timeout to clear if connection closes
          (ws as any)._addAudioTimeout = addAudioTimeout;
        }, 300); // Increased delay to ensure connection is stable

        wsRef.current = ws;
        resolve(ws);
      };

      ws.onerror = (error) => {
        clearTimeout(connectionTimeout);
        console.error('WebSocket error:', error);
        setError('Connection error occurred. Please try again.');
        setConnectionStatus('disconnected');
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
        setConnectionStatus('disconnected');
        sessionReadyRef.current = false; // Reset session ready state
        pendingAudioRef.current = []; // Clear pending audio
        
        // Handle unexpected disconnections
        if (event.code !== 1000) {
          // Connection closed unexpectedly
          if (reconnectAttemptsRef.current < maxReconnectAttempts) {
            reconnectAttemptsRef.current++;
            const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current - 1), 10000); // Exponential backoff, max 10s
            console.log(`🔄 Attempting to reconnect (${reconnectAttemptsRef.current}/${maxReconnectAttempts}) in ${delay}ms...`);
            setError(`Connection lost. Reconnecting... (${reconnectAttemptsRef.current}/${maxReconnectAttempts})`);
            
            setTimeout(() => {
              if (wsRef.current === null) { // Only reconnect if not already connected
                setConnectionStatus('connecting');
                initWebSocket().catch((err) => {
                  console.error('Reconnection failed:', err);
                  if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
                    setError('Failed to reconnect. Please try again manually.');
                  }
                });
              }
            }, delay);
          } else {
            setError('Connection failed after multiple attempts. Please try again.');
          }
        }
      };
    });
  }, [handleRealtimeMessage]);

  // Send audio data to WebSocket (defined first to avoid dependency issues)
  const sendAudioData = useCallback(async (ws: WebSocket, audioData: Int16Array) => {
    // Validate audio data first
    if (audioData.length === 0) {
      console.warn('⚠️ Attempting to send empty audio data');
      return;
    }
    
    // Check for invalid values (NaN, Infinity)
    for (let i = 0; i < audioData.length; i++) {
      if (!isFinite(audioData[i]) || isNaN(audioData[i])) {
        console.error(`❌ Invalid audio sample at index ${i}: ${audioData[i]}`);
        // Replace with 0
        audioData[i] = 0;
      }
    }
    
    // Check for silent audio (all zeros or very small values)
    const maxValue = Math.max(...Array.from(audioData).map(Math.abs));
    if (maxValue < 100) {
      console.warn(`⚠️ Audio data appears to be silent or very quiet (max value: ${maxValue})`);
      // Still send it, but log a warning
    }
    
    // Additional validation: ensure all samples are within valid range
    const minSample = Math.min(...Array.from(audioData));
    const maxSample = Math.max(...Array.from(audioData));
    if (minSample < -32768 || maxSample > 32767) {
      console.error(`❌ Audio samples out of range: min=${minSample}, max=${maxSample}`);
      // Clamp values
      for (let i = 0; i < audioData.length; i++) {
        audioData[i] = Math.max(-32768, Math.min(32767, audioData[i]));
      }
    }
    
    // Convert Int16Array to base64
    // OpenAI Realtime API expects PCM16 audio in little-endian byte order
    // Int16Array is already in the correct format (little-endian on most systems)
    // Create a view of the underlying ArrayBuffer as Uint8Array
    const buffer = new Uint8Array(audioData.buffer, audioData.byteOffset, audioData.byteLength);
    
    // Convert to base64 - OpenAI expects raw PCM16 bytes as base64
    // Use a simpler, more direct approach
    // Convert Uint8Array to base64 using the standard method
    let binaryString = '';
    const chunkSize = 8192;
    for (let i = 0; i < buffer.length; i += chunkSize) {
      const chunk = buffer.slice(i, Math.min(i + chunkSize, buffer.length));
      // Convert chunk to binary string
      for (let j = 0; j < chunk.length; j++) {
        binaryString += String.fromCharCode(chunk[j]);
      }
    }
    const base64Audio = btoa(binaryString);
    
    // Debug: Log first few bytes to verify format
    if (audioData.length > 0) {
      const firstSample = audioData[0];
      const firstBytes = buffer.slice(0, 2);
      console.log(`🔍 Audio format check - First sample: ${firstSample}, First bytes: [${firstBytes[0]}, ${firstBytes[1]}]`);
    }

    const audioMessage = {
      type: 'input_audio_buffer.append',
      audio: base64Audio,
    };
    
    const audioSizeKB = (base64Audio.length * 3 / 4) / 1024;
    console.log(`🎤 Sending audio chunk: ${audioData.length} samples, ${base64Audio.length} base64 chars (~${audioSizeKB.toFixed(2)} KB)`);
    
    if (base64Audio.length > 100000) {
      console.warn('⚠️ Audio chunk is large, splitting might be needed');
    }
    
    try {
      ws.send(JSON.stringify(audioMessage));
      setIsProcessing(true);
    } catch (error) {
      console.error('❌ Error sending audio message:', error);
      throw error;
    }
  }, []);

  // Process pending audio once session is ready
  const processPendingAudio = useCallback(async () => {
    if (!sessionReadyRef.current || pendingAudioRef.current.length === 0) {
      return;
    }
    
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      return;
    }
    
    console.log(`📤 Processing ${pendingAudioRef.current.length} pending audio chunks`);
    
    // Don't send all pending chunks at once - this might overwhelm the server
    // Instead, only send the most recent chunks and discard older ones
    // This prevents sending stale audio data
    const chunksToProcess = pendingAudioRef.current.slice(-2); // Only keep last 2 chunks
    pendingAudioRef.current = [];
    
    console.log(`📤 Sending only ${chunksToProcess.length} most recent chunks (discarding older ones)`);
    
    // Add a delay before sending first chunk to ensure session is fully ready
    await new Promise(resolve => setTimeout(resolve, 200));
    
    for (const audioData of chunksToProcess) {
      try {
        await sendAudioData(ws, audioData);
        // Increased delay between chunks to avoid overwhelming the server
        await new Promise(resolve => setTimeout(resolve, 200)); // Increased from 50ms to 200ms
      } catch (error) {
        console.error('❌ Error processing pending audio:', error);
        // Stop processing if we get an error
        break;
      }
    }
  }, [sendAudioData]);
  
  // Update ref when function is defined
  processPendingAudioRef.current = processPendingAudio;

  // Process audio with OpenAI Realtime API
  const processAudioWithAI = useCallback(async (audioData: Int16Array): Promise<AIResult | null> => {
    try {
      // Ensure WebSocket is connected
      let ws = wsRef.current;
      if (!ws || ws.readyState !== WebSocket.OPEN) {
        console.log('🔌 WebSocket not ready, initializing...');
        console.log('   Current WebSocket state:', ws?.readyState, ws ? 'exists' : 'null');
        ws = await initWebSocket();
        console.log('✅ WebSocket initialized, state:', ws.readyState);
        // Wait for session to be ready
        let waitCount = 0;
        while (!sessionReadyRef.current && waitCount < 20) {
          await new Promise(resolve => setTimeout(resolve, 100));
          waitCount++;
        }
        if (!sessionReadyRef.current) {
          console.warn('⚠️ Session not ready after waiting, queueing audio');
          pendingAudioRef.current.push(audioData);
          console.log(`   Queued audio, total queued: ${pendingAudioRef.current.length} chunks`);
          return null;
        }
      }
      
      // Check if session is ready
      if (!sessionReadyRef.current) {
        console.log('⏳ Session not ready yet, queueing audio...');
        pendingAudioRef.current.push(audioData);
        console.log(`   Queued audio, total queued: ${pendingAudioRef.current.length} chunks`);
        return null;
      }
      
      // Session is ready, send audio
      console.log('🎤 Sending audio data, WebSocket state:', ws.readyState);
      await sendAudioData(ws, audioData);
      console.log('✅ Audio sent successfully');
      
      // Return current transcription and response
      const result = {
        transcription: transcriptionRef.current,
        response: responseRef.current,
      };
      console.log('📊 Current state - transcription length:', result.transcription.length, 'response length:', result.response.length);
      return result;
    } catch (error) {
      console.error('❌ AI processing error:', error);
      setIsProcessing(false);
      return null;
    }
  }, [initWebSocket, sendAudioData]);

  // Trigger response generation (call this after sending audio)
  const triggerResponse = useCallback(() => {
    const ws = wsRef.current;
    
    // Check if WebSocket is open
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      console.warn('⚠️ Cannot trigger response: WebSocket not ready. State:', ws?.readyState);
      return;
    }
    
    // Check if session is ready for audio
    if (!sessionReadyRef.current) {
      console.warn('⚠️ Cannot trigger response: Session not ready yet. Waiting for session initialization...');
      // Queue the response trigger to be called once session is ready
      // We'll use a flag to track if we need to trigger response after session becomes ready
      (ws as any)._pendingResponseTrigger = true;
      return;
    }
    
    // With server VAD, we don't need to manually commit
    // The server will automatically detect speech and create responses
    // However, we can still trigger a response if needed
    // For now, let's try without commit and see if it works better
    
    // Note: With server_vad, commit might not be necessary
    // But we'll try a different approach: only commit if we haven't sent audio recently
    // For now, let's skip commit and let server VAD handle it
    
    // Create response directly (server VAD should handle speech detection)
    // Double-check session is still ready
    if (!sessionReadyRef.current || !ws || ws.readyState !== WebSocket.OPEN) {
      console.warn('⚠️ Session no longer ready, skipping response creation');
      return;
    }
    
    // With server VAD, we might not need to manually create response
    // The server should automatically create responses when it detects speech
    // But we can still try to create a response if needed
    console.log('📤 Server VAD should handle response creation automatically');
    
    // Try committing first (even with server VAD, this might help)
    try {
      ws.send(JSON.stringify({
        type: 'input_audio_buffer.commit',
      }));
      console.log('📤 Committed audio buffer (with server VAD, this may not be necessary)');
    } catch (error) {
      console.error('❌ Error committing audio buffer:', error);
      return;
    }
    
    // Then create response after a short delay
    setTimeout(() => {
      // Double-check session is still ready
      if (!sessionReadyRef.current || !ws || ws.readyState !== WebSocket.OPEN) {
        console.warn('⚠️ Session no longer ready, skipping response creation');
        return;
      }
      
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
    }, 500);
  }, []);

  // Cleanup WebSocket connection
  const cleanup = useCallback(() => {
    // Clear any pending timeouts
    if (wsRef.current && (wsRef.current as any)._addAudioTimeout) {
      clearTimeout((wsRef.current as any)._addAudioTimeout);
    }
    
    if (wsRef.current) {
      // Only close if not already closed
      if (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING) {
        wsRef.current.close(1000, 'User requested disconnect');
      }
      wsRef.current = null;
    }
    
    // Clear all refs and state
    transcriptionRef.current = '';
    responseRef.current = '';
    sessionReadyRef.current = false;
    pendingAudioRef.current = [];
    setIsProcessing(false);
    setConnectionStatus('disconnected');
    reconnectAttemptsRef.current = 0;
    setError(null);
  }, []);
  
  // Manual retry function
  const retry = useCallback(async () => {
    reconnectAttemptsRef.current = 0;
    setError(null);
    cleanup();
    await new Promise(resolve => setTimeout(resolve, 500)); // Small delay before retry
    try {
      await initWebSocket();
    } catch (error) {
      console.error('Retry failed:', error);
      setError('Failed to reconnect. Please check your connection and try again.');
    }
  }, [initWebSocket, cleanup]);

  // Store triggerResponse in ref for use in handleRealtimeMessage
  triggerResponseRef.current = triggerResponse;
  
  return {
    processAudioWithAI,
    triggerResponse,
    isProcessing,
    error,
    connectionStatus,
    retry,
    cleanup,
    setUpdateCallback,
    getCurrentTranscription: () => transcriptionRef.current,
    getCurrentResponse: () => responseRef.current,
  };
}

