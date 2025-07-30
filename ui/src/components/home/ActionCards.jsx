import { 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  Grid, 
  IconButton,
  Avatar,
  Stack,
  Chip
} from '@mui/material';
import { 
  BugReport as BugReportIcon,
  Visibility as VisibilityIcon,
  Email as EmailIcon,
  Build as BuildIcon,
  Add as AddIcon,
  Search as SearchIcon,
  Send as SendIcon,
  RocketLaunch as RocketLaunchIcon,
  Code as CodeIcon,
  Reviews as ReviewsIcon,
  Chat as ChatIcon,
  AutoFixHigh as AutoFixHighIcon,
  Analytics as AnalyticsIcon,
  AccountTree as WorkflowIcon,
  Security as SecurityIcon,
  Settings as SettingsIcon,
  Tune as TuneIcon,
  MergeType as MergeIcon,
  Create as CreateIcon
} from '@mui/icons-material';
import { useDispatch } from 'react-redux';
import { openViewJiraModal } from '../../store/slices/uiSlice';
import { useNavigate } from 'react-router-dom';
import { useUnreleasedFeatures } from '../../hooks/useFeatureFlag';

const ActionCards = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Get feature flags using custom hooks
  const [showUnreleasedFeatures] = useUnreleasedFeatures();

  // Existing action handlers
  const handleCreateJira = () => {
    navigate('/ai-create-jira');
  };

  const handleViewJira = () => {
    dispatch(openViewJiraModal());
  };

  const handleSendEmail = () => {
    navigate('/send-email');
  };

  const handleReleaseBuild = () => {
    navigate('/release-build');
  };

  const handleGitStash = () => {
    navigate('/ai-pr-review');
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
    // TODO: Implement AI Chat functionality
  };


  const handleCodeAnalysis = () => {
    console.log('Code Analysis feature clicked');
    // TODO: Implement Code Analysis functionality
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
      description: 'AI-powered Jira ticket creation with smart suggestions',
      icon: BugReportIcon,
      actionIcon: AddIcon,
      onClick: handleCreateJira,
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      shadowColor: 'rgba(102, 126, 234, 0.3)',
      isReleased: true,
      isBeta: true,
    },
    {
      id: 'view-jira',
      title: 'View Jira',
      description: 'Browse and manage existing Jira tickets',
      icon: VisibilityIcon,
      actionIcon: SearchIcon,
      onClick: handleViewJira,
      gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      shadowColor: 'rgba(240, 147, 251, 0.3)',
      isReleased: true,
      isBeta: true,
      isHidden: () => localStorage.getItem('enableHiddenFeatures') !== 'true',
    },
    {
      id: 'send-email',
      title: 'Send Email',
      description: 'Compose and send email notifications',
      icon: EmailIcon,
      actionIcon: SendIcon,
      onClick: handleSendEmail,
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
      id: 'git-stash',
      title: 'AI Code Review',
      description: 'Review pull requests with AI assistance',
      icon: CodeIcon,
      actionIcon: ReviewsIcon,
      onClick: handleGitStash,
      gradient: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
      shadowColor: 'rgba(17, 153, 142, 0.3)',
      isReleased: true,
      isBeta: true,
    },
    {
      id: 'create-pr',
      title: 'AI Draft Pull Request',
      description: 'Create and preview pull requests with AI assistance',
      icon: MergeIcon,
      actionIcon: CreateIcon,
      onClick: handleCreatePR,
      gradient: 'linear-gradient(135deg, #ff7b7b 0%, #667eea 100%)',
      shadowColor: 'rgba(255, 123, 123, 0.3)',
      isReleased: true,
      isBeta: true,
    },
    // Unreleased features
    {
      id: 'ai-chat',
      title: 'AI Chat Assistant',
      description: 'Assistance for development tasks',
      icon: ChatIcon,
      actionIcon: AutoFixHighIcon,
      onClick: handleAiChat,
      gradient: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
      shadowColor: 'rgba(255, 154, 158, 0.3)',
      isReleased: false,
    },
    {
      id: 'code-analysis',
      title: 'Code Analysis',
      description: 'Deep code analysis and optimization suggestions',
      icon: AnalyticsIcon,
      actionIcon: SecurityIcon,
      onClick: handleCodeAnalysis,
      gradient: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
      shadowColor: 'rgba(255, 236, 210, 0.3)',
      isReleased: false,
    },
    {
      id: 'workflow-automation',
      title: 'Workflow Automation',
      description: 'Automate repetitive development workflows',
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
      description: 'Configure templates, API settings, and app preferences',
      icon: SettingsIcon,
      actionIcon: TuneIcon,
      onClick: handleSettings,
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      shadowColor: 'rgba(102, 126, 234, 0.3)',
      isReleased: true,
    },
  ];

  // Filter cards based on feature flags and hidden status
  const visibleCards = allActionCards.filter(card => {
    // Hide cards that have isHidden function and it returns true
    if (card.isHidden && card.isHidden()) {
      return false;
    }
    
    // Show unreleased features only if the flag is enabled
    if (!card.isReleased && !showUnreleasedFeatures) {
      return false;
    }
    
    return true;
  });


  return (
    <Box>
      {/* Header */}
      <Box sx={{ 
        mb: 3, 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        px: 2
      }}>
        <Typography variant="h5" component="h2" sx={{ color: '#2d3748', fontWeight: 700 }}>
          Available Actions
        </Typography>
      </Box>

      {/* Action Cards Grid */}
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%' }}>
        <Grid container spacing={2} sx={{ maxWidth: 1000, mx: 'auto', justifyContent: 'center' }}>
          {visibleCards.map((card) => {
            const IconComponent = card.icon;
            const ActionIconComponent = card.actionIcon;
            
            return (
              <Grid item xs={12} sm={6} md={4} key={card.id}>
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
                    background: 'rgba(255, 255, 255, 0.9)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '20px',
                    boxShadow: `0 8px 32px ${card.shadowColor}`,
                    position: 'relative',
                    display: 'flex',
                    flexDirection: 'column',
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
                  {/* Coming Soon Badge for unreleased features */}
                  {!card.isReleased && (
                    <Chip
                      label="COMING SOON"
                      size="small"
                      sx={{
                        position: 'absolute',
                        top: 12,
                        right: 12,
                        background: 'linear-gradient(45deg, #ff6b6b, #feca57)',
                        color: 'white',
                        fontWeight: 'bold',
                        fontSize: '0.6rem',
                        zIndex: 1,
                      }}
                    />
                  )}
                  
                  {/* Beta Badge for beta features */}
                  {card.isReleased && card.isBeta && (
                    <Chip
                      label="BETA"
                      size="small"
                      sx={{
                        position: 'absolute',
                        top: 12,
                        right: 12,
                        background: 'linear-gradient(45deg, #667eea, #764ba2)',
                        color: 'white',
                        fontWeight: 'bold',
                        fontSize: '0.6rem',
                        zIndex: 1,
                      }}
                    />
                  )}
                  
                  <CardContent sx={{ p: 3, textAlign: 'center', height: 232, display: 'flex', flexDirection: 'column' }}>
                    <Stack spacing={2} alignItems="center" sx={{ height: '100%', justifyContent: 'space-between' }}>
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
