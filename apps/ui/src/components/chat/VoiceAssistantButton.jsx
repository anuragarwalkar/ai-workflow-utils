import React, { useCallback } from 'react';
import {
  Box,
  Chip,
  CircularProgress,
  IconButton,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  Mic as MicIcon,
  MicOff as MicOffIcon,
  RecordVoiceOver as RecordVoiceOverIcon,
  VolumeOff as VolumeOffIcon,
  VolumeUp as VolumeUpIcon,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { useVoiceAssistant } from '../../hooks/useVoiceAssistant.js';

/**
 * Voice Assistant Button Component
 * Provides voice interaction controls integrated with the chat interface
 */

const VoiceContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  padding: theme.spacing(1),
  borderRadius: theme.shape.borderRadius,
  backgroundColor: theme.palette.background.paper,
  border: `1px solid ${theme.palette.divider}`,
}));

const VoiceButton = styled(IconButton)(({ theme, voiceActive }) => ({
  width: 48,
  height: 48,
  backgroundColor: voiceActive ? theme.palette.primary.main : theme.palette.action.hover,
  color: voiceActive ? theme.palette.primary.contrastText : theme.palette.text.primary,
  '&:hover': {
    backgroundColor: voiceActive ? theme.palette.primary.dark : theme.palette.action.selected,
  },
  ...(voiceActive && {
    animation: 'pulse 2s infinite',
  }),
  '@keyframes pulse': {
    '0%': { transform: 'scale(1)' },
    '50%': { transform: 'scale(1.1)' },
    '100%': { transform: 'scale(1)' },
  },
}));

const StatusChip = styled(Chip)(({ theme, status }) => ({
  fontSize: '0.75rem',
  height: 24,
  ...(status === 'listening' && {
    backgroundColor: theme.palette.error.main,
    color: theme.palette.error.contrastText,
    animation: 'blink 1s infinite',
  }),
  ...(status === 'speaking' && {
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
  }),
  '@keyframes blink': {
    '50%': { opacity: 0.5 },
  },
}));

export default function VoiceAssistantButton({ 
  sessionId, 
  _onVoiceMessage, 
  onVoiceError,
  disabled = false 
}) {
  const {
    voiceState,
    isRecording,
    isMuted,
    voiceSession,
    toggleVoiceAssistant,
    toggleRecording,
    toggleMute,
  } = useVoiceAssistant(sessionId, onVoiceError);

  const getStatusLabel = useCallback(() => {
    const statusMap = {
      connecting: 'Connecting...',
      connected: 'Voice Ready',
      listening: 'Listening',
      speaking: 'Speaking',
      error: 'Error',
      idle: 'Voice Assistant',
    };
    return statusMap[voiceState] || 'Voice Assistant';
  }, [voiceState]);

  const getStatusColor = useCallback(() => {
    const colorMap = {
      connecting: 'warning',
      listening: 'listening',
      speaking: 'speaking',
      error: 'error',
    };
    return colorMap[voiceState] || 'default';
  }, [voiceState]);

  const isVoiceActive = voiceState !== 'idle';
  const showLoading = voiceState === 'connecting';

  return (
    <VoiceContainer>
      <Tooltip title={isVoiceActive ? 'Stop Voice Assistant' : 'Start Voice Assistant'}>
        <VoiceButton
          disabled={disabled || showLoading}
          voiceActive={isVoiceActive}
          onClick={toggleVoiceAssistant}
        >
          {showLoading ? (
            <CircularProgress color="inherit" size={24} />
          ) : (
            <RecordVoiceOverIcon />
          )}
        </VoiceButton>
      </Tooltip>

      {isVoiceActive ? (
        <Tooltip title={isRecording ? 'Stop Recording' : 'Start Recording'}>
          <IconButton
            color={isRecording ? 'error' : 'default'}
            disabled={voiceState !== 'connected' && voiceState !== 'listening'}
            onClick={toggleRecording}
          >
            {isRecording ? <MicOffIcon /> : <MicIcon />}
          </IconButton>
        </Tooltip>
      ) : null}

      {isVoiceActive ? (
        <Tooltip title={isMuted ? 'Unmute' : 'Mute'}>
          <IconButton color={isMuted ? 'error' : 'default'} onClick={toggleMute}>
            {isMuted ? <VolumeOffIcon /> : <VolumeUpIcon />}
          </IconButton>
        </Tooltip>
      ) : null}

      <Box sx={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <StatusChip
          label={getStatusLabel()}
          size="small"
          status={getStatusColor()}
        />
        {isVoiceActive && voiceSession ? (
          <Typography noWrap color="text.secondary" variant="caption">
            Session: {voiceSession.sessionId?.slice(-8)}
          </Typography>
        ) : null}
      </Box>
    </VoiceContainer>
  );
}
