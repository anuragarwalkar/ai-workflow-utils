import { useCallback, useState } from 'react';

/**
 * Voice Session Hook
 * Manages voice session lifecycle with Gemini Live API
 */
export function useVoiceSession(sessionId, onVoiceError) {
  const [voiceState, setVoiceState] = useState('idle');
  const [voiceSession, setVoiceSession] = useState(null);

  /**
   * Initialize voice session with Gemini Live API
   */
  const initializeVoiceSession = useCallback(async () => {
    try {
      setVoiceState('connecting');

      const response = await fetch('/api/voice/session/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          template: 'CHAT_GENERIC',
          voice: 'Chime',
          language: 'en-US',
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setVoiceSession(data.data);
        setVoiceState('connected');
      } else {
        throw new Error(data.error || 'Failed to start voice session');
      }
    } catch (error) {
      setVoiceState('error');
      onVoiceError?.(error.message);
    }
  }, [sessionId, onVoiceError]);

  /**
   * Stop voice session
   */
  const stopVoiceSession = useCallback(async () => {
    try {
      if (voiceSession?.sessionId) {
        await fetch(`/api/voice/session/${voiceSession.sessionId}`, {
          method: 'DELETE',
        });
      }
      
      setVoiceSession(null);
      setVoiceState('idle');
    } catch (error) {
      onVoiceError?.(error.message);
    }
  }, [voiceSession, onVoiceError]);

  return {
    voiceState,
    voiceSession,
    initializeVoiceSession,
    stopVoiceSession,
    setVoiceState,
  };
}
