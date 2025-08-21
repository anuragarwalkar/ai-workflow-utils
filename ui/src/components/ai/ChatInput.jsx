/**
 * Chat input component
 */

import React from 'react';
import { Send as SendIcon } from '@mui/icons-material';
import { ActionButton, InputContainer, StyledTextField } from './AiChatAssistant.style';

export const ChatInput = ({ 
  value, 
  isLoading, 
  onChange, 
  onKeyPress, 
  onSend,
}) => (
  <InputContainer>
    <StyledTextField
      fullWidth
      multiline
      disabled={isLoading}
      maxRows={4}
      placeholder="Ask me anything..."
      size="small"
      value={value}
      onChange={onChange}
      onKeyPress={onKeyPress}
    />
    <ActionButton
      disabled={!value.trim() || isLoading}
      title="Send message"
      variant="primary"
      onClick={onSend}
    >
      <SendIcon fontSize="small" />
    </ActionButton>
  </InputContainer>
);
