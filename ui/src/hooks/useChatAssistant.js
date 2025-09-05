/* eslint-disable no-unused-vars */
/* eslint-disable max-statements */
/* eslint-disable max-nested-callbacks */
/**
 * Custom hook for managing AI Chat Assistant state and functionality
 * Handles message history, conversation management, and API interactions
 */

import { useCallback, useRef, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { createLogger } from '../utils/log.js';
import {
  checkProviderHealth,
  clearConversationMemory,
  getChatConfig,
  getConversationHistory,
  sendChatMessage,
  sendStreamingChatMessage,
} from '../services/chatService.js';

const logger = createLogger('useChatAssistant');

/**
 * Update streaming message content
 * @param {string} messageId - ID of streaming message
 * @param {string} content - New content
 * @param {function} setMessages - Messages setter function
 */
const updateStreamingMessage = (messageId, content, setMessages) => {
  setMessages(prev => 
    prev.map(msg => 
      msg.id === messageId 
        ? { ...msg, content }
        : msg
    )
  );
};

/**
 * Finalize or error streaming message
 * @param {string} messageId - ID of streaming message  
 * @param {string} content - Final content
 * @param {boolean} isError - Whether message is an error
 * @param {function} setMessages - Messages setter function
 */
// eslint-disable-next-line max-params
const finalizeStreamingMessage = (messageId, content, isError, setMessages) => {
  setMessages(prev => 
    prev.map(msg => 
      msg.id === messageId 
        ? { ...msg, content, isStreaming: false, isError }
        : msg
    )
  );
};

export const useChatAssistant = () => {
  const [messages, setMessages] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [config, setConfig] = useState(null);
  const [healthStatus, setHealthStatus] = useState(null);
  
  const streamingMessageRef = useRef('');

  /**
   * Create a new conversation session
   */
  const createNewConversation = useCallback(() => {
    logger.info('createNewConversation', 'Creating new conversation');
    
    const newSessionId = uuidv4();
    const newConversation = {
      id: newSessionId,
      title: 'New Chat',
      createdAt: new Date().toISOString(),
      messageCount: 0,
    };

    setCurrentSessionId(newSessionId);
    setMessages([]);
    setConversations(prev => [newConversation, ...prev]);
    
    logger.info('createNewConversation', 'New conversation created', { sessionId: newSessionId });
    
    return newSessionId;
  }, []);

  /**
   * Load an existing conversation
   * @param {string} sessionId - The session ID to load
   */
  const loadConversation = useCallback(async (sessionId) => {
    logger.info('loadConversation', 'Loading conversation', { sessionId });
    
    try {
      const history = await getConversationHistory(sessionId);
      setCurrentSessionId(sessionId);
      setMessages(history.messages || []);
      
      logger.info('loadConversation', 'Conversation loaded', { 
        sessionId, 
        messageCount: history.messages?.length || 0 
      });
    } catch (error) {
      logger.error('loadConversation', 'Failed to load conversation', error);
      throw error;
    }
  }, []);

  /**
   * Clear conversation history
   * @param {string} sessionId - The session ID to clear
   */
  const clearConversation = useCallback(async (sessionId) => {
    logger.info('clearConversation', 'Clearing conversation', { sessionId });
    
    try {
      await clearConversationMemory(sessionId);
      
      if (sessionId === currentSessionId) {
        setMessages([]);
      }
      
      setConversations(prev => 
        prev.map(conv => 
          conv.id === sessionId 
            ? { ...conv, messageCount: 0 }
            : conv
        )
      );
      
      logger.info('clearConversation', 'Conversation cleared', { sessionId });
    } catch (error) {
      logger.error('clearConversation', 'Failed to clear conversation', error);
      throw error;
    }
  }, [currentSessionId]);

  /**
   * Add a message to the current conversation
   * @param {object} message - Message object to add
   */
  const addMessage = useCallback((message) => {
    const messageWithId = {
      ...message,
      id: uuidv4(),
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, messageWithId]);
    
    // Update conversation title if it's the first user message
    if (message.role === 'user') {
      setConversations(prev => 
        prev.map(conv => 
          conv.id === currentSessionId 
            ? {
                ...conv,
                title: conv.messageCount === 0 ? `${message.content.slice(0, 50)}...` : conv.title,
                messageCount: conv.messageCount + 1,
              }
            : conv
        )
      );
    }

    return messageWithId;
  }, [currentSessionId]);

  /**
   * Send a regular (non-streaming) message
   * @param {string} content - Message content to send
   */
  const sendMessage = useCallback(async (content) => {
    if (!currentSessionId) {
      createNewConversation();
    }

    logger.info('sendMessage', 'Sending message', { 
      contentLength: content.length,
      sessionId: currentSessionId 
    });

    // Add user message
    addMessage({
      role: 'user',
      content,
    });

    setIsLoading(true);

    try {
      const response = await sendChatMessage(content, currentSessionId);
      
      // Add AI response
      addMessage({
        role: 'assistant',
        content: response.message || response.content,
      });

      logger.info('sendMessage', 'Message sent successfully');
    } catch (error) {
      logger.error('sendMessage', 'Failed to send message', error);
      
      // Add error message
      addMessage({
        role: 'assistant',
        content: 'Sorry, I encountered an error processing your message. Please try again.',
        isError: true,
      });
      
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [currentSessionId, createNewConversation, addMessage]);

  /**
   * Send a streaming message
   * @param {string} content - Message content to send
   */
  const sendStreamingMessage = useCallback(async (content) => {
    if (!currentSessionId) {
      createNewConversation();
    }

    logger.info('sendStreamingMessage', 'Starting streaming message', { 
      contentLength: content.length,
      sessionId: currentSessionId 
    });

    // Add user message
    addMessage({
      role: 'user',
      content,
    });

    setIsStreaming(true);
    streamingMessageRef.current = '';

    // Add placeholder for streaming response
    const streamingMessageId = uuidv4();
    const streamingMessage = {
      id: streamingMessageId,
      role: 'assistant',
      content: '',
      isStreaming: true,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, streamingMessage]);

    try {
      await sendStreamingChatMessage(content, currentSessionId, (chunk) => {
        if (chunk.content) {
          streamingMessageRef.current += chunk.content;
          
          setMessages(prev => 
            prev.map(msg => 
              msg.id === streamingMessageId 
                ? { ...msg, content: streamingMessageRef.current }
                : msg
            )
          );
        }
      });

      // Finalize streaming message
      setMessages(prev => 
        prev.map(msg => 
          msg.id === streamingMessageId 
            ? { ...msg, isStreaming: false }
            : msg
        )
      );

      logger.info('sendStreamingMessage', 'Streaming completed successfully');
    } catch (error) {
      logger.error('sendStreamingMessage', 'Streaming failed', error);
      
      // Replace streaming message with error
      setMessages(prev => 
        prev.map(msg => 
          msg.id === streamingMessageId 
            ? {
                ...msg,
                content: 'Sorry, I encountered an error processing your message. Please try again.',
                isStreaming: false,
                isError: true,
              }
            : msg
        )
      );
      
      throw error;
    } finally {
      setIsStreaming(false);
      streamingMessageRef.current = '';
    }
  }, [currentSessionId, createNewConversation, addMessage]);

  /**
   * Load chat configuration
   */
  const loadConfig = useCallback(async () => {
    logger.info('loadConfig', 'Loading chat configuration');
    
    try {
      const configData = await getChatConfig();
      setConfig(configData);
      
      logger.info('loadConfig', 'Configuration loaded');
    } catch (error) {
      logger.error('loadConfig', 'Failed to load configuration', error);
    }
  }, []);

  /**
   * Check provider health status
   */
  const checkHealth = useCallback(async () => {
    logger.info('checkHealth', 'Checking provider health');
    
    try {
      const health = await checkProviderHealth();
      setHealthStatus(health);
      
      logger.info('checkHealth', 'Health check completed', { status: health.status });
    } catch (error) {
      logger.error('checkHealth', 'Health check failed', error);
      setHealthStatus({ status: 'unhealthy', error: error.message });
    }
  }, []);

  return {
    // State
    messages,
    conversations,
    currentSessionId,
    isLoading,
    isStreaming,
    config,
    healthStatus,

    // Actions
    createNewConversation,
    loadConversation,
    clearConversation,
    sendMessage,
    sendStreamingMessage,
    loadConfig,
    checkHealth,
  };
};
