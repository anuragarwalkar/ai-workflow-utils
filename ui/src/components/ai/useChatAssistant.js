/**
 * Hooks for AI Chat Assistant functionality
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSendChatMessageStreamingMutation } from '../../store/api/chatApi';
import { createLogger } from '../../utils/log';

const logger = createLogger('AiChatAssistant');

export const useChatState = () => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  return {
    messages,
    setMessages,
    inputMessage,
    setInputMessage,
    isLoading,
    setIsLoading,
    isFullscreen,
    setIsFullscreen,
    messagesEndRef,
  };
};

export const useChatActions = (chatState) => {
  const navigate = useNavigate();
  const [sendChatMessageStreaming] = useSendChatMessageStreamingMutation();
  const {
    messages,
    setMessages,
    inputMessage,
    setInputMessage,
    isLoading,
    setIsLoading,
    isFullscreen,
    setIsFullscreen,
  } = chatState;

  const createUserMessage = useCallback((message) => ({
    id: Date.now(),
    role: 'user',
    content: message,
    timestamp: new Date().toISOString(),
  }), []);

  const createLoadingMessage = useCallback(() => ({
    id: 'loading',
    role: 'assistant',
    content: '',
    timestamp: new Date().toISOString(),
    isLoading: true,
  }), []);

  const processStreamingResponse = useCallback(async (message) => {
    let assistantMessageId = null;

    return sendChatMessageStreaming({
      message,
      template: 'CHAT_GENERAL',
      conversationHistory: messages
        .filter(msg => !msg.isWelcome && !msg.isLoading)
        .map(msg => ({ role: msg.role, content: msg.content })),
      onChunk: (chunk, fullContent) => {
        if (!assistantMessageId) {
          assistantMessageId = `assistant-${Date.now()}`;
          setIsLoading(false);
          setMessages(prev => {
            const filtered = prev.filter(msg => msg.id !== 'loading');
            return [...filtered, {
              id: assistantMessageId,
              role: 'assistant',
              content: fullContent,
              timestamp: new Date().toISOString(),
              isStreaming: true,
            }];
          });
        } else {
          setMessages(prev =>
            prev.map(msg =>
              msg.id === assistantMessageId 
                ? { ...msg, content: fullContent } 
                : msg
            )
          );
        }
      },
    });
  }, [messages, sendChatMessageStreaming, setMessages, setIsLoading]);

  const handleSendMessage = useCallback(async () => {
    if (!inputMessage.trim() || isLoading) return;

    logger.info('handleSendMessage', 'Sending message');

    const userMessage = createUserMessage(inputMessage);
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    const loadingMessage = createLoadingMessage();
    setMessages(prev => [...prev, loadingMessage]);

    try {
      const result = await processStreamingResponse(inputMessage);
      if (result.error) {
        throw new Error(result.error.data || 'Failed to send message');
      }
    } catch (error) {
      logger.info('handleSendMessage', 'Error', { error: error.message });
      setMessages(prev =>
        prev.map(msg =>
          msg.id === 'loading'
            ? {
                ...msg,
                content: 'Sorry, I encountered an error. Please try again.',
                isError: true,
                isLoading: false,
              }
            : msg
        )
      );
    } finally {
      setIsLoading(false);
    }
  }, [inputMessage, isLoading, createUserMessage, setMessages, setInputMessage, setIsLoading, createLoadingMessage, processStreamingResponse]);

  const clearConversation = useCallback(() => {
    logger.info('clearConversation', 'Clearing conversation');
    setMessages([]);
  }, [setMessages]);

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen(prev => !prev);
  }, [setIsFullscreen]);

  const handleClose = useCallback(() => {
    if (isFullscreen) {
      setIsFullscreen(false);
    } else {
      navigate('/');
    }
  }, [isFullscreen, navigate, setIsFullscreen]);

  const handleKeyPress = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);

  return {
    handleSendMessage,
    clearConversation,
    toggleFullscreen,
    handleClose,
    handleKeyPress,
  };
};
