/**
 * Chat input component with message input, send button, and future feature placeholders
 * Styled similar to ChatGPT interface
 */

import React from 'react';
import {
  Box,
  IconButton,
  InputBase,
  Paper,
  Tooltip,
} from '@mui/material';
import {
  AttachFile as AttachFileIcon,
  Mic as MicIcon,
  PhotoCamera as PhotoIcon,
  Search as SearchIcon,
  Send as SendIcon,
  Stop as StopIcon,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { createLogger } from '../../utils/log.js';

const logger = createLogger('ChatInput');

const InputContainer = styled(Paper)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  borderRadius: '28px',
  border: `2px solid ${theme.palette.divider}`,
  backgroundColor: theme.palette.background.paper,
  boxShadow: theme.shadows[2],
  transition: 'all 0.2s ease-in-out',
  padding: '4px',
  minHeight: '56px',
  maxWidth: '800px',
  width: '100%',
  margin: '0 auto',
  '&:focus-within': {
    boxShadow: theme.shadows[4],
    borderColor: theme.palette.primary.main,
  },
}));

const StyledInputBase = styled(InputBase)(({ theme }) => ({
  flex: 1,
  padding: '14px 20px',
  fontSize: '16px',
  lineHeight: '1.5',
  '& .MuiInputBase-input': {
    padding: 0,
    '&::placeholder': {
      color: theme.palette.text.secondary,
      opacity: 0.7,
    },
  },
}));

const ActionButton = styled(IconButton)(({ theme, variant }) => ({
  margin: '0 4px',
  padding: '8px',
  color: variant === 'primary' ? theme.palette.primary.main : theme.palette.text.secondary,
  '&:hover': {
    backgroundColor: variant === 'primary' 
      ? `${theme.palette.primary.main  }10` 
      : theme.palette.action.hover,
  },
  '&:disabled': {
    color: theme.palette.action.disabled,
  },
}));

const FeatureButton = styled(IconButton)(({ theme }) => ({
  margin: '0 2px',
  padding: '6px',
  color: theme.palette.text.secondary,
  fontSize: '20px',
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
    color: theme.palette.text.primary,
  },
}));

const FeaturesContainer = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  paddingLeft: '8px',
});

const ChatInput = ({
  value,
  onChange,
  onSend,
  onKeyPress,
  disabled = false,
  isLoading = false,
  isRecording = false,
  onStartRecording,
  onStopRecording,
  onFileUpload,
  placeholder = "Message AI Assistant...",
}) => {
  const handleSendClick = () => {
    logger.info('handleSendClick', 'Send button clicked', { hasValue: !!value });
    
    if (value.trim() && !disabled && !isLoading) {
      onSend();
    }
  };

  const handleFileUpload = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      logger.info('handleFileUpload', 'File selected', { 
        fileName: file.name, 
        fileSize: file.size 
      });
      
      if (onFileUpload) {
        onFileUpload(file);
      } else {
        logger.info('handleFileUpload', 'File upload not yet implemented');
        // TODO: Show toast notification
      }
    }
  };

  const handleFeatureClick = (featureName) => {
    logger.info('handleFeatureClick', `${featureName} clicked`);
    // TODO: Implement feature-specific functionality
  };

  const canSend = value.trim() && !disabled && !isLoading;

  return (
    <Box sx={{ width: '100%', maxWidth: '768px', margin: '0 auto' }}>
      <InputContainer elevation={0}>
        {/* Future Features - Placeholders */}
        <FeaturesContainer>
          <Tooltip title="Attach file (Coming soon)">
            <FeatureButton 
              component="label"
              size="small"
              onClick={() => handleFeatureClick('attach')}
            >
              <AttachFileIcon fontSize="inherit" />
              <input
                hidden
                accept="image/*,.pdf,.doc,.docx,.txt"
                type="file"
                onChange={handleFileUpload}
              />
            </FeatureButton>
          </Tooltip>

          <Tooltip title="Take photo (Coming soon)">
            <FeatureButton 
              size="small"
              onClick={() => handleFeatureClick('photo')}
            >
              <PhotoIcon fontSize="inherit" />
            </FeatureButton>
          </Tooltip>

          <Tooltip title="Web search (Coming soon)">
            <FeatureButton 
              size="small"
              onClick={() => handleFeatureClick('search')}
            >
              <SearchIcon fontSize="inherit" />
            </FeatureButton>
          </Tooltip>
        </FeaturesContainer>

        {/* Main Input */}
        <StyledInputBase
          multiline
          disabled={disabled}
          maxRows={4}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onKeyPress={onKeyPress}
        />

        {/* Voice Recording Button */}
        <Tooltip title={isRecording ? "Stop recording" : "Voice input (Coming soon)"}>
          <ActionButton
            disabled={disabled}
            variant={isRecording ? 'primary' : 'default'}
            onClick={isRecording ? onStopRecording : onStartRecording}
          >
            {isRecording ? <StopIcon /> : <MicIcon />}
          </ActionButton>
        </Tooltip>

        {/* Send Button */}
        <Tooltip title="Send message">
          <ActionButton
            disabled={!canSend}
            variant={canSend ? 'primary' : 'default'}
            onClick={handleSendClick}
          >
            <SendIcon />
          </ActionButton>
        </Tooltip>
      </InputContainer>
    </Box>
  );
};

export default ChatInput;
