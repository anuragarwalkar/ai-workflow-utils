import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppTheme } from '../../../theme/useAppTheme';

const MotionDiv = motion.div;
import {
  Box,
  Container,
  Grid,
  Paper,
  Typography,
  Chip,
  IconButton,
  Fab,
  Divider,
  Alert,
  Skeleton,
  Tooltip,
  Backdrop,
  CircularProgress,
} from '@mui/material';
import {
  ArrowBack,
  AutoAwesome,
  Comment,
  Attachment,
  Timeline,
  Refresh,
  Share,
  Star,
  StarBorder,
  MoreVert,
  Fullscreen,
  FullscreenExit,
} from '@mui/icons-material';
import { useFetchJiraQuery } from '../../../store/api/jiraApi';
import { showNotification } from '../../../store/slices/uiSlice';
import { useDispatch } from 'react-redux';
import JiraHeader from './components/JiraHeader';
import JiraDescription from './components/JiraDescription';
import JiraAttachments from './components/JiraAttachments';
import JiraComments from './components/JiraComments';
import JiraTimeline from './components/JiraTimeline';
import AiAssistantPanel from './components/AiAssistantPanel';
import FuturisticLoader from './components/FuturisticLoader';

const JiraViewerPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isDark } = useAppTheme();

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeTab, setActiveTab] = useState('description');
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
    pollingInterval: 30000, // Refresh every 30 seconds
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
    navigate(-1);
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

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.3,
        ease: 'easeOut',
        staggerChildren: 0.05,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  if (isLoading) {
    return <FuturisticLoader />;
  }

  if (error) {
    return (
      <Container maxWidth='md' sx={{ mt: 4 }}>
        <Alert
          severity='error'
          action={
            <IconButton onClick={handleBack} size='small'>
              <ArrowBack />
            </IconButton>
          }
        >
          <Typography variant='h6'>Failed to load Jira issue</Typography>
          <Typography variant='body2'>
            {error.status === 404
              ? `Issue "${id}" not found. It may have been moved or deleted.`
              : error.data?.message ||
                'Please check your connection and try again.'}
          </Typography>
        </Alert>
      </Container>
    );
  }

  if (!jiraData) {
    return (
      <Container maxWidth='md' sx={{ mt: 4 }}>
        <Alert severity='info'>No data available for issue: {id}</Alert>
      </Container>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: 'background.paper',
        position: 'relative',
        overflow: isFullscreen ? 'hidden' : 'auto',
      }}
    >
      {/* Futuristic Background Effects */}
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `
            linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(168, 85, 247, 0.05) 100%),
            radial-gradient(circle at 20% 80%, rgba(59, 130, 246, 0.15) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(147, 51, 234, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 40% 40%, rgba(34, 197, 94, 0.08) 0%, transparent 50%)
          `,
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      <Container
        maxWidth={isFullscreen ? false : 'xl'}
        sx={{
          position: 'relative',
          zIndex: 1,
          py: isFullscreen ? 0 : 3,
          px: isFullscreen ? 0 : 3,
        }}
      >
        <MotionDiv
          variants={containerVariants}
          initial='hidden'
          animate='visible'
        >
          {/* Top Navigation Bar */}
          <motion.div variants={itemVariants}>
            <Paper
              elevation={0}
              sx={{
                p: 2,
                mb: 3,
                background: isDark
                  ? 'rgba(45, 55, 72, 0.95)'
                  : 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(20px)',
                border: isDark
                  ? '1px solid rgba(255, 255, 255, 0.1)'
                  : '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: 3,
                boxShadow: isDark
                  ? '0 8px 32px rgba(0, 0, 0, 0.3)'
                  : '0 8px 32px rgba(0, 0, 0, 0.1)',
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
                  <Tooltip title='Go Back'>
                    <IconButton
                      onClick={handleBack}
                      sx={{ color: 'primary.main' }}
                    >
                      <ArrowBack />
                    </IconButton>
                  </Tooltip>

                  <Typography
                    variant='h5'
                    sx={{ fontWeight: 600, color: 'text.primary' }}
                  >
                    {jiraData.key}
                  </Typography>

                  <Chip
                    label={jiraData.fields?.issuetype?.name || 'Unknown'}
                    color='primary'
                    variant='outlined'
                    size='small'
                  />
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Tooltip title='Refresh'>
                    <IconButton onClick={handleRefresh} color='primary'>
                      <Refresh />
                    </IconButton>
                  </Tooltip>

                  <Tooltip
                    title={
                      isStarred ? 'Remove from favorites' : 'Add to favorites'
                    }
                  >
                    <IconButton onClick={toggleStar} color='primary'>
                      {isStarred ? <Star /> : <StarBorder />}
                    </IconButton>
                  </Tooltip>

                  <Tooltip title='Share'>
                    <IconButton onClick={handleShare} color='primary'>
                      <Share />
                    </IconButton>
                  </Tooltip>

                  <Tooltip
                    title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
                  >
                    <IconButton onClick={toggleFullscreen} color='primary'>
                      {isFullscreen ? <FullscreenExit /> : <Fullscreen />}
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>
            </Paper>
          </motion.div>

          {/* Main Content Grid */}
          <Grid container spacing={3}>
            {/* Left Column - Main Content */}
            <Grid item xs={12} lg={showAiPanel ? 8 : 9}>
              <motion.div variants={itemVariants}>
                <JiraHeader jiraData={jiraData} />
              </motion.div>

              <motion.div variants={itemVariants}>
                <Box sx={{ mt: 3 }}>
                  <JiraDescription
                    jiraData={jiraData}
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                  />
                </Box>
              </motion.div>

              <motion.div variants={itemVariants}>
                <Box sx={{ mt: 3 }}>
                  <JiraAttachments jiraData={jiraData} />
                </Box>
              </motion.div>

              <motion.div variants={itemVariants}>
                <Box sx={{ mt: 3 }}>
                  <JiraComments jiraData={jiraData} />
                </Box>
              </motion.div>
            </Grid>

            {/* Right Column - Timeline & Info */}
            <Grid item xs={12} lg={showAiPanel ? 4 : 3}>
              <motion.div variants={itemVariants}>
                <JiraTimeline jiraData={jiraData} />
              </motion.div>
            </Grid>
          </Grid>
        </MotionDiv>
      </Container>

      {/* AI Assistant FAB */}
      <Tooltip title='AI Assistant' placement='left'>
        <Fab
          color='primary'
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
            boxShadow: '0 8px 32px rgba(102, 126, 234, 0.4)',
            '&:hover': {
              background: 'linear-gradient(45deg, #764ba2 30%, #667eea 90%)',
              transform: 'scale(1.1)',
              boxShadow: '0 12px 40px rgba(118, 75, 162, 0.5)',
            },
            transition: 'all 0.2s ease',
            zIndex: 1000,
          }}
          onClick={() => setShowAiPanel(!showAiPanel)}
        >
          <AutoAwesome />
        </Fab>
      </Tooltip>

      {/* AI Assistant Panel */}
      <AnimatePresence>
        {showAiPanel && (
          <AiAssistantPanel
            jiraData={jiraData}
            onClose={() => setShowAiPanel(false)}
          />
        )}
      </AnimatePresence>
    </Box>
  );
};

export default JiraViewerPage;
