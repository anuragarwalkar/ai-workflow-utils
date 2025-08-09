import React from 'react';
import {
  AppBar,
  Box,
  Chip,
  IconButton,
  Toolbar,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  BugReport,
  Home,
  Refresh,
  Share,
  Star,
  StarBorder,
  SubdirectoryArrowRight,
  Task,
} from '@mui/icons-material';
import { useAppTheme } from '../../../../theme/useAppTheme';
import ThemeToggle from '../../../common/ThemeToggle';

const JiraNavigationBar = ({
  jiraData,
  isStarred,
  onBack,
  onRefresh,
  onShare,
  onToggleStar,
}) => {
  const { isDark } = useAppTheme();

  const getIssueIcon = issueType => {
    switch (issueType?.toLowerCase()) {
      case 'bug':
        return <BugReport sx={{ color: '#ff6b6b' }} />;
      case 'task':
        return <Task sx={{ color: '#4ecdc4' }} />;
      case 'story':
        return <SubdirectoryArrowRight sx={{ color: '#45b7d1' }} />;
      default:
        return <Task sx={{ color: '#4ecdc4' }} />;
    }
  };

  const getStatusColor = status => {
    switch (status?.toLowerCase()) {
      case 'done':
      case 'resolved':
      case 'closed':
        return '#00b894';
      case 'in progress':
      case 'in review':
        return '#fdcb6e';
      case 'blocked':
        return '#e17055';
      case 'to do':
      case 'open':
        return '#74b9ff';
      default:
        return '#a29bfe';
    }
  };

  return (
    <AppBar
      elevation={0}
      position='static'
      sx={{
        background: isDark
          ? 'rgba(15, 15, 35, 0.95)'
          : 'rgba(230, 232, 240, 0.95)',
        backdropFilter: 'blur(20px)',
        borderBottom: isDark
          ? '1px solid rgba(255, 255, 255, 0.1)'
          : '1px solid rgba(0, 0, 0, 0.1)',
        zIndex: 100,
      }}
    >
      <Toolbar sx={{ justifyContent: 'space-between', py: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Tooltip title='Go Home'>
            <IconButton
              sx={{
                color: isDark ? 'white' : '#2d3748',
                background: isDark
                  ? 'rgba(255, 255, 255, 0.1)'
                  : 'rgba(45, 55, 72, 0.1)',
                '&:hover': {
                  background: isDark
                    ? 'rgba(255, 255, 255, 0.2)'
                    : 'rgba(45, 55, 72, 0.2)',
                  transform: 'scale(1.1)',
                },
                transition: 'all 0.3s ease',
              }}
              onClick={onBack}
            >
              <Home />
            </IconButton>
          </Tooltip>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {getIssueIcon(jiraData.fields?.issuetype?.name)}
            <Typography
              sx={{
                fontWeight: 700,
                color: isDark ? 'white' : '#2d3748',
                textShadow: isDark
                  ? '0 0 20px rgba(255, 255, 255, 0.5)'
                  : '0 0 20px rgba(45, 55, 72, 0.1)',
              }}
              variant='h5'
            >
              {jiraData.key}
            </Typography>
          </Box>

          <Chip
            label={jiraData.fields?.issuetype?.name || 'Unknown'}
            sx={{
              background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
              color: 'white',
              fontWeight: 600,
              textShadow: '0 0 10px rgba(255, 255, 255, 0.3)',
            }}
          />

          <Chip
            label={jiraData.fields?.status?.name || 'Unknown'}
            sx={{
              background: `linear-gradient(45deg, ${getStatusColor(
                jiraData.fields?.status?.name
              )} 30%, ${getStatusColor(jiraData.fields?.status?.name)}AA 90%)`,
              color: 'white',
              fontWeight: 600,
            }}
          />
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ThemeToggle />

          <Tooltip title='Refresh'>
            <IconButton
              sx={{
                color: isDark ? 'white' : '#2d3748',
                '&:hover': {
                  color: '#4ecdc4',
                  transform: 'rotate(180deg)',
                },
                transition: 'all 0.6s ease',
              }}
              onClick={onRefresh}
            >
              <Refresh />
            </IconButton>
          </Tooltip>

          <Tooltip
            title={isStarred ? 'Remove from favorites' : 'Add to favorites'}
          >
            <IconButton
              sx={{
                color: isStarred ? '#ffd700' : isDark ? 'white' : '#2d3748',
                '&:hover': {
                  color: '#ffd700',
                  transform: 'scale(1.2)',
                },
                transition: 'all 0.3s ease',
              }}
              onClick={onToggleStar}
            >
              {isStarred ? <Star /> : <StarBorder />}
            </IconButton>
          </Tooltip>

          <Tooltip title='Share'>
            <IconButton
              sx={{
                color: isDark ? 'white' : '#2d3748',
                '&:hover': {
                  color: '#45b7d1',
                  transform: 'scale(1.1)',
                },
                transition: 'all 0.3s ease',
              }}
              onClick={onShare}
            >
              <Share />
            </IconButton>
          </Tooltip>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default JiraNavigationBar;
