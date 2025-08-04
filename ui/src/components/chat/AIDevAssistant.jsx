import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  IconButton,
  Fab,
  Fade,
  Slide,
  Avatar,
  LinearProgress,
  Chip,
  Tooltip,
  useTheme,
  alpha,
} from '@mui/material';
import {
  SmartToy as AIIcon,
  Send as SendIcon,
  Clear as ClearIcon,
  Close as CloseIcon,
  Code as CodeIcon,
  BugReport as BugIcon,
  Architecture as ArchIcon,
  Psychology as PsyIcon,
  AutoFixHigh as MagicIcon,
  Fullscreen as FullscreenIcon,
  FullscreenExit as FullscreenExitIcon,
} from '@mui/icons-material';
import { keyframes } from '@emotion/react';

// Futuristic animations
const pulseGlow = keyframes`
  0% { box-shadow: 0 0 20px rgba(25, 118, 210, 0.4); }
  50% { box-shadow: 0 0 40px rgba(25, 118, 210, 0.8); }
  100% { box-shadow: 0 0 20px rgba(25, 118, 210, 0.4); }
`;

const gradientShift = keyframes`
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`;

const AIDevAssistant = () => {
  const theme = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [message, setMessage] = useState('');
  const [conversation, setConversation] = useState([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [sessionId] = useState(`dev_session_${Date.now()}`);
  const messagesEndRef = useRef(null);
  const streamingSourceRef = useRef(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation, streamingContent]);

  // Cleanup on unmount
  useEffect(() => {
    const currentSource = streamingSourceRef.current;
    return () => {
      if (currentSource) {
        currentSource.close();
      }
    };
  }, []);

  const sendMessage = async () => {
    if (!message.trim() || isStreaming) return;

    const userMessage = {
      role: 'user',
      content: message.trim(),
      timestamp: new Date(),
    };
    setConversation(prev => [...prev, userMessage]);
    setMessage('');
    setIsStreaming(true);
    setStreamingContent('');

    try {
      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'text/event-stream',
        },
        body: JSON.stringify({
          message: userMessage.content,
          template: 'CHAT_DEV',
          sessionId,
          conversationHistory: conversation.slice(-8), // Keep last 8 messages for context
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));

              if (data.type === 'token') {
                accumulatedContent += data.content;
                setStreamingContent(accumulatedContent);
              } else if (data.type === 'complete') {
                const aiMessage = {
                  role: 'assistant',
                  content: accumulatedContent,
                  timestamp: new Date(),
                  provider: data.provider || 'AI',
                };
                setConversation(prev => [...prev, aiMessage]);
                setStreamingContent('');
                setIsStreaming(false);
              } else if (data.type === 'error') {
                throw new Error(data.error || 'Unknown error occurred');
              }
            } catch (e) {
              console.warn('Failed to parse SSE data:', line, e);
            }
          }
        }
      }
    } catch (error) {
      console.error('Streaming error:', error);
      const errorMessage = {
        role: 'assistant',
        content: `⚠️ Sorry, I encountered an error: ${error.message}. Please try again.`,
        timestamp: new Date(),
        isError: true,
      };
      setConversation(prev => [...prev, errorMessage]);
      setStreamingContent('');
      setIsStreaming(false);
    }
  };

  const clearConversation = () => {
    setConversation([]);
    setStreamingContent('');
  };

  const handleKeyPress = e => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatContent = content => {
    // Simple markdown-like formatting for code blocks and emphasis
    return content
      .replace(
        /```(.*?)```/gs,
        '<pre style="background: rgba(0,0,0,0.1); padding: 8px; border-radius: 4px; margin: 8px 0;"><code>$1</code></pre>'
      )
      .replace(
        /`([^`]+)`/g,
        '<code style="background: rgba(0,0,0,0.1); padding: 2px 4px; border-radius: 3px;">$1</code>'
      )
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br/>');
  };

  const quickActions = [
    {
      icon: CodeIcon,
      label: 'Code Review',
      prompt:
        'Help me review this code for best practices and potential improvements',
    },
    {
      icon: BugIcon,
      label: 'Debug Issue',
      prompt: 'I have a bug in my application. Can you help me debug it?',
    },
    {
      icon: ArchIcon,
      label: 'Architecture',
      prompt: 'I need advice on system architecture and design patterns',
    },
    {
      icon: PsyIcon,
      label: 'Explain Concept',
      prompt: 'Can you explain a programming concept or technology?',
    },
  ];

  if (!isOpen) {
    return (
      <Tooltip title='AI Development Assistant' placement='left'>
        <Fab
          color='primary'
          onClick={() => setIsOpen(true)}
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
            animation: `${pulseGlow} 2s ease-in-out infinite`,
            '&:hover': {
              background: `linear-gradient(45deg, ${theme.palette.primary.dark}, ${theme.palette.secondary.dark})`,
              transform: 'scale(1.1)',
            },
            transition: 'all 0.3s ease',
          }}
        >
          <AIIcon sx={{ fontSize: 28 }} />
        </Fab>
      </Tooltip>
    );
  }

  return (
    <Slide direction='up' in={isOpen} mountOnEnter unmountOnExit>
      <Paper
        elevation={24}
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          width: isExpanded ? 600 : 400,
          height: isExpanded ? 700 : 500,
          display: 'flex',
          flexDirection: 'column',
          background: `linear-gradient(135deg, 
            ${alpha(theme.palette.background.paper, 0.95)}, 
            ${alpha(theme.palette.primary.main, 0.05)}
          )`,
          backdropFilter: 'blur(20px)',
          border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
          borderRadius: 3,
          overflow: 'hidden',
          transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
          zIndex: 1300,
        }}
      >
        {/* Header */}
        <Box
          sx={{
            p: 2,
            background: `linear-gradient(90deg, 
              ${theme.palette.primary.main}, 
              ${theme.palette.secondary.main}
            )`,
            backgroundSize: '200% 200%',
            animation: `${gradientShift} 4s ease infinite`,
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Avatar
              sx={{
                background: alpha(theme.palette.common.white, 0.2),
                width: 32,
                height: 32,
              }}
            >
              <AIIcon />
            </Avatar>
            <Box>
              <Typography
                variant='h6'
                sx={{ fontWeight: 700, fontSize: '1rem' }}
              >
                AI Dev Assistant
              </Typography>
              <Typography variant='caption' sx={{ opacity: 0.9 }}>
                Powered by LangChain • Development Optimized
              </Typography>
            </Box>
          </Box>
          <Box>
            <IconButton
              onClick={() => setIsExpanded(!isExpanded)}
              sx={{ color: 'white', mr: 1 }}
            >
              {isExpanded ? <FullscreenExitIcon /> : <FullscreenIcon />}
            </IconButton>
            <IconButton
              onClick={() => setIsOpen(false)}
              sx={{ color: 'white' }}
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>

        {/* Status Bar */}
        {isStreaming && (
          <LinearProgress
            sx={{
              height: 3,
              '& .MuiLinearProgress-bar': {
                background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
              },
            }}
          />
        )}

        {/* Messages Area */}
        <Box
          sx={{
            flex: 1,
            overflow: 'auto',
            p: 2,
            background: alpha(theme.palette.background.default, 0.3),
          }}
        >
          {conversation.length === 0 && !streamingContent && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <MagicIcon
                sx={{ fontSize: 48, color: theme.palette.primary.main, mb: 2 }}
              />
              <Typography variant='h6' gutterBottom>
                Welcome to AI Dev Assistant
              </Typography>
              <Typography variant='body2' color='textSecondary' sx={{ mb: 3 }}>
                I'm here to help with code review, debugging, architecture
                advice, and development questions.
              </Typography>

              {/* Quick Actions */}
              <Box
                sx={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 1,
                  justifyContent: 'center',
                }}
              >
                {quickActions.map((action, index) => (
                  <Chip
                    key={index}
                    icon={<action.icon />}
                    label={action.label}
                    variant='outlined'
                    clickable
                    onClick={() => setMessage(action.prompt)}
                    sx={{
                      '&:hover': {
                        background: alpha(theme.palette.primary.main, 0.1),
                        borderColor: theme.palette.primary.main,
                      },
                    }}
                  />
                ))}
              </Box>
            </Box>
          )}

          {conversation.map((msg, index) => (
            <Fade in key={index} timeout={300}>
              <Box
                sx={{
                  mb: 2,
                  display: 'flex',
                  justifyContent:
                    msg.role === 'user' ? 'flex-end' : 'flex-start',
                }}
              >
                <Paper
                  elevation={2}
                  sx={{
                    p: 2,
                    maxWidth: '85%',
                    background:
                      msg.role === 'user'
                        ? `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`
                        : msg.isError
                          ? alpha(theme.palette.error.main, 0.1)
                          : alpha(theme.palette.background.paper, 0.9),
                    color: msg.role === 'user' ? 'white' : 'inherit',
                    borderRadius: 2,
                    border: msg.isError
                      ? `1px solid ${theme.palette.error.main}`
                      : msg.role === 'assistant'
                        ? `1px solid ${alpha(theme.palette.primary.main, 0.2)}`
                        : 'none',
                  }}
                >
                  <Typography
                    variant='body2'
                    sx={{
                      whiteSpace: 'pre-wrap',
                      '& code': {
                        fontFamily:
                          'Monaco, Consolas, "Lucida Console", monospace',
                        fontSize: '0.85em',
                      },
                      '& pre': {
                        fontFamily:
                          'Monaco, Consolas, "Lucida Console", monospace',
                        fontSize: '0.85em',
                        overflow: 'auto',
                      },
                    }}
                    dangerouslySetInnerHTML={{
                      __html: formatContent(msg.content),
                    }}
                  />
                  {msg.provider && (
                    <Typography
                      variant='caption'
                      sx={{
                        display: 'block',
                        mt: 1,
                        opacity: 0.7,
                        fontSize: '0.7rem',
                      }}
                    >
                      via {msg.provider}
                    </Typography>
                  )}
                </Paper>
              </Box>
            </Fade>
          ))}

          {/* Streaming Content */}
          {streamingContent && (
            <Box
              sx={{
                mb: 2,
                display: 'flex',
                justifyContent: 'flex-start',
              }}
            >
              <Paper
                elevation={2}
                sx={{
                  p: 2,
                  maxWidth: '85%',
                  background: alpha(theme.palette.background.paper, 0.9),
                  borderRadius: 2,
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                }}
              >
                <Typography
                  variant='body2'
                  sx={{
                    whiteSpace: 'pre-wrap',
                    '&::after': {
                      content: '"|"',
                      animation: 'blink 1s infinite',
                      color: theme.palette.primary.main,
                    },
                    '@keyframes blink': {
                      '0%, 50%': { opacity: 1 },
                      '51%, 100%': { opacity: 0 },
                    },
                  }}
                  dangerouslySetInnerHTML={{
                    __html: formatContent(streamingContent),
                  }}
                />
              </Paper>
            </Box>
          )}

          <div ref={messagesEndRef} />
        </Box>

        {/* Input Area */}
        <Box
          sx={{
            p: 2,
            background: alpha(theme.palette.background.paper, 0.9),
            borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          }}
        >
          <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
            <TextField
              fullWidth
              multiline
              maxRows={3}
              value={message}
              onChange={e => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder='Ask me about code, debugging, architecture, or development practices...'
              variant='outlined'
              disabled={isStreaming}
              sx={{
                '& .MuiOutlinedInput-root': {
                  background: alpha(theme.palette.background.paper, 0.7),
                  '&:hover': {
                    background: alpha(theme.palette.background.paper, 0.9),
                  },
                  '&.Mui-focused': {
                    background: theme.palette.background.paper,
                  },
                },
              }}
            />
            <IconButton
              onClick={sendMessage}
              disabled={!message.trim() || isStreaming}
              sx={{
                background:
                  message.trim() && !isStreaming
                    ? `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`
                    : alpha(theme.palette.action.disabled, 0.1),
                color: 'white',
                '&:hover': {
                  background:
                    message.trim() && !isStreaming
                      ? `linear-gradient(45deg, ${theme.palette.primary.dark}, ${theme.palette.secondary.dark})`
                      : alpha(theme.palette.action.disabled, 0.2),
                },
                '&.Mui-disabled': {
                  color: alpha(theme.palette.action.disabled, 0.5),
                },
              }}
            >
              <SendIcon />
            </IconButton>
          </Box>

          {conversation.length > 0 && (
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Typography variant='caption' color='textSecondary'>
                Session: {sessionId.split('_').slice(-1)[0]}
              </Typography>
              <IconButton
                size='small'
                onClick={clearConversation}
                sx={{ color: theme.palette.text.secondary }}
              >
                <ClearIcon fontSize='small' />
              </IconButton>
            </Box>
          )}
        </Box>
      </Paper>
    </Slide>
  );
};

export default AIDevAssistant;
