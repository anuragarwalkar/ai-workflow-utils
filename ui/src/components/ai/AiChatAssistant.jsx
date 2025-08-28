/**
 * AI Chat Assistant main container component
 * Orchestrates all chat functionality with ChatGPT-inspired interface
 * Uses existing useChatAssistant hook for state management
 */

import React from 'react';
import { Box } from '@mui/material';
import { styled } from '@mui/material/styles';
import { createLogger } from '../../utils/log.js';
import ChatInput from '../chat/ChatInput.jsx';
import ChatMessage from '../chat/ChatMessage.jsx';
import ChatSidebar from '../chat/ChatSidebar.jsx';
import ChatWelcome from '../chat/ChatWelcome.jsx';
import ChatHeader from './ChatHeader.jsx';

const logger = createLogger('AiChatAssistant');

const ChatContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  height: '100vh',
  width: '100vw',
  backgroundColor: theme.palette.background.default,
  overflow: 'hidden',
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
}));

const MainChatArea = styled(Box)(({ theme }) => ({
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  height: '100vh',
  minWidth: 0,
  backgroundColor: theme.palette.background.default,
}));

const MessagesContainer = styled(Box)(({ theme }) => ({
  flex: 1,
  overflowY: 'auto',
  display: 'flex',
  flexDirection: 'column',
  backgroundColor: theme.palette.background.default,
  minHeight: 0, // This is crucial for flex overflow
  // Custom scrollbar styling for better UX
  '&::-webkit-scrollbar': {
    width: '8px',
  },
  '&::-webkit-scrollbar-track': {
    background: 'transparent',
  },
  '&::-webkit-scrollbar-thumb': {
    backgroundColor: theme.palette.divider,
    borderRadius: '4px',
    '&:hover': {
      backgroundColor: theme.palette.text.secondary,
    },
  },
}));

const InputContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(3, 4),
  borderTop: `1px solid ${theme.palette.divider}`,
  backgroundColor: theme.palette.background.paper,
  position: 'relative',
  zIndex: 1,
  flexShrink: 0, // Prevent the input area from shrinking
  maxWidth: '800px',
  margin: '0 auto',
  width: '100%',
}));

/**
 * AiChatAssistant main component - Simplified version
 * @returns {React.Element} AiChatAssistant component
 */
const AiChatAssistant = () => {
  // For now, use simple state until we integrate with the existing hook
  const [messages] = React.useState([]);
  const [sidebarOpen, setSidebarOpen] = React.useState(true);
  const [inputValue, setInputValue] = React.useState('');
  
  logger.info('AiChatAssistant', 'Rendering chat component');

  const handleSendMessage = (messageContent) => {
    logger.info('AiChatAssistant', 'handleSendMessage', { messageContent });
    // TODO: Integrate with existing useChatAssistant hook
    // Clear input after sending
    setInputValue('');
  };

  const handleInputChange = (event) => {
    setInputValue(event.target.value);
  };

  const handleSend = () => {
    if (inputValue.trim()) {
      handleSendMessage(inputValue);
    }
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  const toggleSidebar = () => {
    setSidebarOpen(prev => !prev);
  };

  const hasMessages = messages.length > 0;

  return (
    <ChatContainer>
      {Boolean(sidebarOpen) && (
        <ChatSidebar
          conversations={[]}
          currentSessionId={null}
          onDeleteConversation={() => {}}
          onNewConversation={() => {}}
          onSelectConversation={() => {}}
        />
      )}
      
      <MainChatArea>
        <ChatHeader 
          sidebarOpen={sidebarOpen}
          onToggleSidebar={toggleSidebar}
        />

        <MessagesContainer>
          {!hasMessages ? (
            <ChatWelcome onSendMessage={handleSendMessage} />
          ) : (
            <>
              {messages.map((message) => (
                <ChatMessage
                  isStreaming={false}
                  key={message.id}
                  message={message}
                />
              ))}
            </>
          )}
        </MessagesContainer>

        <InputContainer>
          <ChatInput
            disabled={false}
            placeholder="Type your message here..."
            value={inputValue}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            onSend={handleSend}
          />
        </InputContainer>
      </MainChatArea>
    </ChatContainer>
  );
};

export default AiChatAssistant;
