/**
 * Styled components for AiChatAssistant
 * Clean, minimal design inspired by Perplexity AI
 */

import { Box, IconButton, Paper, TextField, styled } from '@mui/material';

export const ChatContainer = styled(Box)(({ theme, isFullscreen }) => ({
  height: isFullscreen ? '100vh' : '80vh',
  width: '100%',
  display: 'flex',
  flexDirection: 'column',
  backgroundColor: theme.palette.background.default,
  borderRadius: isFullscreen ? 0 : theme.spacing(2),
  border: isFullscreen ? 'none' : `1px solid ${theme.palette.divider}`,
  overflow: 'hidden',
  position: isFullscreen ? 'fixed' : 'relative',
  top: isFullscreen ? 0 : 'auto',
  left: isFullscreen ? 0 : 'auto',
  zIndex: isFullscreen ? 1300 : 'auto',
}));

export const HeaderContainer = styled(Paper)(({ theme }) => ({
  backgroundColor: theme.palette.background.paper,
  borderRadius: 0,
  borderBottom: `1px solid ${theme.palette.divider}`,
  padding: theme.spacing(2),
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  minHeight: 64,
  boxShadow: 'none',
}));

export const MessagesContainer = styled(Box)(({ theme }) => ({
  flex: 1,
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
  backgroundColor: theme.palette.background.default,
}));

export const MessagesScrollArea = styled(Box)(({ theme }) => ({
  flex: 1,
  overflowY: 'auto',
  padding: theme.spacing(2),
  '&::-webkit-scrollbar': {
    width: 6,
  },
  '&::-webkit-scrollbar-track': {
    backgroundColor: 'transparent',
  },
  '&::-webkit-scrollbar-thumb': {
    backgroundColor: theme.palette.divider,
    borderRadius: 3,
    '&:hover': {
      backgroundColor: theme.palette.text.secondary,
    },
  },
}));

export const MessageBubble = styled(Paper)(({ theme, isUser, isStreaming }) => ({
  maxWidth: '80%',
  minWidth: 'auto',
  padding: theme.spacing(1.5, 2),
  marginBottom: theme.spacing(1.5),
  backgroundColor: isUser 
    ? theme.palette.primary.main 
    : theme.palette.background.paper,
  color: isUser 
    ? theme.palette.primary.contrastText 
    : theme.palette.text.primary,
  borderRadius: theme.spacing(2),
  border: isUser ? 'none' : `1px solid ${theme.palette.divider}`,
  alignSelf: isUser ? 'flex-end' : 'flex-start',
  boxShadow: 'none',
  position: 'relative',
  '&::before': isStreaming ? {
    content: '""',
    position: 'absolute',
    right: 8,
    bottom: 8,
    width: 2,
    height: 16,
    backgroundColor: theme.palette.primary.main,
    animation: 'blink 1s linear infinite',
    '@keyframes blink': {
      '0%, 50%': { opacity: 1 },
      '51%, 100%': { opacity: 0 },
    },
  } : {},
}));

export const InputContainer = styled(Paper)(({ theme }) => ({
  backgroundColor: theme.palette.background.paper,
  borderRadius: 0,
  borderTop: `1px solid ${theme.palette.divider}`,
  padding: theme.spacing(2),
  display: 'flex',
  alignItems: 'flex-end',
  gap: theme.spacing(1),
  boxShadow: 'none',
}));

export const StyledTextField = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    borderRadius: theme.spacing(3),
    backgroundColor: theme.palette.background.default,
    '& fieldset': {
      borderColor: theme.palette.divider,
    },
    '&:hover fieldset': {
      borderColor: theme.palette.text.secondary,
    },
    '&.Mui-focused fieldset': {
      borderColor: theme.palette.primary.main,
      borderWidth: 1,
    },
  },
  '& .MuiInputBase-input::placeholder': {
    color: theme.palette.text.secondary,
    opacity: 0.7,
  },
}));

export const ActionButton = styled(IconButton)(({ theme, variant = 'default' }) => ({
  width: 40,
  height: 40,
  backgroundColor: variant === 'primary' 
    ? theme.palette.primary.main 
    : 'transparent',
  color: variant === 'primary' 
    ? theme.palette.primary.contrastText 
    : theme.palette.text.secondary,
  border: variant === 'outlined' 
    ? `1px solid ${theme.palette.divider}` 
    : 'none',
  '&:hover': {
    backgroundColor: variant === 'primary' 
      ? theme.palette.primary.dark 
      : theme.palette.action.hover,
  },
  '&:disabled': {
    backgroundColor: theme.palette.action.disabledBackground,
    color: theme.palette.action.disabled,
  },
}));

export const LoadingDots = styled(Box)(({ theme }) => ({
  display: 'flex',
  gap: theme.spacing(0.5),
  padding: theme.spacing(1),
  '& > div': {
    width: 6,
    height: 6,
    borderRadius: '50%',
    backgroundColor: theme.palette.text.secondary,
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
      transform: 'scale(0.8)',
      opacity: 0.5,
    },
    '40%': {
      transform: 'scale(1)',
      opacity: 1,
    },
  },
}));
