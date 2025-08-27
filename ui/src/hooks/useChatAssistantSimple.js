/* eslint-disable max-statements */
/**
 * Custom hook for managing AI Chat Assistant state and functionality
 * Uses Redux Toolkit Query for API management
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useSendChatMessageStreamingMutation } from '../store/api/chatApi.js';
import { CONVERSATION_STATE, MESSAGE_STATUS, MESSAGE_TYPES } from '../constants/chat.js';
import { createLogger } from '../utils/log.js';
import { 
  createMessage, 
  generateSessionId, 
  getErrorMessage, 
  validateMessage 
} from '../utils/chatUtils.js';

const logger = createLogger('useChatAssistantSimple');

/**
 * Simple chat assistant hook with all required functionality
 * @returns {object} Chat assistant state and handlers
 */
export const useChatAssistant = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [conversations, setConversations] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [conversationState, setConversationState] = useState(CONVERSATION_STATE.IDLE);
  const [streamingMessageId, setStreamingMessageId] = useState(null);
  
  const messagesEndRef = useRef(null);
  const abortControllerRef = useRef(null);
  
  const [sendChatMessageStreaming] = useSendChatMessageStreamingMutation();

  // Auto-scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Initialize first conversation
  useEffect(() => {
    if (!currentSessionId) {
      handleNewConversation();
    }
  }, [currentSessionId, handleNewConversation]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const handleNewConversation = useCallback(() => {
    const sessionId = generateSessionId();
    const newConversation = {
      id: sessionId,
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setConversations(prev => [newConversation, ...prev]);
    setCurrentSessionId(sessionId);
    setMessages([]);
    setConversationState(CONVERSATION_STATE.IDLE);
    
    logger.info('handleNewConversation', `Created conversation: ${sessionId}`);
    return sessionId;
  }, []);

  const handleSelectConversation = useCallback((sessionId) => {
    const conversation = conversations.find(conv => conv.id === sessionId);
    if (conversation) {
      setCurrentSessionId(sessionId);
      setMessages(conversation.messages || []);
      setConversationState(CONVERSATION_STATE.ACTIVE);
      
      logger.info('handleSelectConversation', `Selected conversation: ${sessionId}`);
    }
  }, [conversations]);

  const handleDeleteConversation = useCallback((sessionId) => {
    setConversations(prev => prev.filter(conv => conv.id !== sessionId));
    
    if (currentSessionId === sessionId) {
      const remainingConversations = conversations.filter(conv => conv.id !== sessionId);
      if (remainingConversations.length > 0) {
        handleSelectConversation(remainingConversations[0].id);
      } else {
        handleNewConversation();
      }
    }
    
    logger.info('handleDeleteConversation', `Deleted conversation: ${sessionId}`);
  }, [conversations, currentSessionId, handleSelectConversation, handleNewConversation]);

  const updateConversation = useCallback((sessionId, newMessages) => {
    setConversations(prev => 
      prev.map(conv => 
        conv.id === sessionId 
          ? { ...conv, messages: newMessages, updatedAt: new Date().toISOString() }
          : conv
      )
    );
  }, []);

  const handleSendMessage = useCallback(async (messageContent) => {
    const validation = validateMessage(messageContent);
    if (!validation.isValid) {
      logger.warn('handleSendMessage', `Invalid message: ${validation.error}`);
      return;
    }

    if (!currentSessionId) {
      logger.error('handleSendMessage', 'No active session');
      return;
    }

    setConversationState(CONVERSATION_STATE.LOADING);

    // Add user message
    const userMessage = createMessage(messageContent, MESSAGE_TYPES.USER, MESSAGE_STATUS.SENT);
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    updateConversation(currentSessionId, newMessages);

    // Create assistant message placeholder
    const assistantMessage = createMessage('', MESSAGE_TYPES.ASSISTANT, MESSAGE_STATUS.STREAMING);
    const messagesWithAssistant = [...newMessages, assistantMessage];
    setMessages(messagesWithAssistant);
    setStreamingMessageId(assistantMessage.id);

    // Prepare conversation history
    const conversationHistory = newMessages
      .filter(msg => msg.status === MESSAGE_STATUS.SENT)
      .map(msg => ({
        role: msg.type === MESSAGE_TYPES.USER ? 'user' : 'assistant',
        content: msg.content,
      }));

    // Cancel previous request if exists
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    try {
      let fullContent = '';
      
      await sendChatMessageStreaming({
        message: messageContent,
        conversationHistory,
        template: 'CHAT_GENERIC',
        onChunk: (chunk, content) => {
          fullContent = content;
          setMessages(prev => 
            prev.map(msg => 
              msg.id === assistantMessage.id 
                ? { ...msg, content: fullContent }
                : msg
            )
          );
        },
        onStatus: (status, provider) => {
          logger.info('handleSendMessage', `Status: ${status} (${provider})`);
        },
      }).unwrap();

      // Finalize assistant message
      const finalMessages = messagesWithAssistant.map(msg => 
        msg.id === assistantMessage.id 
          ? { ...msg, content: fullContent, status: MESSAGE_STATUS.SENT }
          : msg
      );
      
      setMessages(finalMessages);
      updateConversation(currentSessionId, finalMessages);
      setConversationState(CONVERSATION_STATE.ACTIVE);
      
    } catch (error) {
      logger.error('handleSendMessage', 'Failed to send message', error);
      
      // Add error message
      const errorMessage = createMessage(
        getErrorMessage(error), 
        MESSAGE_TYPES.ERROR, 
        MESSAGE_STATUS.FAILED
      );
      
      const errorMessages = [...newMessages, errorMessage];
      setMessages(errorMessages);
      updateConversation(currentSessionId, errorMessages);
      setConversationState(CONVERSATION_STATE.ERROR);
    } finally {
      setStreamingMessageId(null);
      abortControllerRef.current = null;
    }
  }, [currentSessionId, messages, sendChatMessageStreaming, updateConversation]);

  const toggleSidebar = useCallback(() => {
    setSidebarOpen(prev => !prev);
    logger.info('toggleSidebar', `Sidebar: ${!sidebarOpen ? 'open' : 'closed'}`);
  }, [sidebarOpen]);

  const isLoading = conversationState === CONVERSATION_STATE.LOADING;

  return {
    // State
    sidebarOpen,
    conversations,
    currentSessionId,
    messages,
    isLoading,
    streamingMessageId,
    messagesEndRef,
    
    // Handlers
    handleNewConversation,
    handleSelectConversation,
    handleDeleteConversation,
    handleSendMessage,
    toggleSidebar,
  };
};
