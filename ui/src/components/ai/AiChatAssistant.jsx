/**
 * AI Chat Assistant - General purpose template-driven chat interface
 * Clean, minimal design inspired by Perplexity AI with fullscreen support
 */

import React from 'react';
import { ChatContainer, MessagesContainer, MessagesScrollArea } from './AiChatAssistant.style';
import { ChatHeader } from './ChatHeader';
import { ChatInput } from './ChatInput';
import { ChatMessage } from './ChatMessage';
import { useChatWithTools } from './hooks/useChatWithTools';

const AiChatAssistant = () => {
  const chatState = useChatWithTools({ enableTools: true });
  const { 
    messages, 
    inputMessage, 
    setInputMessage, 
    isLoading, 
    isFullscreen, 
    messagesEndRef,
    toolsEnabled,
    toggleTools,
  } = chatState;

  const {
    handleSendMessage,
    clearConversation,
    toggleFullscreen,
    handleClose,
    handleKeyPress,
  } = chatState;

  return (
    <ChatContainer isFullscreen={isFullscreen}>
      <ChatHeader
        isFullscreen={isFullscreen}
        toolsEnabled={toolsEnabled}
        onClear={clearConversation}
        onClose={handleClose}
        onToggleFullscreen={toggleFullscreen}
        onToggleTools={toggleTools}
      />

      <MessagesContainer>
        <MessagesScrollArea>
          {messages.map(message => (
            <ChatMessage key={message.id} message={message} />
          ))}
          <div ref={messagesEndRef} />
        </MessagesScrollArea>

        <ChatInput
          isLoading={isLoading}
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          onSend={handleSendMessage}
        />
      </MessagesContainer>
    </ChatContainer>
  );
};

export default AiChatAssistant;
