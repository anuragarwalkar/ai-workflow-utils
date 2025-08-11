import {
  Avatar,
  Box,
  Card,
  CardContent,
  Chip,
  Grid,
  IconButton,
  Stack,
  Typography,
} from '@mui/material';
import {
  Add as AddIcon,
  AutoFixHigh as AutoFixHighIcon,
  BugReport as BugReportIcon,
  Build as BuildIcon,
  Chat as ChatIcon,
  Code as CodeIcon,
  Create as CreateIcon,
  Email as EmailIcon,
  MergeType as MergeIcon,
  Reviews as ReviewsIcon,
  RocketLaunch as RocketLaunchIcon,
  Send as SendIcon,
  Settings as SettingsIcon,
  Tune as TuneIcon,
  Visibility as VisibilityIcon,
  AccountTree as WorkflowIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useUnreleasedFeatures } from '../../hooks/useFeatureFlag';
import { useAppTheme } from '../../theme/useAppTheme';

const ActionCards = () => {
  const navigate = useNavigate();
  const { isDark } = useAppTheme();

  // Get feature flags using custom hooks
  const [showUnreleasedFeatures] = useUnreleasedFeatures();

  // Existing action handlers
  const handleCreateJira = () => {
    navigate('/ai-create-jira');
  };

  const handleFuturisticJiraViewer = () => {
    navigate('/ai-view-jira/');
  };

  const handleSendEmail = () => {
    navigate('/send-email');
  };

  const handleSendEmailLegacy = () => {
    navigate('/send-email-legacy');
  };

  const handleReleaseBuild = () => {
    navigate('/release-build');
  };

  const handleGitStash = () => {
    navigate('/ai-pr-code-review');
  };

  const handleCreatePR = () => {
    navigate('/ai-generate-pr-template');
  };

  const handleSettings = () => {
    navigate('/settings');
  };

  // New unreleased feature handlers
  const handleAiChat = () => {
    console.log('AI Chat feature clicked');
    navigate('/ai-dev-assistant');
  };

  const handleWorkflowAutomation = () => {
    console.log('Workflow Automation feature clicked');
    // TODO: Implement Workflow Automation functionality
  };

  // Define all action cards
  const allActionCards = [
    // Released features
    {
      id: 'create-jira',
      title: 'AI Create Jira',
      description: 'AI-powered Jira ticket creation with intelligent suggestions',
      icon: BugReportIcon,
      actionIcon: AddIcon,
      onClick: handleCreateJira,
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      shadowColor: 'rgba(102, 126, 234, 0.3)',
      isReleased: true,
      isBeta: true,
    },
    {
      id: 'futuristic-jira',
      title: 'AI Jira Viewer',
      description: 'Next-gen AI-powered Jira viewer with advanced features',
      icon: VisibilityIcon,
      actionIcon: AutoFixHighIcon,
      onClick: handleFuturisticJiraViewer,
      gradient: 'linear-gradient(135deg, #8B5CF6 0%, #06B6D4 100%)',
      shadowColor: 'rgba(139, 92, 246, 0.4)',
      isReleased: true,
      isAlpha: true,
    },
    {
      id: 'ai-pr-code-review',
      title: 'AI Code Review',
      description: 'AI-powered pull request analysis with code insights',
      icon: CodeIcon,
      actionIcon: ReviewsIcon,
      onClick: handleGitStash,
      gradient: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
      shadowColor: 'rgba(17, 153, 142, 0.3)',
      isReleased: true,
      isAlpha: true,
    },
    {
      id: 'create-pr',
      title: 'AI Draft Pull Request',
      description: 'AI-generated pull request creation with content suggestions',
      icon: MergeIcon,
      actionIcon: CreateIcon,
      onClick: handleCreatePR,
      gradient: 'linear-gradient(135deg, #ff7b7b 0%, #667eea 100%)',
      shadowColor: 'rgba(255, 123, 123, 0.3)',
      isReleased: true,
      isAlpha: true,
    },
    {
      id: 'ai-chat',
      title: 'AI Chat Assistant',
      description: 'Intelligent conversational AI for development task assistance',
      icon: ChatIcon,
      actionIcon: AutoFixHighIcon,
      onClick: handleAiChat,
      gradient: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
      shadowColor: 'rgba(255, 154, 158, 0.3)',
      isReleased: true,
      isAlpha: true,
    },
    {
      id: 'send-email',
      title: 'AI Send Email',
      description: 'AI Compose and send email notifications',
      icon: EmailIcon,
      actionIcon: SendIcon,
      onClick: handleSendEmail,
      gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      shadowColor: 'rgba(79, 172, 254, 0.3)',
      isReleased: true,
      isAlpha: true,
    },
    {
      id: 'send-email-legacy',
      title: 'Send Email',
      description: 'Compose and send email notifications',
      icon: EmailIcon,
      actionIcon: SendIcon,
      onClick: handleSendEmailLegacy,
      gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      shadowColor: 'rgba(79, 172, 254, 0.3)',
      isReleased: true,
      isHidden: () => localStorage.getItem('enableHiddenFeatures') !== 'true',
    },
    {
      id: 'release-build',
      title: 'Release Mobile App',
      description: 'Build and release new mobile app version',
      icon: BuildIcon,
      actionIcon: RocketLaunchIcon,
      onClick: handleReleaseBuild,
      gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
      shadowColor: 'rgba(250, 112, 154, 0.3)',
      isReleased: true,
      isHidden: () => localStorage.getItem('enableHiddenFeatures') !== 'true',
    },
    {
      id: 'workflow-automation',
      title: 'Workflow Automation',
      description: 'AI-powered automation of repetitive development workflows',
      icon: WorkflowIcon,
      actionIcon: AutoFixHighIcon,
      onClick: handleWorkflowAutomation,
      gradient: 'linear-gradient(135deg, #d299c2 0%, #fef9d7 100%)',
      shadowColor: 'rgba(210, 153, 194, 0.3)',
      isReleased: false,
    },
    {
      id: 'settings',
      title: 'Settings',
      description: 'AI configuration and app preferences management center',
      icon: SettingsIcon,
      actionIcon: TuneIcon,
      onClick: handleSettings,
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      shadowColor: 'rgba(102, 126, 234, 0.3)',
      isReleased: true,
      isBeta: true,
    },
  ];

  // Filter cards based on feature flags and hidden status
  const visibleCards = allActionCards.filter(
    card => !(card.isHidden && card.isHidden()) && (card.isReleased || showUnreleasedFeatures)
  );

  // Helper function to render badges with DRY principle
  const renderBadge = card => {
    const badgeConfigs = {
      comingSoon: {
        condition: !card.isReleased,
        label: 'COMING SOON',
        background: 'linear-gradient(45deg, #9c27b0, #e91e63)',
      },
      beta: {
        condition: card.isReleased && card.isBeta,
        label: 'BETA',
        background: 'linear-gradient(45deg, #667eea, #764ba2)',
      },
      alpha: {
        condition: card.isReleased && card.isAlpha,
        label: 'ALPHA',
        background: 'linear-gradient(45deg, #ff9800, #f57c00)',
      },
    };

    for (const config of Object.values(badgeConfigs)) {
      if (config.condition) {
        return (
          <Chip
            label={config.label}
            size='small'
            sx={{
              position: 'absolute',
              top: 12,
              right: 12,
              background: config.background,
              color: 'white',
              fontWeight: 'bold',
              fontSize: '0.6rem',
              zIndex: 1,
            }}
          />
        );
      }
    }
    return null;
  };

  return (
    <Box>
      {/* Header */}
      <Box
        sx={{
          mb: 3,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          px: 2,
        }}
      >
        <Typography
          component='h2'
          sx={{
            color: isDark ? '#ffffff' : '#2d3748',
            fontWeight: 700,
          }}
          variant='h5'
        >
          Available Actions
        </Typography>
      </Box>

      {/* Action Cards Grid */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          width: '100%',
        }}
      >
        <Grid container spacing={2} sx={{ maxWidth: 1000, mx: 'auto', justifyContent: 'center' }}>
          {visibleCards.map(card => {
            const IconComponent = card.icon;
            const ActionIconComponent = card.actionIcon;

            return (
              <Grid item key={card.id} md={4} sm={6} xs={12}>
                <Card
                  sx={{
                    width: 300,
                    height: 280,
                    minWidth: 300,
                    maxWidth: 300,
                    minHeight: 280,
                    maxHeight: 280,
                    cursor: 'pointer',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    background: isDark ? 'rgba(45, 55, 72, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(20px)',
                    border: isDark
                      ? '1px solid rgba(255, 255, 255, 0.1)'
                      : '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '20px',
                    boxShadow: `0 8px 32px ${card.shadowColor}`,
                    position: 'relative',
                    display: 'flex',
                    flexDirection: 'column',
                    '&:hover': {
                      transform: 'translateY(-8px) scale(1.02)',
                      boxShadow: `0 20px 60px ${card.shadowColor}`,
                      background: isDark ? 'rgba(45, 55, 72, 0.98)' : 'rgba(255, 255, 255, 0.98)',
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
                  {/* Render badge using DRY helper function */}
                  {renderBadge(card)}

                  <CardContent
                    sx={{
                      p: 3,
                      textAlign: 'center',
                      height: 232,
                      display: 'flex',
                      flexDirection: 'column',
                    }}
                  >
                    <Stack
                      alignItems='center'
                      spacing={2}
                      sx={{ height: '100%', justifyContent: 'space-between' }}
                    >
                      <Avatar
                        className='main-icon'
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
                          sx={{
                            fontWeight: 700,
                            color: isDark ? '#ffffff' : '#2d3748',
                            mb: 1,
                          }}
                          variant='h6'
                        >
                          {card.title}
                        </Typography>

                        <Typography
                          sx={{
                            color: isDark ? 'rgba(255, 255, 255, 0.8)' : '#4a5568',
                            lineHeight: 1.6,
                            mb: 2,
                          }}
                          variant='body2'
                        >
                          {card.description}
                        </Typography>
                      </Box>

                      <IconButton
                        className='action-button'
                        sx={{
                          background: card.isReleased
                            ? 'rgba(102, 126, 234, 0.1)'
                            : 'rgba(255, 107, 107, 0.1)',
                          color: card.isReleased ? '#667eea' : '#ff6b6b',
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
    </Box>
  );
};

export default ActionCards;
