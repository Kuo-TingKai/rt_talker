import { useState, useCallback, useRef } from 'react';

export interface AIResult {
  transcription: string;
  response: string;
}

export function useOpenAIWhisperChat() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connected'>('disconnected');
  
  const conversationHistoryRef = useRef<Array<{ role: 'user' | 'assistant'; content: string }>>([]);

  // Transcribe audio using Whisper API
  const transcribeAudio = useCallback(async (audioBlob: Blob): Promise<string | null> => {
    try {
      setIsProcessing(true);
      setError(null);

      // Convert Blob to base64
      const reader = new FileReader();
      const base64Audio = await new Promise<string>((resolve, reject) => {
        reader.onloadend = () => {
          const result = reader.result as string;
          // Remove data URL prefix (e.g., "data:audio/webm;base64,")
          const base64 = result.includes(',') ? result.split(',')[1] : result;
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(audioBlob);
      });

      console.log('📤 Sending audio to Whisper API, blob size:', audioBlob.size, 'bytes, base64 length:', base64Audio.length);

      // Send to backend Whisper API
      const response = await fetch('http://localhost:3001/api/whisper', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ audio: base64Audio }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('❌ Whisper API error details:', errorData);
        const errorMessage = errorData.error || errorData.details?.error?.message || 'Failed to transcribe audio';
        throw new Error(errorMessage);
      }

      const result = await response.json();
      return result.transcription || null;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('❌ Transcription error:', errorMessage);
      setError(errorMessage);
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  // Get AI response using Chat API
  const getAIResponse = useCallback(async (transcription: string): Promise<string | null> => {
    try {
      setIsProcessing(true);
      setError(null);

      // Add user message to conversation history
      conversationHistoryRef.current.push({
        role: 'user',
        content: transcription,
      });

      // Prepare messages for Chat API (include system message and conversation history)
      const messages = [
        {
          role: 'system' as const,
          content: 'You are a helpful, witty, and friendly AI assistant. Act like a human, but remember that you aren\'t a human and that you can\'t do human things in the real world. Your voice and personality should be warm and engaging, with a lively and playful tone. Talk quickly and concisely.',
        },
        ...conversationHistoryRef.current,
      ];

      // Send to backend Chat API
      const response = await fetch('http://localhost:3001/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messages }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || 'Failed to get AI response');
      }

      const result = await response.json();
      const aiResponse = result.response || '';

      // Add assistant response to conversation history
      if (aiResponse) {
        conversationHistoryRef.current.push({
          role: 'assistant',
          content: aiResponse,
        });
      }

      return aiResponse;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('❌ Chat API error:', errorMessage);
      setError(errorMessage);
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  // Process audio: transcribe and get AI response
  const processAudio = useCallback(async (audioBlob: Blob): Promise<AIResult | null> => {
    try {
      setConnectionStatus('connected');
      
      // Step 1: Transcribe audio
      const transcription = await transcribeAudio(audioBlob);
      if (!transcription) {
        return null;
      }

      // Step 2: Get AI response
      const response = await getAIResponse(transcription);
      
      return {
        transcription,
        response: response || '',
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('❌ Process audio error:', errorMessage);
      setError(errorMessage);
      return null;
    }
  }, [transcribeAudio, getAIResponse]);

  // Reset conversation history
  const resetConversation = useCallback(() => {
    conversationHistoryRef.current = [];
    setConnectionStatus('disconnected');
    setError(null);
  }, []);

  return {
    processAudio,
    isProcessing,
    error,
    connectionStatus,
    resetConversation,
  };
}

