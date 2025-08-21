/* eslint-disable max-statements */
/* eslint-disable react/jsx-max-depth */
/* eslint-disable max-lines */
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { useAppTheme } from '../../../theme/useAppTheme';
import { Alert, Box, Button, Fab, Tooltip, Typography, Zoom } from '@mui/material';
import {
  ArrowBack,
  Attachment,
  AutoAwesome,
  Comment,
  Timeline,
  Visibility,
} from '@mui/icons-material';
import { useFetchJiraQuery } from '../../../store/api/jiraApi';
import { showNotification } from '../../../store/slices/uiSlice';
import { useDispatch } from 'react-redux';

// Import new modular components
import JiraNavigationBar from './components/JiraNavigationBar';
import JiraIssueHeader from './components/JiraIssueHeader';
import JiraSidebar from './components/JiraSidebar';
import JiraDescriptionSimple from './components/JiraDescriptionSimple';
import JiraAttachments from './components/JiraAttachments';
import JiraComments from './components/JiraComments';
import JiraTimelineSimple from './components/JiraTimelineSimple';
import AiAssistantPanel from './components/AiAssistantPanel';
import FuturisticLoader from './components/FuturisticLoader';

const JiraViewerPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isDark } = useAppTheme();

  const [activeTab, setActiveTab] = useState('attachments');
  const [isStarred, setIsStarred] = useState(false);
  const [showAiPanel, setShowAiPanel] = useState(false);

  // Fetch Jira issue data
  const {
    data: jiraData,
    isLoading,
    error,
    refetch,
  } = useFetchJiraQuery(id, {
    skip: !id,
    pollingInterval: 30000,
  });

  useEffect(() => {
    if (!id) {
      dispatch(
        showNotification({
          message: 'Invalid Jira ID provided',
          severity: 'error',
        })
      );
      navigate('/');
    }
  }, [id, navigate, dispatch]);

  const handleBack = () => {
    navigate('/');
  };

  const handleRefresh = () => {
    refetch();
    dispatch(
      showNotification({
        message: 'Jira issue refreshed',
        severity: 'success',
      })
    );
  };

  const handleShare = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      dispatch(
        showNotification({
          message: 'URL copied to clipboard',
          severity: 'success',
        })
      );
    } catch {
      dispatch(
        showNotification({
          message: 'Failed to copy URL',
          severity: 'error',
        })
      );
    }
  };

  const toggleStar = () => {
    setIsStarred(!isStarred);
    dispatch(
      showNotification({
        message: isStarred ? 'Removed from favorites' : 'Added to favorites',
        severity: 'success',
      })
    );
  };

  if (isLoading) {
    return <FuturisticLoader />;
  }

  if (error) {
    return (
      <Box
        sx={{
          height: '100vh',
          width: '100vw',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: isDark
            ? 'linear-gradient(135deg, #0f0f23 0%, #1a1a3e 50%, #2d1b69 100%)'
            : 'linear-gradient(135deg, #e6e8f0 0%, #d1d6e8 50%, #bac3d9 100%)',
          position: 'fixed',
          top: 0,
          left: 0,
          zIndex: 9999,
        }}
      >
        <Alert
          action={
            <Button
              startIcon={<ArrowBack />}
              sx={{
                background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
              }}
              variant='contained'
              onClick={handleBack}
            >
              Go Back
            </Button>
          }
          severity='error'
          sx={{
            maxWidth: 600,
            backgroundColor: isDark ? 'rgba(211, 47, 47, 0.1)' : 'rgba(211, 47, 47, 0.05)',
            color: isDark ? 'white' : '#2d3748',
          }}
        >
          <Typography gutterBottom variant='h6'>
            Failed to load Jira issue
          </Typography>
          <Typography variant='body2'>
            {error.status === 404
              ? `Issue "${id}" not found. It may have been moved or deleted.`
              : error.data?.message || 'Please check your connection and try again.'}
          </Typography>
        </Alert>
      </Box>
    );
  }

  if (!jiraData) {
    return (
      <Box
        sx={{
          height: '100vh',
          width: '100vw',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: isDark
            ? 'linear-gradient(135deg, #0f0f23 0%, #1a1a3e 50%, #2d1b69 100%)'
            : 'linear-gradient(135deg, #e6e8f0 0%, #d1d6e8 50%, #bac3d9 100%)',
          position: 'fixed',
          top: 0,
          left: 0,
        }}
      >
        <Alert severity='info' sx={{ color: isDark ? 'white' : '#2d3748' }}>
          No data available for issue: {id}
        </Alert>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        height: '100vh',
        width: '100vw',
        background: isDark
          ? `
            linear-gradient(135deg, #0f0f23 0%, #1a1a3e 50%, #2d1b69 100%),
            radial-gradient(circle at 20% 80%, rgba(120, 75, 200, 0.3) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(255, 75, 150, 0.2) 0%, transparent 50%)
          `
          : `
            linear-gradient(135deg, #e6e8f0 0%, #d1d6e8 50%, #bac3d9 100%),
            radial-gradient(circle at 20% 80%, rgba(102, 126, 234, 0.15) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(118, 75, 162, 0.12) 0%, transparent 50%)
          `,
        position: 'fixed',
        top: 0,
        left: 0,
        overflow: 'auto',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Navigation Bar */}
      <JiraNavigationBar
        isStarred={isStarred}
        jiraData={jiraData}
        onBack={handleBack}
        onRefresh={handleRefresh}
        onShare={handleShare}
        onToggleStar={toggleStar}
      />

      {/* Main Content Area */}
      <Box sx={{ flex: 1, display: 'flex', position: 'relative' }}>
        {/* Main Content Panel */}
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            padding: '24px 24px 100px 32px', // Added bottom padding to prevent FAB overlap
          }}
        >
          {/* Issue Header */}
          <JiraIssueHeader jiraData={jiraData} />

          {/* Content Sections */}
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            {/* Description Section */}
            <Box sx={{ mb: 4 }}>
              <Typography
                sx={{
                  color: isDark ? 'white' : '#2d3748',
                  fontWeight: 600,
                  mb: 2,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                }}
                variant='h6'
              >
                <Visibility sx={{ fontSize: 20 }} />
                Description
              </Typography>
              <JiraDescriptionSimple jiraData={jiraData} />
            </Box>

            {/* Comments Section */}
            <Box sx={{ mb: 4 }}>
              <Typography
                sx={{
                  color: isDark ? 'white' : '#2d3748',
                  fontWeight: 600,
                  mb: 2,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                }}
                variant='h6'
              >
                <Comment sx={{ fontSize: 20 }} />
                Comments
              </Typography>
              <JiraComments jiraData={jiraData} />
            </Box>

            {/* Additional Content Tabs */}
            <Box
              sx={{
                borderBottom: isDark
                  ? '1px solid rgba(255, 255, 255, 0.1)'
                  : '1px solid rgba(0, 0, 0, 0.1)',
                mb: 3,
              }}
            >
              <Box sx={{ display: 'flex', gap: 0 }}>
                {[
                  {
                    id: 'attachments',
                    label: 'Attachments',
                    icon: <Attachment />,
                  },
                  { id: 'timeline', label: 'Timeline', icon: <Timeline /> },
                ].map(tab => (
                  <Button
                    key={tab.id}
                    startIcon={tab.icon}
                    sx={{
                      color:
                        activeTab === tab.id
                          ? '#667eea'
                          : isDark
                            ? 'rgba(255, 255, 255, 0.7)'
                            : 'rgba(45, 55, 72, 0.7)',
                      borderBottom:
                        activeTab === tab.id ? '2px solid #667eea' : '2px solid transparent',
                      borderRadius: 0,
                      px: 3,
                      py: 2,
                      minWidth: 'auto',
                      textTransform: 'none',
                      fontWeight: activeTab === tab.id ? 600 : 400,
                      background: 'transparent',
                      '&:hover': {
                        background: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
                        color: '#667eea',
                      },
                      transition: 'all 0.2s ease',
                    }}
                    onClick={() => setActiveTab(tab.id)}
                  >
                    {tab.label}
                  </Button>
                ))}
              </Box>
            </Box>

            {/* Tab Content */}
            <Box sx={{ flex: 1, mt: 2 }}>
              <AnimatePresence mode='wait'>
                <Box
                  key={activeTab}
                  sx={{
                    opacity: 1,
                    transition: 'opacity 0.2s ease',
                  }}
                >
                  {activeTab === 'attachments' && <JiraAttachments jiraData={jiraData} />}
                  {activeTab === 'timeline' && <JiraTimelineSimple jiraData={jiraData} />}
                </Box>
              </AnimatePresence>
            </Box>
          </Box>
        </Box>

        {/* Right Sidebar */}
        <JiraSidebar jiraData={jiraData} />

        {/* AI Assistant Panel (when open) */}
        <AnimatePresence>
          {showAiPanel ? (
            <Box
              sx={{
                width: '400px',
                height: '100%',
                borderLeft: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              <AiAssistantPanel jiraData={jiraData} onClose={() => setShowAiPanel(false)} />
            </Box>
          ) : null}
        </AnimatePresence>
      </Box>

      {/* Floating AI Assistant Button */}
      <Box
        sx={{
          position: 'fixed',
          bottom: showAiPanel ? 32 : 24,
          right: showAiPanel ? 432 : 24, // Move left when AI panel is open
          zIndex: 1000,
          transition: 'all 0.3s ease',
          '@media (max-width: 1200px)': {
            right: showAiPanel ? 24 : 16, // Adjust for smaller screens
            bottom: showAiPanel ? 24 : 16,
          },
        }}
      >
        <Zoom in style={{ transitionDelay: '200ms' }}>
          <Tooltip placement='left' title='AI Assistant'>
            <Fab
              color='primary'
              sx={{
                background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
                boxShadow: '0 8px 32px rgba(102, 126, 234, 0.4)',
                '&:hover': {
                  background: 'linear-gradient(45deg, #764ba2 30%, #667eea 90%)',
                  transform: 'scale(1.1)',
                  boxShadow: '0 12px 40px rgba(118, 75, 162, 0.5)',
                },
                transition: 'all 0.3s ease',
              }}
              onClick={() => setShowAiPanel(!showAiPanel)}
            >
              <AutoAwesome />
            </Fab>
          </Tooltip>
        </Zoom>
      </Box>
    </Box>
  );
};

export default JiraViewerPage;
