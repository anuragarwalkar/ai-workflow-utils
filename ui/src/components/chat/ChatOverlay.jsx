import React, { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Alert,
  Box,
  Chip,
  CircularProgress,
  Collapse,
  Divider,
  Fab,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Paper,
  TextField,
  Typography,
} from '@mui/material';
import {
  Chat as ChatIcon,
  Clear as ClearIcon,
  Close as CloseIcon,
  Maximize as MaximizeIcon,
  Minimize as MinimizeIcon,
  Send as SendIcon,
} from '@mui/icons-material';
import {
  addMessage,
  clearConversation,
  clearError,
  closeChat,
  maximizeChat,
  minimizeChat,
  setCurrentMessage,
  setError,
  setProvider,
  setStreaming,
  setStreamingContent,
  toggleChat,
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
  } = useSelector(state => state.chat);

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
        conversationHistory,
        template: 'CHAT_GENERIC', // Use generic template for overlay chat
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

  const handleKeyPress = event => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  const handleClearConversation = () => {
    dispatch(clearConversation());
  };

  const formatMessage = content => {
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
          aria-label='chat'
          color='primary'
          sx={{
            width: '80px', // Made bigger horizontally
            height: '60px', // Slightly taller
            borderRadius: '30px', // More oval shape
            animation:
              'chatPulse 2s ease-in-out infinite, chatFloat 3s ease-in-out infinite',
            '&:hover': {
              animation:
                'chatBounce 0.6s ease-in-out infinite, chatGlow 1s ease-in-out infinite',
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
                boxShadow:
                  '0 0 20px rgba(25, 118, 210, 0.8), 0 0 30px rgba(25, 118, 210, 0.6)',
              },
            },
          }}
          onClick={() => dispatch(toggleChat())}
        >
          <ChatIcon
            sx={{
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
            }}
          />
        </Fab>
        <Typography
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
          variant='caption'
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
          <Typography variant='subtitle2'>AI Assistant</Typography>
          {provider ? (
            <Chip
              label={provider}
              size='small'
              sx={{
                bgcolor: 'rgba(255, 255, 255, 0.2)',
                color: 'inherit',
                fontSize: '0.7rem',
                height: 20,
              }}
            />
          ) : null}
        </Box>
        <Box>
          {!isMinimized && (
            <IconButton
              size='small'
              sx={{ color: 'inherit', mr: 0.5 }}
              onClick={() => dispatch(minimizeChat())}
            >
              <MinimizeIcon fontSize='small' />
            </IconButton>
          )}
          <IconButton
            size='small'
            sx={{ color: 'inherit' }}
            title='Close chat'
            onClick={() => dispatch(closeChat())}
          >
            <CloseIcon fontSize='small' />
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
              paddingBottom: '100px', // Increased space for input area and clear button
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
                <Typography color='text.secondary' variant='body2'>
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
                    alignItems:
                      message.role === 'user' ? 'flex-end' : 'flex-start',
                    p: 0.5,
                  }}
                >
                  <Paper
                    elevation={1}
                    sx={{
                      p: 1,
                      maxWidth: '85%',
                      bgcolor:
                        message.role === 'user' ? 'primary.main' : 'white',
                      color:
                        message.role === 'user'
                          ? 'primary.contrastText'
                          : 'text.primary',
                      borderRadius: 2,
                    }}
                  >
                    <Typography variant='body2'>
                      {formatMessage(message.content)}
                    </Typography>
                    {message.provider ? (
                      <Typography
                        sx={{
                          display: 'block',
                          mt: 0.5,
                          opacity: 0.7,
                          fontSize: '0.7rem',
                        }}
                        variant='caption'
                      >
                        via {message.provider}
                      </Typography>
                    ) : null}
                  </Paper>
                </ListItem>
              ))}

              {/* Streaming message */}
              {isStreaming && streamingContent ? (
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
                    <Typography variant='body2'>
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
                      <Typography color='text.secondary' variant='caption'>
                        Typing...
                      </Typography>
                    </Box>
                  </Paper>
                </ListItem>
              ) : null}

              {/* Loading indicator */}
              {(isLoading || isStreaming) && !streamingContent ? (
                <ListItem
                  sx={{
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    p: 0.5,
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CircularProgress size={16} />
                    <Typography variant='caption' color='text.secondary'>
                      AI is thinking...
                    </Typography>
                  </Box>
                </ListItem>
              ) : null}
            </List>

            <div ref={messagesEndRef} style={{ marginBottom: '30px' }} />
          </Box>

          {/* Error Display */}
          {error ? (
            <Alert
              severity='error'
              sx={{ mx: 1, mb: 1 }}
              onClose={() => dispatch(clearError())}
            >
              {error}
            </Alert>
          ) : null}

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
                  pt: 1,
                  pb: 0.5,
                  display: 'flex',
                  justifyContent: 'center',
                }}
              >
                <IconButton
                  size='small'
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
                  title='Clear conversation'
                  onClick={handleClearConversation}
                >
                  <ClearIcon fontSize='small' />
                  <Typography sx={{ ml: 0.5 }} variant='caption'>
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
                fullWidth
                multiline
                disabled={isLoading || isStreaming}
                maxRows={3}
                placeholder='Type your message...'
                ref={inputRef}
                size='small'
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
                  marginBottom: 0,
                }}
                value={currentMessage}
                onChange={e => dispatch(setCurrentMessage(e.target.value))}
                onKeyPress={handleKeyPress}
              />
              <IconButton
                color='primary'
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
                onClick={handleSendMessage}
              >
                <SendIcon fontSize='small' />
              </IconButton>
            </Box>
          </Box>
        </>
      )}
    </Paper>
  );
};

export default ChatOverlay;
