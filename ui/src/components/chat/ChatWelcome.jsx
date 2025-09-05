/**
 * Chat welcome screen component with feature suggestions and getting started info
 * Similar to ChatGPT welcome screen with future feature previews
 */

import React from 'react';
import {
  Box,
  Card,
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
  justifyContent: 'flex-start',
  height: '100%',
  padding: theme.spacing(4, 4, 6, 4),
  textAlign: 'center',
  maxWidth: '1200px',
  margin: '0 auto',
  overflowY: 'auto',
  minHeight: 0,
}));

const WelcomeTitle = styled(Typography)(({ theme }) => ({
  marginBottom: theme.spacing(3),
  fontWeight: 600,
  fontSize: '2.5rem',
  background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
  backgroundClip: 'text',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
}));

const FeatureGrid = styled(Grid)(({ theme }) => ({
  marginTop: theme.spacing(6),
  maxWidth: '1000px',
  width: '100%',
}));

const FeatureCard = styled(Card)(({ theme, disabled }) => ({
  height: '120px',
  cursor: disabled ? 'not-allowed' : 'pointer',
  opacity: disabled ? 0.6 : 1,
  transition: 'all 0.3s ease',
  padding: theme.spacing(2),
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: theme.palette.background.paper,
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: '12px',
  '&:hover': {
    transform: disabled ? 'none' : 'translateY(-4px)',
    boxShadow: disabled ? theme.shadows[2] : theme.shadows[8],
    borderColor: disabled ? theme.palette.divider : theme.palette.primary.light,
  },
}));

const FeatureIcon = styled(Box)(({ theme, disabled }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 40,
  height: 40,
  borderRadius: '12px',
  backgroundColor: disabled 
    ? theme.palette.grey[200] 
    : `${theme.palette.primary.main}15`,
  color: disabled 
    ? theme.palette.grey[500] 
    : theme.palette.primary.main,
  marginBottom: theme.spacing(1),
  '& .MuiSvgIcon-root': {
    fontSize: '20px',
  },
}));

const features = [
  {
    icon: ChatIcon,
    title: 'AI Assistant',
    description: 'Help with coding & debugging',
    available: true,
  },
  {
    icon: AttachFileIcon,
    title: 'File Attachments',
    description: 'Upload files (Coming Soon)',
    available: false,
    feature: FUTURE_FEATURES.ATTACHMENTS.FILES,
  },
  {
    icon: ImageIcon,
    title: 'Create Images',
    description: 'Generate images (Coming Soon)',
    available: false,
    feature: FUTURE_FEATURES.COMMANDS.CREATE_IMAGE,
  },
  {
    icon: SearchIcon,
    title: 'Web Search',
    description: 'Real-time search (Coming Soon)',
    available: false,
    feature: FUTURE_FEATURES.COMMANDS.WEB_SEARCH,
  },
  {
    icon: MicIcon,
    title: 'Voice Commands',
    description: 'Talk to AI (Coming Soon)',
    available: false,
    feature: FUTURE_FEATURES.COMMANDS.VOICE,
  },
];

/**
 * ChatWelcome component
 * @param {object} props - Component props
 * @param {function} props.onSendMessage - Handler for sending a message
 * @returns {React.Element} ChatWelcome component
 */
const ChatWelcome = () => {
  logger.info('ChatWelcome', 'Rendering welcome screen');

  const handleFeatureClick = (feature) => {
    if (feature.available) {
      logger.info('ChatWelcome', 'handleFeatureClick', `Feature clicked: ${feature.title}`);
      // Handle available feature click
    } else {
      logger.info('ChatWelcome', 'handleFeatureClick', `Coming soon feature: ${feature.title}`);
    }
  };
  return (
    <WelcomeContainer>
      <Box sx={{ mt: 4 }}>
        <WelcomeTitle variant="h3">
          AI Chat Assistant
        </WelcomeTitle>
      </Box>

      <FeatureGrid container spacing={2}>
        {features.map((feature) => {
          const IconComponent = feature.icon;
          const isDisabled = !feature.available;

          return (
            <Grid item key={feature.title} lg={3} md={6} sm={6} xs={12}>
              <FeatureCard 
                disabled={isDisabled}
                onClick={() => handleFeatureClick(feature)}
              >
                <FeatureIcon disabled={isDisabled}>
                  <IconComponent />
                </FeatureIcon>
                <Typography gutterBottom sx={{ fontWeight: 600, fontSize: '0.95rem' }} variant="h6">
                  {feature.title}
                </Typography>
                <Typography color="text.secondary" sx={{ fontSize: '0.8rem', lineHeight: 1.3 }} variant="body2">
                  {feature.description}
                </Typography>
              </FeatureCard>
            </Grid>
          );
        })}
      </FeatureGrid>
    </WelcomeContainer>
  );
};

export default ChatWelcome;
