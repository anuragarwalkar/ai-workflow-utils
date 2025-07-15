import React, { useRef, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  Box,
  Paper,
  Typography,
  TextField,
  IconButton,
  Fab,
  Collapse,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
  Alert,
  Chip,
  Divider,
} from '@mui/material';
import {
  Chat as ChatIcon,
  Close as CloseIcon,
  Minimize as MinimizeIcon,
  Maximize as MaximizeIcon,
  Send as SendIcon,
  Clear as ClearIcon,
} from '@mui/icons-material';
import {
  toggleChat,
  closeChat,
  minimizeChat,
  maximizeChat,
  setCurrentMessage,
  addMessage,
  setStreaming,
  setStreamingContent,
  setError,
  clearError,
  setProvider,
  clearConversation,
} from '../../store/slices/chatSlice';
import { useSendChatMessageStreamingMutation } from '../../store/api/chatApi';

const ChatOverlay = () => {
  const dispatch = useDispatch();
  const {
    isOpen,
    isMinimized,
    conversationHistory,
    currentMessage,
    isLoading,
    isStreaming,
    streamingContent,
    error,
    provider,
  } = useSelector((state) => state.chat);

  const [sendChatMessageStreaming] = useSendChatMessageStreamingMutation();
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversationHistory, streamingContent]);

  const handleSendMessage = async () => {
    if (!currentMessage.trim() || isLoading || isStreaming) return;

    const userMessage = {
      role: 'user',
      content: currentMessage.trim(),
      timestamp: new Date().toISOString(),
    };

    dispatch(addMessage(userMessage));
    const messageToSend = currentMessage.trim();
    dispatch(setCurrentMessage(''));
    dispatch(setStreaming(true));
    dispatch(clearError());

    let finalContent = '';
    let finalProvider = '';

    try {
      const result = await sendChatMessageStreaming({
        message: messageToSend,
        conversationHistory: conversationHistory,
        onChunk: (chunk, fullContent) => {
          finalContent = fullContent;
          dispatch(setStreamingContent(fullContent));
        },
        onStatus: (message, providerName) => {
          finalProvider = providerName;
          dispatch(setProvider(providerName));
        },
      }).unwrap();

      // Add the complete AI response to conversation history
      const aiMessage = {
        role: 'assistant',
        content: result?.response || finalContent,
        timestamp: new Date().toISOString(),
        provider: result?.provider || finalProvider,
      };

      dispatch(addMessage(aiMessage));
      dispatch(setStreaming(false));
      dispatch(setStreamingContent(''));
    } catch (error) {
      console.error('Chat error:', error);
      dispatch(setError(error.data || 'Failed to send message'));
      dispatch(setStreaming(false));
    }
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  const handleClearConversation = () => {
    dispatch(clearConversation());
  };

  const formatMessage = (content) => {
    return content.split('\n').map((line, index) => (
      <React.Fragment key={index}>
        {line}
        {index < content.split('\n').length - 1 && <br />}
      </React.Fragment>
    ));
  };

  if (!isOpen) {
    return (
      <Box
        sx={{
          position: 'fixed',
          bottom: 8,
          right: 8,
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 1,
        }}
      >
        <Fab
          color="primary"
          aria-label="chat"
          sx={{
            width: '80px', // Made bigger horizontally
            height: '60px', // Slightly taller
            borderRadius: '30px', // More oval shape
            animation: 'chatPulse 2s ease-in-out infinite, chatFloat 3s ease-in-out infinite',
            '&:hover': {
              animation: 'chatBounce 0.6s ease-in-out infinite, chatGlow 1s ease-in-out infinite',
              transform: 'scale(1.1)',
              transition: 'transform 0.3s ease',
            },
            '@keyframes chatPulse': {
              '0%': {
                boxShadow: '0 0 0 0 rgba(25, 118, 210, 0.7)',
              },
              '70%': {
                boxShadow: '0 0 0 10px rgba(25, 118, 210, 0)',
              },
              '100%': {
                boxShadow: '0 0 0 0 rgba(25, 118, 210, 0)',
              },
            },
            '@keyframes chatFloat': {
              '0%, 100%': {
                transform: 'translateY(0px)',
              },
              '50%': {
                transform: 'translateY(-5px)',
              },
            },
            '@keyframes chatBounce': {
              '0%, 20%, 50%, 80%, 100%': {
                transform: 'translateY(0) scale(1.1)',
              },
              '40%': {
                transform: 'translateY(-8px) scale(1.1)',
              },
              '60%': {
                transform: 'translateY(-4px) scale(1.1)',
              },
            },
            '@keyframes chatGlow': {
              '0%, 100%': {
                boxShadow: '0 0 5px rgba(25, 118, 210, 0.5)',
              },
              '50%': {
                boxShadow: '0 0 20px rgba(25, 118, 210, 0.8), 0 0 30px rgba(25, 118, 210, 0.6)',
              },
            },
          }}
          onClick={() => dispatch(toggleChat())}
        >
          <ChatIcon sx={{ 
            fontSize: '2rem',
            animation: 'iconWiggle 2s ease-in-out infinite',
            '@keyframes iconWiggle': {
              '0%, 100%': {
                transform: 'rotate(0deg)',
              },
              '25%': {
                transform: 'rotate(-5deg)',
              },
              '75%': {
                transform: 'rotate(5deg)',
              },
            },
          }} />
        </Fab>
        <Typography
          variant="caption"
          sx={{
            color: 'primary.main',
            fontWeight: 'bold',
            textAlign: 'center',
            bgcolor: 'rgba(255, 255, 255, 0.9)',
            px: 1,
            py: 0.5,
            borderRadius: 1,
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            fontSize: '0.75rem',
            animation: 'labelFloat 3s ease-in-out infinite',
            '@keyframes labelFloat': {
              '0%, 100%': {
                transform: 'translateY(0px)',
              },
              '50%': {
                transform: 'translateY(-2px)',
              },
            },
          }}
        >
          AI Chat
        </Typography>
      </Box>
    );
  }

  return (
    <Paper
      elevation={8}
      sx={{
        position: 'fixed',
        bottom: isMinimized ? 8 : 20,
        right: 8,
        width: isMinimized ? 300 : 400,
        height: isMinimized ? 60 : 500,
        maxHeight: 'calc(100vh - 40px)',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <Box
        sx={{
          p: 1,
          bgcolor: 'primary.main',
          color: 'primary.contrastText',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: isMinimized ? 'pointer' : 'default',
          flexShrink: 0,
        }}
        onClick={isMinimized ? () => dispatch(maximizeChat()) : undefined}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ChatIcon />
          <Typography variant="subtitle2">AI Assistant</Typography>
          {provider && (
            <Chip
              label={provider}
              size="small"
              sx={{
                bgcolor: 'rgba(255, 255, 255, 0.2)',
                color: 'inherit',
                fontSize: '0.7rem',
                height: 20,
              }}
            />
          )}
        </Box>
        <Box>
          {!isMinimized && (
            <IconButton
              size="small"
              onClick={() => dispatch(minimizeChat())}
              sx={{ color: 'inherit', mr: 0.5 }}
            >
              <MinimizeIcon fontSize="small" />
            </IconButton>
          )}
          <IconButton
            size="small"
            onClick={() => dispatch(closeChat())}
            sx={{ color: 'inherit' }}
            title="Close chat"
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
      </Box>

      {!isMinimized && (
        <>
          {/* Messages Area */}
          <Box
            sx={{
              flex: 1,
              overflow: 'auto',
              p: 1,
              bgcolor: 'grey.50',
              paddingBottom: '80px', // Space for input area
            }}
          >
            {conversationHistory.length === 0 && !isStreaming && (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '200px',
                  textAlign: 'center',
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  Hi! I'm your AI assistant. How can I help you today?
                </Typography>
              </Box>
            )}

            <List sx={{ p: 0 }}>
              {conversationHistory.map((message, index) => (
                <ListItem
                  key={index}
                  sx={{
                    flexDirection: 'column',
                    alignItems: message.role === 'user' ? 'flex-end' : 'flex-start',
                    p: 0.5,
                  }}
                >
                  <Paper
                    elevation={1}
                    sx={{
                      p: 1,
                      maxWidth: '85%',
                      bgcolor: message.role === 'user' ? 'primary.main' : 'white',
                      color: message.role === 'user' ? 'primary.contrastText' : 'text.primary',
                      borderRadius: 2,
                    }}
                  >
                    <Typography variant="body2">
                      {formatMessage(message.content)}
                    </Typography>
                    {message.provider && (
                      <Typography
                        variant="caption"
                        sx={{
                          display: 'block',
                          mt: 0.5,
                          opacity: 0.7,
                          fontSize: '0.7rem',
                        }}
                      >
                        via {message.provider}
                      </Typography>
                    )}
                  </Paper>
                </ListItem>
              ))}

              {/* Streaming message */}
              {isStreaming && streamingContent && (
                <ListItem
                  sx={{
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    p: 0.5,
                  }}
                >
                  <Paper
                    elevation={1}
                    sx={{
                      p: 1,
                      maxWidth: '85%',
                      bgcolor: 'white',
                      borderRadius: 2,
                      position: 'relative',
                    }}
                  >
                    <Typography variant="body2">
                      {formatMessage(streamingContent)}
                    </Typography>
                    <Box
                      sx={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        mt: 0.5,
                      }}
                    >
                      <CircularProgress size={12} sx={{ mr: 0.5 }} />
                      <Typography variant="caption" color="text.secondary">
                        Typing...
                      </Typography>
                    </Box>
                  </Paper>
                </ListItem>
              )}

              {/* Loading indicator */}
              {(isLoading || isStreaming) && !streamingContent && (
                <ListItem
                  sx={{
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    p: 0.5,
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CircularProgress size={16} />
                    <Typography variant="caption" color="text.secondary">
                      AI is thinking...
                    </Typography>
                  </Box>
                </ListItem>
              )}
            </List>

            <div ref={messagesEndRef} />
          </Box>

          {/* Error Display */}
          {error && (
            <Alert
              severity="error"
              onClose={() => dispatch(clearError())}
              sx={{ mx: 1, mb: 1 }}
            >
              {error}
            </Alert>
          )}

          {/* Input Area - Fixed at bottom */}
          <Box
            sx={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              bgcolor: 'white',
              borderTop: '1px solid',
              borderColor: 'divider',
            }}
          >
            {/* Clear button row */}
            {conversationHistory.length > 0 && (
              <Box
                sx={{
                  px: 1,
                  pt: 0.5,
                  display: 'flex',
                  justifyContent: 'center',
                }}
              >
                <IconButton
                  size="small"
                  onClick={handleClearConversation}
                  sx={{
                    color: 'text.secondary',
                    fontSize: '0.75rem',
                    borderRadius: 2,
                    px: 1,
                    '&:hover': {
                      color: 'text.primary',
                      bgcolor: 'grey.100',
                      transform: 'scale(1.02)',
                    },
                    transition: 'all 0.2s ease-in-out',
                  }}
                  title="Clear conversation"
                >
                  <ClearIcon fontSize="small" />
                  <Typography variant="caption" sx={{ ml: 0.5 }}>
                    Clear Chat
                  </Typography>
                </IconButton>
              </Box>
            )}
            
            {/* Input row */}
            <Box
              sx={{
                p: 1,
                display: 'flex',
                gap: 1,
                alignItems: 'flex-end',
              }}
            >
              <TextField
                ref={inputRef}
                fullWidth
                multiline
                maxRows={3}
                placeholder="Type your message..."
                value={currentMessage}
                onChange={(e) => dispatch(setCurrentMessage(e.target.value))}
                onKeyPress={handleKeyPress}
                disabled={isLoading || isStreaming}
                size="small"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 3,
                    bgcolor: 'grey.50',
                    '&:hover': {
                      bgcolor: 'white',
                    },
                    '&.Mui-focused': {
                      bgcolor: 'white',
                    },
                  },
                }}
              />
              <IconButton
                color="primary"
                onClick={handleSendMessage}
                disabled={!currentMessage.trim() || isLoading || isStreaming}
                sx={{
                  bgcolor: 'primary.main',
                  color: 'white',
                  width: 40,
                  height: 40,
                  flexShrink: 0,
                  '&:hover': {
                    bgcolor: 'primary.dark',
                    transform: 'scale(1.05)',
                  },
                  '&:disabled': {
                    bgcolor: 'grey.300',
                    transform: 'none',
                  },
                  transition: 'all 0.2s ease-in-out',
                }}
              >
                <SendIcon fontSize="small" />
              </IconButton>
            </Box>
          </Box>
        </>
      )}
    </Paper>
  );
};

export default ChatOverlay;
