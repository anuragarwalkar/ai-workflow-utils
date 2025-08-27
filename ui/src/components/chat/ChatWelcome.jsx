/**
 * Chat welcome screen component with feature suggestions and getting started info
 * Similar to ChatGPT welcome screen with future feature previews
 */

import React from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  Typography,
} from '@mui/material';
import {
  AttachFile as AttachFileIcon,
  Chat as ChatIcon,
  Image as ImageIcon,
  Mic as MicIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { FUTURE_FEATURES } from '../../constants/chat.js';
import { createLogger } from '../../utils/log.js';

const logger = createLogger('ChatWelcome');

const WelcomeContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  height: '100%',
  padding: theme.spacing(4),
  textAlign: 'center',
}));

const WelcomeTitle = styled(Typography)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  fontWeight: 600,
  background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
  backgroundClip: 'text',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
}));

const FeatureGrid = styled(Grid)(({ theme }) => ({
  marginTop: theme.spacing(4),
  maxWidth: '800px',
}));

const FeatureCard = styled(Card)(({ theme, disabled }) => ({
  height: '100%',
  cursor: disabled ? 'not-allowed' : 'pointer',
  opacity: disabled ? 0.6 : 1,
  transition: 'all 0.2s ease',
  '&:hover': {
    transform: disabled ? 'none' : 'translateY(-2px)',
    boxShadow: disabled ? theme.shadows[1] : theme.shadows[4],
  },
}));

const FeatureIcon = styled(Box)(({ theme, disabled }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 48,
  height: 48,
  borderRadius: '12px',
  backgroundColor: disabled 
    ? theme.palette.grey[300] 
    : theme.palette.primary.light,
  color: disabled 
    ? theme.palette.grey[600] 
    : theme.palette.primary.main,
  marginBottom: theme.spacing(2),
  margin: '0 auto',
  '& .MuiSvgIcon-root': {
    fontSize: '24px',
  },
}));

const StarterPrompts = styled(Box)(({ theme }) => ({
  marginTop: theme.spacing(3),
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(1),
  maxWidth: '600px',
}));

const PromptButton = styled(Button)(({ theme }) => ({
  textAlign: 'left',
  justifyContent: 'flex-start',
  borderRadius: theme.spacing(2),
  padding: theme.spacing(1.5, 2),
  textTransform: 'none',
  color: theme.palette.text.primary,
  backgroundColor: 'transparent',
  border: `1px solid ${theme.palette.divider}`,
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
    borderColor: theme.palette.primary.main,
  },
}));

const features = [
  {
    icon: ChatIcon,
    title: 'AI Assistant',
    description: 'Get help with coding, debugging, and documentation',
    available: true,
  },
  {
    icon: AttachFileIcon,
    title: 'File Attachments',
    description: 'Upload photos, videos, and documents (Coming Soon)',
    available: false,
    feature: FUTURE_FEATURES.ATTACHMENTS.FILES,
  },
  {
    icon: ImageIcon,
    title: 'Create Images',
    description: 'Generate images and diagrams (Coming Soon)',
    available: false,
    feature: FUTURE_FEATURES.COMMANDS.CREATE_IMAGE,
  },
  {
    icon: SearchIcon,
    title: 'Web Search',
    description: 'Search the web for real-time information (Coming Soon)',
    available: false,
    feature: FUTURE_FEATURES.COMMANDS.WEB_SEARCH,
  },
  {
    icon: MicIcon,
    title: 'Voice Commands',
    description: 'Talk to your AI assistant (Coming Soon)',
    available: false,
    feature: FUTURE_FEATURES.COMMANDS.VOICE,
  },
];

const starterPrompts = [
  'Help me debug this JavaScript function',
  'Explain how React hooks work',
  'Write a Python script to process CSV files',
  'What are the best practices for API design?',
  'Create a responsive CSS layout',
];

/**
 * ChatWelcome component
 * @param {object} props - Component props
 * @param {function} props.onSendMessage - Handler for sending a message
 * @returns {React.Element} ChatWelcome component
 */
const ChatWelcome = ({ onSendMessage }) => {
  logger.info('ChatWelcome', 'Rendering welcome screen');

  const handleFeatureClick = (feature) => {
    if (feature.available) {
      logger.info('ChatWelcome', 'handleFeatureClick', `Feature clicked: ${feature.title}`);
      // Handle available feature click
    } else {
      logger.info('ChatWelcome', 'handleFeatureClick', `Coming soon feature: ${feature.title}`);
    }
  };

  const handlePromptClick = (prompt) => {
    logger.info('ChatWelcome', 'handlePromptClick', `Prompt selected: ${prompt}`);
    onSendMessage?.(prompt);
  };

  return (
    <WelcomeContainer>
      <WelcomeTitle variant="h3">
        AI Chat Assistant
      </WelcomeTitle>
      
      <Typography color="text.secondary" variant="h6">
        Your intelligent coding companion
      </Typography>
      
      <Typography color="text.secondary" sx={{ mt: 2, maxWidth: '600px' }} variant="body1">
        Get help with coding, debugging, documentation, and more. 
        Start a conversation below or try one of these suggestions.
      </Typography>

      <FeatureGrid container spacing={3}>
        {features.map((feature) => {
          const IconComponent = feature.icon;
          const isDisabled = !feature.available;

          return (
            <Grid item key={feature.title} md={4} sm={6} xs={12}>
              <FeatureCard 
                disabled={isDisabled}
                onClick={() => handleFeatureClick(feature)}
              >
                <CardContent>
                  <FeatureIcon disabled={isDisabled}>
                    <IconComponent />
                  </FeatureIcon>
                  <Typography gutterBottom variant="h6">
                    {feature.title}
                  </Typography>
                  <Typography color="text.secondary" variant="body2">
                    {feature.description}
                  </Typography>
                </CardContent>
              </FeatureCard>
            </Grid>
          );
        })}
      </FeatureGrid>

      <StarterPrompts>
        <Typography sx={{ mb: 2 }} variant="h6">
          Try these prompts:
        </Typography>
        {starterPrompts.map((prompt) => (
          <PromptButton
            key={prompt}
            variant="outlined"
            onClick={() => handlePromptClick(prompt)}
          >
            {prompt}
          </PromptButton>
        ))}
      </StarterPrompts>
    </WelcomeContainer>
  );
};

export default ChatWelcome;
