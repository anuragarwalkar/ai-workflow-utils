/**
 * Chat message component displaying individual messages with sender info and timestamps
 * Styled similar to ChatGPT interface with user/assistant differentiation
 */

import React from 'react';
import { Avatar, Box, Typography } from '@mui/material';
import { SmartToy as BotIcon, Person as PersonIcon } from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { MESSAGE_TYPES } from '../../constants/chat.js';
import { formatMessageTime, isAssistantMessage, isUserMessage } from '../../utils/chatUtils.js';
import { createLogger } from '../../utils/log.js';

const logger = createLogger('ChatMessage');

const MessageContainer = styled(Box)(({ theme, isUser }) => ({
  display: 'flex',
  width: '100%',
  padding: theme.spacing(1, 3),
  justifyContent: isUser ? 'flex-start' : 'flex-end',
}));

const MessageWrapper = styled(Box)(({ theme, isUser }) => ({
  display: 'flex',
  gap: theme.spacing(1),
  maxWidth: '85%',
  alignItems: 'flex-start',
  flexDirection: isUser ? 'row' : 'row-reverse',
}));

const MessageContent = styled(Box)(({ theme, isUser }) => ({
  flex: 1,
  minWidth: 0,
  maxWidth: 'calc(100% - 48px)', // Account for avatar width + gap
  backgroundColor: isUser ? theme.palette.primary.main : theme.palette.background.paper,
  color: isUser ? theme.palette.primary.contrastText : theme.palette.text.primary,
  borderRadius: theme.spacing(2),
  padding: theme.spacing(1.5, 2),
  boxShadow: isUser ? theme.shadows[2] : theme.shadows[1],
  border: isUser ? 'none' : `1px solid ${theme.palette.divider}`,
  position: 'relative',
  // Add a subtle tail to the speech bubble - swapped for user on left, AI on right
  '&::before': isUser ? {
    content: '""',
    position: 'absolute',
    left: '-8px',
    top: '12px',
    width: 0,
    height: 0,
    borderRight: `8px solid ${theme.palette.primary.main}`,
    borderTop: '6px solid transparent',
    borderBottom: '6px solid transparent',
  } : {
    content: '""',
    position: 'absolute',
    right: '-8px',
    top: '12px',
    width: 0,
    height: 0,
    borderLeft: `8px solid ${theme.palette.background.paper}`,
    borderTop: '6px solid transparent',
    borderBottom: '6px solid transparent',
  },
}));

const MessageText = styled(Typography)(({ theme }) => ({
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-word',
  lineHeight: 1.6,
  fontFamily: theme.typography.body1.fontFamily,
  fontSize: '15px',
  margin: 0,
}));

const MessageTimestamp = styled(Typography)(({ theme }) => ({
  fontSize: '12px',
  color: theme.palette.text.secondary,
  marginTop: theme.spacing(0.5),
}));

const MessageAvatar = styled(Avatar)(({ theme, isUser }) => ({
  width: 32,
  height: 32,
  backgroundColor: isUser ? theme.palette.primary.main : theme.palette.secondary.main,
  '& .MuiSvgIcon-root': {
    fontSize: '20px',
  },
}));

const ErrorMessage = styled(Box)(({ theme }) => ({
  padding: theme.spacing(1.5, 2),
  backgroundColor: theme.palette.error.main,
  color: theme.palette.error.contrastText,
  borderRadius: theme.spacing(2),
  margin: 0,
}));

const StreamingIndicator = styled(Box)(({ theme }) => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: theme.spacing(0.5),
  marginLeft: theme.spacing(1),
  '&::after': {
    content: '""',
    width: '8px',
    height: '8px',
    backgroundColor: theme.palette.primary.main,
    borderRadius: '50%',
    animation: 'pulse 1.5s infinite',
  },
  '@keyframes pulse': {
    '0%': { opacity: 0.3 },
    '50%': { opacity: 1 },
    '100%': { opacity: 0.3 },
  },
}));

/**
 * ChatMessage component
 * @param {object} props - Component props
 * @param {object} props.message - Message object
 * @param {boolean} props.showTimestamp - Whether to show timestamp
 * @param {boolean} props.isStreaming - Whether message is currently streaming
 * @returns {React.Element} ChatMessage component
 */
const ChatMessage = ({ message, showTimestamp = true, isStreaming = false }) => {
  const isUser = isUserMessage(message);
  const isAssistant = isAssistantMessage(message);
  const isError = message?.type === MESSAGE_TYPES.ERROR;

  logger.info('ChatMessage', 'Rendering message', { 
    messageId: message?.id, 
    type: message?.type,
    isStreaming 
  });

  if (!message) {
    return null;
  }

  const renderAvatar = () => {
    if (isUser) {
      return (
        <MessageAvatar isUser>
          <PersonIcon />
        </MessageAvatar>
      );
    }
    
    if (isAssistant) {
      return (
        <MessageAvatar>
          <BotIcon />
        </MessageAvatar>
      );
    }
    
    return null;
  };

  const renderMessageContent = () => {
    if (isError) {
      return (
        <ErrorMessage>
          <Typography variant="body2">
            {message.content || 'An error occurred'}
          </Typography>
        </ErrorMessage>
      );
    }

    return (
      <>
        <MessageText>
          {message.content}
          {Boolean(isStreaming) && <StreamingIndicator />}
        </MessageText>
        {Boolean(showTimestamp && message.timestamp) && (
          <MessageTimestamp>
            {formatMessageTime(message.timestamp)}
          </MessageTimestamp>
        )}
      </>
    );
  };

  return (
    <MessageContainer isUser={isUser}>
      <MessageWrapper isUser={isUser}>
        {renderAvatar()}
        <MessageContent isUser={isUser}>
          {renderMessageContent()}
        </MessageContent>
      </MessageWrapper>
    </MessageContainer>
  );
};

export default ChatMessage;
