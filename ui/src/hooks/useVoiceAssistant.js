import { useCallback, useState } from 'react';
import { useVoiceRecording } from './useVoiceRecording.js';
import { useVoiceSession } from './useVoiceSession.js';

/**
 * Voice Assistant Custom Hook
 * Manages voice session state and audio recording functionality
 */
export function useVoiceAssistant(sessionId, onVoiceError) {
  const [isMuted, setIsMuted] = useState(false);
  
  const {
    voiceState,
    voiceSession,
    initializeVoiceSession,
    stopVoiceSession,
  } = useVoiceSession(sessionId, onVoiceError);

  const {
    isRecording,
    startRecording,
    stopRecording,
  } = useVoiceRecording(voiceSession, onVoiceError);

  /**
   * Toggle voice assistant on/off
   */
  const toggleVoiceAssistant = useCallback(async () => {
    if (voiceState === 'idle') {
      await initializeVoiceSession();
    } else if (voiceState === 'connected' || voiceState === 'listening') {
      await stopVoiceSession();
    }
  }, [voiceState, initializeVoiceSession, stopVoiceSession]);

  /**
   * Toggle recording
   */
  const toggleRecording = useCallback(() => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }, [isRecording, startRecording, stopRecording]);

  /**
   * Toggle audio mute
   */
  const toggleMute = useCallback(() => {
    setIsMuted(prev => !prev);
  }, []);

  return {
    voiceState,
    isRecording,
    isMuted,
    voiceSession,
    toggleVoiceAssistant,
    toggleRecording,
    toggleMute,
  };
}
