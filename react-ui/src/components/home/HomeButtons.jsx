import React from 'react';
import { 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  Grid, 
  IconButton,
  Avatar,
  Stack
} from '@mui/material';
import { 
  BugReport as BugReportIcon,
  Visibility as VisibilityIcon,
  Email as EmailIcon,
  Build as BuildIcon,
  Add as AddIcon,
  Search as SearchIcon,
  Send as SendIcon,
  RocketLaunch as RocketLaunchIcon
} from '@mui/icons-material';
import { useDispatch } from 'react-redux';
import { setCurrentView } from '../../store/slices/appSlice';
import { openViewJiraModal } from '../../store/slices/uiSlice';
import { setBuildModalOpen } from '../../store/slices/buildSlice';

const HomeButtons = () => {
  const dispatch = useDispatch();

  const handleCreateJira = () => {
    dispatch(setCurrentView('createJira'));
  };

  const handleViewJira = () => {
    dispatch(openViewJiraModal());
  };

  const handleSendEmail = () => {
    dispatch(setCurrentView('sendEmail'));
  };

  const handleReleaseBuild = () => {
    dispatch(setBuildModalOpen(true));
  };

  const actionCards = [
    {
      title: 'Create Jira',
      description: 'Create new Jira tickets and track issues',
      icon: BugReportIcon,
      actionIcon: AddIcon,
      onClick: handleCreateJira,
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      shadowColor: 'rgba(102, 126, 234, 0.3)',
    },
    {
      title: 'View Jira',
      description: 'Browse and manage existing Jira tickets',
      icon: VisibilityIcon,
      actionIcon: SearchIcon,
      onClick: handleViewJira,
      gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      shadowColor: 'rgba(240, 147, 251, 0.3)',
    },
    {
      title: 'Send Email',
      description: 'Compose and send email notifications',
      icon: EmailIcon,
      actionIcon: SendIcon,
      onClick: handleSendEmail,
      gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      shadowColor: 'rgba(79, 172, 254, 0.3)',
    },
    {
      title: 'Release Mobile App',
      description: 'Build and release new mobile app version',
      icon: BuildIcon,
      actionIcon: RocketLaunchIcon,
      onClick: handleReleaseBuild,
      gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
      shadowColor: 'rgba(250, 112, 154, 0.3)',
    },
  ];

  return (
    <Box sx={{ py: 2, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
      <Grid container spacing={3} sx={{ maxWidth: 900, mx: 'auto', justifyContent: 'center' }}>
        {actionCards.map((card, index) => {
          const IconComponent = card.icon;
          const ActionIconComponent = card.actionIcon;
          
          return (
            <Grid item xs={12} md={4} key={index}>
              <Card
                sx={{
                  height: '100%',
                  cursor: 'pointer',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  background: 'rgba(255, 255, 255, 0.9)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '20px',
                  boxShadow: `0 8px 32px ${card.shadowColor}`,
                  '&:hover': {
                    transform: 'translateY(-8px) scale(1.02)',
                    boxShadow: `0 20px 60px ${card.shadowColor}`,
                    '& .action-button': {
                      transform: 'scale(1.1)',
                      background: card.gradient,
                    },
                    '& .main-icon': {
                      transform: 'scale(1.1)',
                    },
                  },
                }}
                onClick={card.onClick}
              >
                <CardContent sx={{ p: 3, textAlign: 'center', height: '100%' }}>
                  <Stack spacing={2} alignItems="center" sx={{ height: '100%' }}>
                    <Avatar
                      className="main-icon"
                      sx={{
                        width: 64,
                        height: 64,
                        background: card.gradient,
                        mb: 1,
                        transition: 'transform 0.3s ease',
                      }}
                    >
                      <IconComponent sx={{ fontSize: 32, color: 'white' }} />
                    </Avatar>
                    
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography 
                        variant="h6" 
                        sx={{ 
                          fontWeight: 700,
                          color: '#2d3748',
                          mb: 1,
                        }}
                      >
                        {card.title}
                      </Typography>
                      
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          color: '#4a5568',
                          lineHeight: 1.6,
                          mb: 2,
                        }}
                      >
                        {card.description}
                      </Typography>
                    </Box>
                    
                    <IconButton
                      className="action-button"
                      sx={{
                        background: 'rgba(102, 126, 234, 0.1)',
                        color: '#667eea',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          background: card.gradient,
                          color: 'white',
                        },
                      }}
                    >
                      <ActionIconComponent />
                    </IconButton>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
};

export default HomeButtons;
