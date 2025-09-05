/**
 * AI Chat Assistant main container component
 * Orchestrates all chat functionality with ChatGPT-inspired interface
 * Uses existing useChatAssistant hook for state management
 */

import React from 'react';
import { Box } from '@mui/material';
import { styled } from '@mui/material/styles';
import { createLogger } from '../../utils/log.js';
import { useChatAssistant } from '../../hooks/useChatAssistantSimple.js';
import ChatInput from '../chat/ChatInput.jsx';
import ChatMessage from '../chat/ChatMessage.jsx';
import ChatSidebar from '../chat/ChatSidebar.jsx';
import ChatWelcome from '../chat/ChatWelcome.jsx';
import VoiceAssistantButton from '../chat/VoiceAssistantButton.jsx';
import FuturisticChatLoader from '../chat/FuturisticChatLoader.jsx';
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
  overflow: 'hidden', // Prevent overflow on the main container
}));

const ScrollableContent = styled(Box)(({ theme }) => ({
  flex: 1,
  overflowY: 'auto',
  display: 'flex',
  flexDirection: 'column',
  minHeight: 0,
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

const MessagesContainer = styled(Box)(({ theme }) => ({
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  backgroundColor: theme.palette.background.default,
  padding: theme.spacing(1, 0),
  gap: theme.spacing(0.5),
}));

const InputContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(3, 4),
  borderTop: `1px solid ${theme.palette.divider}`,
  backgroundColor: theme.palette.background.paper,
  position: 'relative',
  zIndex: 1,
  flexShrink: 0,
  width: '100%',
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(2),
  alignItems: 'center',
}));

/**
 * AiChatAssistant main component
 * @returns {React.Element} AiChatAssistant component
 */
const AiChatAssistant = () => {
  const {
    sidebarOpen,
    conversations,
    currentSessionId,
    messages,
    isLoading,
    streamingMessageId,
    messagesEndRef,
    handleNewConversation,
    handleSelectConversation,
    handleDeleteConversation,
    handleSendMessage,
    toggleSidebar,
  } = useChatAssistant();

  const [inputValue, setInputValue] = React.useState('');
  const [_voiceError, setVoiceError] = React.useState(null);

  // Handle voice message integration
  const handleVoiceMessage = (message) => {
    logger.info('AiChatAssistant', 'handleVoiceMessage', { message });
    // For now, we'll add voice messages as regular text messages
    handleSendMessageWrapper(message);
  };

  // Handle voice errors
  const handleVoiceError = (error) => {
    logger.error('AiChatAssistant', 'handleVoiceError', { error });
    setVoiceError(error);
    // Could show a toast notification here
  };
  
  logger.info('AiChatAssistant', 'Rendering chat component', {
    messageCount: messages.length,
    currentSessionId,
    isLoading,
  });

  const handleSendMessageWrapper = (messageContent) => {
    logger.info('AiChatAssistant', 'handleSendMessage', { messageContent });
    handleSendMessage(messageContent);
    setInputValue('');
  };

  const handleInputChange = (event) => {
    setInputValue(event.target.value);
  };

  const handleSend = () => {
    if (inputValue.trim()) {
      handleSendMessageWrapper(inputValue);
    }
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  const hasMessages = messages.length > 0;

  return (
    <ChatContainer>
      {sidebarOpen && (
        <ChatSidebar
          conversations={conversations}
          currentSessionId={currentSessionId}
          onDeleteConversation={handleDeleteConversation}
          onNewConversation={handleNewConversation}
          onSelectConversation={handleSelectConversation}
        />
      )}
      
      <MainChatArea>
        <ChatHeader 
          sidebarOpen={sidebarOpen}
          onToggleSidebar={toggleSidebar}
        />

        <ScrollableContent>
          <MessagesContainer>
            {!hasMessages ? (
              <ChatWelcome onSendMessage={handleSendMessageWrapper} />
            ) : (
              <>
                {messages.map((message) => (
                  <ChatMessage
                    isStreaming={message.id === streamingMessageId}
                    key={message.id}
                    message={message}
                  />
                ))}
                <div ref={messagesEndRef} />
              </>
            )}
          </MessagesContainer>

          <InputContainer>
            {/* Voice Assistant Button */}
            <VoiceAssistantButton
              disabled={isLoading}
              sessionId={currentSessionId}
              onVoiceError={handleVoiceError}
              onVoiceMessage={handleVoiceMessage}
            />
            
            {/* Regular Chat Input */}
            <ChatInput
              disabled={isLoading}
              placeholder="Type your message here..."
              value={inputValue}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              onSend={handleSend}
            />
          </InputContainer>
        </ScrollableContent>

        {/* Futuristic Chat Loader - Shows when system is loading */}
        <FuturisticChatLoader
          message="Initializing AI Assistant..."
          visible={Boolean(isLoading && !hasMessages)}
        />
      </MainChatArea>
    </ChatContainer>
  );
};

export default AiChatAssistant;
