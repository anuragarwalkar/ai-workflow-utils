import React from 'react';
import { useAppTheme } from '../../../../theme/useAppTheme';
import {
  Avatar,
  Box,
  Chip,
  Divider,
  LinearProgress,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import {
  Assignment,
  BugReport,
  CalendarToday,
  Flag,
  Person,
  Task,
  Update,
} from '@mui/icons-material';
import { motion } from 'framer-motion';

const MotionPaper = motion(Paper);

const JiraHeader = ({ jiraData }) => {
  const { isDark } = useAppTheme();
  const getIssueTypeIcon = issueType => {
    const type = issueType?.toLowerCase();
    switch (type) {
      case 'bug':
        return <BugReport color='error' />;
      case 'task':
        return <Task color='primary' />;
      case 'story':
        return <Assignment color='success' />;
      default:
        return <Task color='primary' />;
    }
  };

  const getPriorityColor = priority => {
    const p = priority?.toLowerCase();
    switch (p) {
      case 'highest':
      case 'critical':
        return 'error';
      case 'high':
        return 'warning';
      case 'medium':
        return 'info';
      case 'low':
      case 'lowest':
        return 'success';
      default:
        return 'default';
    }
  };

  const getStatusProgress = status => {
    const s = status?.toLowerCase();
    switch (s) {
      case 'to do':
      case 'open':
        return 10;
      case 'in progress':
      case 'in review':
        return 50;
      case 'done':
      case 'closed':
      case 'resolved':
        return 100;
      default:
        return 25;
    }
  };

  const formatDate = dateString => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const fields = jiraData?.fields || {};
  const { assignee } = fields;
  const { reporter } = fields;
  const status = fields.status?.name;
  const priority = fields.priority?.name;
  const issueType = fields.issuetype?.name;

  return (
    <MotionPaper
      animate={{ opacity: 1, y: 0 }}
      elevation={0}
      initial={{ opacity: 0, y: 20 }}
      sx={{
        p: 4,
        background: isDark ? 'rgba(45, 55, 72, 0.95)' : 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(20px)',
        border: isDark
          ? '1px solid rgba(255, 255, 255, 0.1)'
          : '1px solid rgba(255, 255, 255, 0.2)',
        borderRadius: 3,
        position: 'relative',
        overflow: 'hidden',
      }}
      transition={{ duration: 0.5 }}
    >
      {/* Background Gradient Effect */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '100%',
          background: `linear-gradient(135deg, 
            rgba(102, 126, 234, 0.05) 0%, 
            rgba(118, 75, 162, 0.05) 100%)`,
          pointerEvents: 'none',
        }}
      />

      <Box sx={{ position: 'relative', zIndex: 1 }}>
        {/* Title and Key */}
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {getIssueTypeIcon(issueType)}
            <Chip
              label={issueType || 'Unknown'}
              size='small'
              sx={{
                borderColor: 'primary.main',
                color: 'primary.main',
                fontWeight: 600,
              }}
              variant='outlined'
            />
          </Box>

          <Typography
            sx={{
              fontWeight: 700,
              flex: 1,
              background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              lineHeight: 1.2,
            }}
            variant='h4'
          >
            {fields.summary || 'Untitled Issue'}
          </Typography>
        </Box>

        {/* Status Progress Bar */}
        <Box sx={{ mb: 3 }}>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 1,
            }}
          >
            <Typography color='text.secondary' variant='body2'>
              Progress
            </Typography>
            <Chip
              color={getStatusProgress(status) === 100 ? 'success' : 'primary'}
              label={status || 'Unknown'}
              size='small'
              variant='filled'
            />
          </Box>
          <LinearProgress
            sx={{
              height: 8,
              borderRadius: 4,
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              '& .MuiLinearProgress-bar': {
                background:
                  getStatusProgress(status) === 100
                    ? 'linear-gradient(45deg, #4caf50 30%, #81c784 90%)'
                    : 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
                borderRadius: 4,
              },
            }}
            value={getStatusProgress(status)}
            variant='determinate'
          />
        </Box>

        <Divider sx={{ my: 3, borderColor: 'rgba(255, 255, 255, 0.1)' }} />

        {/* Issue Details Grid */}
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={4}>
          {/* Priority */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              minWidth: 120,
            }}
          >
            <Flag color={getPriorityColor(priority)} />
            <Box>
              <Typography color='text.secondary' display='block' variant='caption'>
                Priority
              </Typography>
              <Chip
                color={getPriorityColor(priority)}
                label={priority || 'Medium'}
                size='small'
                variant='outlined'
              />
            </Box>
          </Box>

          {/* Assignee */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              minWidth: 160,
            }}
          >
            <Person color='action' />
            <Box>
              <Typography color='text.secondary' display='block' variant='caption'>
                Assignee
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Avatar src={assignee?.avatarUrls?.['24x24']} sx={{ width: 24, height: 24 }}>
                  {assignee?.displayName?.[0] || 'U'}
                </Avatar>
                <Typography sx={{ fontWeight: 500 }} variant='body2'>
                  {assignee?.displayName || 'Unassigned'}
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* Reporter */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              minWidth: 160,
            }}
          >
            <Person color='action' />
            <Box>
              <Typography color='text.secondary' display='block' variant='caption'>
                Reporter
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Avatar src={reporter?.avatarUrls?.['24x24']} sx={{ width: 24, height: 24 }}>
                  {reporter?.displayName?.[0] || 'U'}
                </Avatar>
                <Typography sx={{ fontWeight: 500 }} variant='body2'>
                  {reporter?.displayName || 'Unknown'}
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* Created Date */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              minWidth: 120,
            }}
          >
            <CalendarToday color='action' />
            <Box>
              <Typography color='text.secondary' display='block' variant='caption'>
                Created
              </Typography>
              <Typography sx={{ fontWeight: 500 }} variant='body2'>
                {formatDate(fields.created)}
              </Typography>
            </Box>
          </Box>

          {/* Updated Date */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              minWidth: 120,
            }}
          >
            <Update color='action' />
            <Box>
              <Typography color='text.secondary' display='block' variant='caption'>
                Updated
              </Typography>
              <Typography sx={{ fontWeight: 500 }} variant='body2'>
                {formatDate(fields.updated)}
              </Typography>
            </Box>
          </Box>
        </Stack>

        {/* Labels */}
        {fields.labels && fields.labels.length > 0 ? (
          <Box sx={{ mt: 3 }}>
            <Typography color='text.secondary' display='block' sx={{ mb: 1 }} variant='caption'>
              Labels
            </Typography>
            <Stack direction='row' flexWrap='wrap' spacing={1}>
              {fields.labels.map((label, index) => (
                <Chip
                  key={index}
                  label={label}
                  size='small'
                  sx={{
                    borderColor: 'rgba(102, 126, 234, 0.5)',
                    color: 'text.primary',
                    '&:hover': {
                      backgroundColor: 'rgba(102, 126, 234, 0.1)',
                    },
                  }}
                  variant='outlined'
                />
              ))}
            </Stack>
          </Box>
        ) : null}
      </Box>
    </MotionPaper>
  );
};

export default JiraHeader;
