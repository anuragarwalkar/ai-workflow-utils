import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppTheme } from '../../../theme/useAppTheme';
import {
  Box,
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  IconButton,
  InputAdornment,
  Alert,
  Chip,
  Divider,
} from '@mui/material';
import {
  ArrowBack,
  Search,
  AutoAwesome,
  Visibility,
  TrendingUp,
  BugReport,
  Task,
  Assignment,
} from '@mui/icons-material';

const JiraIdPrompt = () => {
  const navigate = useNavigate();
  const { isDark } = useAppTheme();
  const [jiraId, setJiraId] = useState('');
  const [error, setError] = useState('');

  // Sample recent/popular Jira IDs for quick access
  const recentJiraIds = [
    { id: 'PROJ-123', type: 'Bug', title: 'Login authentication issue' },
    { id: 'PROJ-456', type: 'Task', title: 'Update user dashboard' },
    { id: 'PROJ-789', type: 'Story', title: 'Implement new feature' },
  ];

  const handleSubmit = e => {
    e.preventDefault();
    const trimmedId = jiraId.trim();

    if (!trimmedId) {
      setError('Please enter a Jira ID');
      return;
    }

    // Basic validation for Jira ID format (PROJECT-123)
    const jiraPattern = /^[A-Z]+-\d+$/i;
    if (!jiraPattern.test(trimmedId)) {
      setError('Please enter a valid Jira ID format (e.g., PROJ-123)');
      return;
    }

    setError('');
    navigate(`/ai-view-jira/${trimmedId.toUpperCase()}`);
  };

  const handleBack = () => {
    navigate(-1);
  };

  const handleQuickSelect = id => {
    setJiraId(id);
    setError('');
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: 'background.paper',
        position: 'relative',
        overflow: 'auto',
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
        maxWidth='md'
        sx={{
          position: 'relative',
          zIndex: 1,
          py: 4,
          px: 3,
        }}
      >
        <div>
          {/* Header */}
          <Paper
            elevation={0}
            sx={{
              p: 3,
              mb: 4,
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
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <IconButton onClick={handleBack} sx={{ color: 'primary.main' }}>
                <ArrowBack />
              </IconButton>
              <AutoAwesome sx={{ color: 'primary.main', fontSize: 28 }} />
              <Typography
                variant='h4'
                sx={{ fontWeight: 700, color: 'text.primary' }}
              >
                Futuristic Jira Viewer
              </Typography>
            </Box>

            <Typography variant='body1' color='text.secondary' sx={{ ml: 7 }}>
              Enter a Jira ID to view it with AI-powered insights and futuristic
              interface
            </Typography>
          </Paper>

          {/* Main Input Section */}
          <Paper
            elevation={0}
            sx={{
              p: 4,
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
            <Typography
              variant='h6'
              sx={{ mb: 3, fontWeight: 600, textAlign: 'center' }}
            >
              Enter Jira Issue ID
            </Typography>

            <Box component='form' onSubmit={handleSubmit} sx={{ mb: 3 }}>
              <Box
                sx={{
                  display: 'flex',
                  gap: 2,
                  alignItems: 'stretch', // Changed from 'center' to 'stretch'
                  width: '100%',
                }}
              >
                <TextField
                  fullWidth
                  size='large'
                  placeholder='e.g., PROJ-123, TEAM-456, BUG-789'
                  value={jiraId}
                  onChange={e => {
                    setJiraId(e.target.value);
                    setError('');
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position='start'>
                        <Search color='primary' />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    flex: 1, // Take up remaining space
                    '& .MuiOutlinedInput-root': {
                      background: isDark
                        ? 'rgba(45, 55, 72, 0.9)'
                        : 'rgba(255, 255, 255, 0.9)',
                      borderRadius: 2,
                      fontSize: '1.1rem',
                      height: '56px', // Explicit height
                      color: isDark ? '#f7fafc' : 'inherit',
                      '& fieldset': {
                        borderColor: isDark
                          ? 'rgba(255, 255, 255, 0.3)'
                          : 'rgba(102, 126, 234, 0.3)',
                        borderWidth: 2,
                      },
                      '&:hover fieldset': {
                        borderColor: isDark
                          ? 'rgba(255, 255, 255, 0.6)'
                          : 'rgba(102, 126, 234, 0.6)',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: 'primary.main',
                      },
                    },
                    '& .MuiOutlinedInput-input': {
                      color: isDark ? '#f7fafc' : 'inherit',
                      '&::placeholder': {
                        color: isDark
                          ? 'rgba(247, 250, 252, 0.7)'
                          : 'rgba(0, 0, 0, 0.6)',
                        opacity: 1,
                      },
                    },
                  }}
                />
                <Button
                  type='submit'
                  variant='contained'
                  disabled={!jiraId.trim()}
                  sx={{
                    minWidth: '100px',
                    height: '56px',
                    background:
                      'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
                    boxShadow: '0 4px 16px rgba(102, 126, 234, 0.4)',
                    borderRadius: 2,
                    fontSize: '1rem',
                    fontWeight: 600,
                    '&:hover': {
                      background:
                        'linear-gradient(45deg, #764ba2 30%, #667eea 90%)',
                      boxShadow: '0 6px 20px rgba(118, 75, 162, 0.5)',
                    },
                    '&:disabled': {
                      background: 'rgba(0, 0, 0, 0.12)',
                      boxShadow: 'none',
                    },
                  }}
                >
                  <Visibility sx={{ mr: 1 }} />
                  View
                </Button>
              </Box>
            </Box>

            {error && (
              <Alert severity='error' sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <Typography
              variant='body2'
              color='text.secondary'
              sx={{ textAlign: 'center' }}
            >
              Press Enter or click "View" to open the Jira issue in the
              futuristic viewer
            </Typography>
          </Paper>

          {/* Quick Access Section */}
          <Paper
            elevation={0}
            sx={{
              p: 3,
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
            <Typography variant='h6' sx={{ mb: 2, fontWeight: 600 }}>
              Quick Access
            </Typography>

            <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
              Click on any recent issue to view it instantly:
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {recentJiraIds.map((item, index) => (
                <Chip
                  key={index}
                  icon={
                    item.type === 'Bug' ? (
                      <BugReport />
                    ) : item.type === 'Task' ? (
                      <Task />
                    ) : (
                      <Assignment />
                    )
                  }
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant='body2' sx={{ fontWeight: 600 }}>
                        {item.id}
                      </Typography>
                      <Typography variant='caption' color='text.secondary'>
                        {item.title}
                      </Typography>
                    </Box>
                  }
                  onClick={() => handleQuickSelect(item.id)}
                  sx={{
                    justifyContent: 'flex-start',
                    p: 1.5,
                    height: 'auto',
                    cursor: 'pointer',
                    background: 'rgba(102, 126, 234, 0.1)',
                    border: '1px solid rgba(102, 126, 234, 0.2)',
                    '&:hover': {
                      background: 'rgba(102, 126, 234, 0.2)',
                      transform: 'translateY(-1px)',
                      boxShadow: '0 4px 12px rgba(102, 126, 234, 0.2)',
                    },
                    transition: 'all 0.2s ease',
                    '& .MuiChip-label': {
                      width: '100%',
                    },
                  }}
                  variant='outlined'
                />
              ))}
            </Box>

            <Divider sx={{ my: 2 }} />

            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
              <Chip
                icon={<TrendingUp />}
                label='AI-Powered Analysis'
                color='primary'
                variant='outlined'
                size='small'
              />
              <Chip
                icon={<AutoAwesome />}
                label='Futuristic Interface'
                color='secondary'
                variant='outlined'
                size='small'
              />
            </Box>
          </Paper>
        </div>
      </Container>
    </Box>
  );
};

export default JiraIdPrompt;
