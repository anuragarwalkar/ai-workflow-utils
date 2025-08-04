import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  IconButton,
  Avatar,
  Chip,
  Fade,
  useTheme,
} from '@mui/material';
import {
  Send as SendIcon,
  Code as CodeIcon,
  Clear as ClearIcon,
  SmartToy as AIIcon,
  Person as PersonIcon,
  AutoFixHigh as MagicIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useSendChatMessageStreamingMutation } from '../../store/api/chatApi';

const AiDevAssistant = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const [sendChatMessageStreaming] = useSendChatMessageStreamingMutation();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Welcome message
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        content:
          "👋 **Welcome to AI Development Assistant!**\n\nI'm your specialized coding companion, here to help with:\n\n🔧 **Code Analysis & Review**\n💡 **Problem Solving & Debugging**\n📋 **Development Planning**\n🚀 **Best Practices & Architecture**\n\nWhat can I help you build today?",
        timestamp: new Date().toISOString(),
        isWelcome: true,
      },
    ]);

    // Cleanup function not needed for this implementation
  }, []);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      role: 'user',
      content: inputMessage,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    // Add temporary loading message
    const loadingMessage = {
      id: 'loading',
      role: 'assistant',
      content: '',
      timestamp: new Date().toISOString(),
      isLoading: true,
    };
    setMessages(prev => [...prev, loadingMessage]);

    try {
      let assistantContent = '';
      let assistantMessageId = null;

      // Remove loading message and add real assistant message when first chunk arrives
      const handleFirstChunk = () => {
        if (!assistantMessageId) {
          assistantMessageId = `assistant-${Date.now()}`;
          setIsLoading(false); // Stop loading state when first chunk arrives
          setMessages(prev => {
            const filtered = prev.filter(msg => msg.id !== 'loading');
            return [
              ...filtered,
              {
                id: assistantMessageId,
                role: 'assistant',
                content: '',
                timestamp: new Date().toISOString(),
                isStreaming: true,
              },
            ];
          });
        }
      };

      const result = await sendChatMessageStreaming({
        message: inputMessage,
        template: 'CHAT_DEV',
        conversationHistory: messages
          .filter(msg => !msg.isWelcome && !msg.isLoading)
          .map(msg => ({
            role: msg.role,
            content: msg.content,
          })),
        onChunk: (chunk, fullContent) => {
          handleFirstChunk();
          assistantContent = fullContent;
          setMessages(prev =>
            prev.map(msg =>
              msg.id === assistantMessageId
                ? { ...msg, content: assistantContent }
                : msg
            )
          );
        },
        onStatus: (status, provider) => {
          console.log('AI Status:', status, 'Provider:', provider);
        },
      });

      if (result.error) {
        throw new Error(result.error.data || 'Failed to send message');
      }

      // Mark streaming as complete
      if (assistantMessageId) {
        setMessages(prev =>
          prev.map(msg =>
            msg.id === assistantMessageId ? { ...msg, isStreaming: false } : msg
          )
        );
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev =>
        prev.map(msg =>
          msg.id === 'loading'
            ? {
                ...msg,
                content:
                  'Sorry, I encountered an error processing your request. Please try again.',
                isError: true,
                isLoading: false,
              }
            : msg
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = e => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const clearConversation = () => {
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        content:
          "👋 **Welcome back!**\n\nI'm ready to help with your development tasks. What would you like to work on?",
        timestamp: new Date().toISOString(),
        isWelcome: true,
      },
    ]);
  };

  return (
    <Box
      sx={{
        height: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Animated Background */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `
          radial-gradient(circle at 20% 80%, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
          radial-gradient(circle at 80% 20%, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
          radial-gradient(circle at 40% 40%, rgba(255, 255, 255, 0.05) 0%, transparent 50%)
        `,
          animation: 'float 20s ease-in-out infinite',
          '@keyframes float': {
            '0%, 100%': { transform: 'translate(0px, 0px) rotate(0deg)' },
            '33%': { transform: 'translate(30px, -30px) rotate(120deg)' },
            '66%': { transform: 'translate(-20px, 20px) rotate(240deg)' },
          },
        }}
      />

      {/* Header */}
      <Paper
        elevation={0}
        sx={{
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(20px)',
          borderRadius: 0,
          borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
          p: 2,
          zIndex: 10,
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar
              sx={{
                background: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
                width: 48,
                height: 48,
              }}
            >
              <CodeIcon sx={{ fontSize: 24 }} />
            </Avatar>
            <Box>
              <Typography
                variant='h5'
                sx={{
                  color: 'white',
                  fontWeight: 700,
                  textShadow: '0 2px 4px rgba(0,0,0,0.3)',
                }}
              >
                AI Development Assistant
              </Typography>
              <Chip
                icon={<MagicIcon sx={{ fontSize: 16 }} />}
                label='Powered by LangChain'
                size='small'
                sx={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  color: 'white',
                  fontWeight: 600,
                }}
              />
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <IconButton
              onClick={clearConversation}
              sx={{
                background: 'rgba(255, 255, 255, 0.1)',
                color: 'white',
                '&:hover': { background: 'rgba(255, 255, 255, 0.2)' },
              }}
            >
              <ClearIcon />
            </IconButton>
            <IconButton
              onClick={() => navigate('/')}
              sx={{
                background: 'rgba(255, 255, 255, 0.1)',
                color: 'white',
                '&:hover': { background: 'rgba(255, 255, 255, 0.2)' },
              }}
            >
              ×
            </IconButton>
          </Box>
        </Box>
      </Paper>

      {/* Messages Area */}
      <Box
        sx={{
          flex: 1,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
        }}
      >
        <Box
          sx={{
            flex: 1,
            overflowY: 'auto',
            p: 2,
            '&::-webkit-scrollbar': {
              width: 8,
            },
            '&::-webkit-scrollbar-track': {
              background: 'rgba(255, 255, 255, 0.1)',
              borderRadius: 4,
            },
            '&::-webkit-scrollbar-thumb': {
              background: 'rgba(255, 255, 255, 0.3)',
              borderRadius: 4,
              '&:hover': {
                background: 'rgba(255, 255, 255, 0.5)',
              },
            },
          }}
        >
          {messages.map(message => (
            <Fade in={true} timeout={300} key={message.id}>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent:
                    message.role === 'user' ? 'flex-end' : 'flex-start',
                  mb: 2,
                  gap: 2,
                }}
              >
                {message.role === 'assistant' && (
                  <Avatar
                    sx={{
                      background: message.isWelcome
                        ? 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)'
                        : 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
                      width: 40,
                      height: 40,
                      alignSelf: 'flex-start',
                    }}
                  >
                    <AIIcon sx={{ fontSize: 20 }} />
                  </Avatar>
                )}

                <Paper
                  elevation={3}
                  sx={{
                    maxWidth: '80%',
                    minWidth: message.isLoading ? 100 : 'auto',
                    p: 2,
                    background:
                      message.role === 'user'
                        ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                        : 'rgba(255, 255, 255, 0.95)',
                    color: message.role === 'user' ? 'white' : 'black',
                    borderRadius:
                      message.role === 'user'
                        ? '20px 20px 4px 20px'
                        : '20px 20px 20px 4px',
                    backdropFilter: 'blur(10px)',
                    border:
                      message.role === 'assistant'
                        ? '1px solid rgba(255, 255, 255, 0.2)'
                        : 'none',
                    position: 'relative',
                    boxShadow:
                      message.role === 'user'
                        ? '0 8px 32px rgba(102, 126, 234, 0.3)'
                        : '0 8px 32px rgba(0, 0, 0, 0.1)',
                  }}
                >
                  {message.isLoading ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box
                        sx={{
                          display: 'flex',
                          gap: 0.5,
                          '& > div': {
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            background: theme.palette.primary.main,
                            animation: 'pulse 1.4s ease-in-out infinite both',
                          },
                          '& > div:nth-of-type(1)': {
                            animationDelay: '-0.32s',
                          },
                          '& > div:nth-of-type(2)': {
                            animationDelay: '-0.16s',
                          },
                          '@keyframes pulse': {
                            '0%, 80%, 100%': {
                              transform: 'scale(0)',
                            },
                            '40%': {
                              transform: 'scale(1)',
                            },
                          },
                        }}
                      >
                        <div />
                        <div />
                        <div />
                      </Box>
                      <Typography
                        variant='body2'
                        sx={{ color: 'text.secondary' }}
                      >
                        Thinking...
                      </Typography>
                    </Box>
                  ) : (
                    <Typography
                      variant='body1'
                      sx={{
                        whiteSpace: 'pre-wrap',
                        lineHeight: 1.6,
                        '& strong': { fontWeight: 700 },
                        '& code': {
                          background: 'rgba(0, 0, 0, 0.1)',
                          padding: '2px 6px',
                          borderRadius: 1,
                          fontFamily: 'monospace',
                        },
                      }}
                    >
                      {message.content || (message.isStreaming ? '▊' : '')}
                    </Typography>
                  )}

                  {message.isStreaming && message.content && (
                    <Box
                      sx={{
                        position: 'absolute',
                        right: 8,
                        bottom: 8,
                        width: 2,
                        height: 16,
                        background: theme.palette.primary.main,
                        animation: 'blink 1s linear infinite',
                        '@keyframes blink': {
                          '0%, 50%': { opacity: 1 },
                          '51%, 100%': { opacity: 0 },
                        },
                      }}
                    />
                  )}
                </Paper>

                {message.role === 'user' && (
                  <Avatar
                    sx={{
                      background:
                        'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                      width: 40,
                      height: 40,
                      alignSelf: 'flex-end',
                    }}
                  >
                    <PersonIcon sx={{ fontSize: 20 }} />
                  </Avatar>
                )}
              </Box>
            </Fade>
          ))}
          <div ref={messagesEndRef} />
        </Box>

        {/* Input Area */}
        <Paper
          elevation={0}
          sx={{
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(20px)',
            borderRadius: 0,
            borderTop: '1px solid rgba(255, 255, 255, 0.2)',
            p: 2,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <TextField
              fullWidth
              multiline
              maxRows={4}
              value={inputMessage}
              onChange={e => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder='Ask me about code, debugging, architecture, or any development question...'
              disabled={isLoading}
              sx={{
                '& .MuiOutlinedInput-root': {
                  background: 'rgba(255, 255, 255, 0.9)',
                  borderRadius: 3,
                  color: 'black',
                  '& fieldset': {
                    border: 'none',
                  },
                  '&:hover fieldset': {
                    border: 'none',
                  },
                  '&.Mui-focused fieldset': {
                    border: '2px solid rgba(255, 255, 255, 0.5)',
                  },
                },
                '& .MuiInputBase-input::placeholder': {
                  color: 'rgba(0, 0, 0, 0.6)',
                  opacity: 1,
                },
              }}
            />
            <IconButton
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isLoading}
              sx={{
                background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
                color: 'white',
                width: 48,
                height: 48,
                '&:hover': {
                  background:
                    'linear-gradient(135deg, #0f7b6c 0%, #2bb673 100%)',
                  transform: 'scale(1.05)',
                },
                '&:disabled': {
                  background: 'rgba(255, 255, 255, 0.2)',
                  color: 'rgba(255, 255, 255, 0.5)',
                },
                transition: 'all 0.2s ease',
              }}
            >
              <SendIcon />
            </IconButton>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
};

export default AiDevAssistant;
