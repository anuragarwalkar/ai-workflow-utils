import React from 'react';
import { Paper, Typography, Box, Avatar, Chip } from '@mui/material';
import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
} from '@mui/lab';
import {
  Timeline as TimelineIcon,
  Create,
  Edit,
  Assignment,
  Comment,
  Attachment,
  Done,
  BugReport,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useAppTheme } from '../../../../theme/useAppTheme';

const MotionPaper = motion(Paper);

const JiraTimeline = ({ jiraData }) => {
  const { isDark } = useAppTheme();

  const getActivityIcon = type => {
    switch (type) {
      case 'created':
        return <Create color='success' />;
      case 'updated':
        return <Edit color='info' />;
      case 'commented':
        return <Comment color='primary' />;
      case 'attached':
        return <Attachment color='warning' />;
      case 'resolved':
        return <Done color='success' />;
      case 'assigned':
        return <Assignment color='info' />;
      default:
        return <BugReport color='action' />;
    }
  };

  const formatDate = dateString => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));

    if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else if (diffInHours < 168) {
      return `${Math.floor(diffInHours / 24)}d ago`;
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
      });
    }
  };

  // Mock timeline data (in real app, this would come from Jira API)
  const timelineEvents = [
    {
      id: 1,
      type: 'created',
      title: 'Issue Created',
      description: `Created by ${jiraData?.fields?.reporter?.displayName || 'Unknown'}`,
      timestamp: jiraData?.fields?.created,
      user: jiraData?.fields?.reporter,
    },
    {
      id: 2,
      type: 'assigned',
      title: 'Assigned',
      description: `Assigned to ${jiraData?.fields?.assignee?.displayName || 'Unassigned'}`,
      timestamp: jiraData?.fields?.created,
      user: jiraData?.fields?.assignee,
    },
    {
      id: 3,
      type: 'commented',
      title: 'Comment Added',
      description: 'Initial investigation findings shared',
      timestamp: '2024-01-15T10:30:00.000Z',
      user: {
        displayName: 'John Doe',
        avatarUrls: { '24x24': '' },
      },
    },
    {
      id: 4,
      type: 'updated',
      title: 'Updated',
      description: 'Priority changed to High',
      timestamp: jiraData?.fields?.updated,
      user: jiraData?.fields?.assignee,
    },
  ].filter(event => event.timestamp);

  const fields = jiraData?.fields || {};

  return (
    <MotionPaper
      elevation={0}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      sx={{
        background: isDark
          ? 'rgba(45, 55, 72, 0.95)'
          : 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(20px)',
        border: isDark
          ? '1px solid rgba(255, 255, 255, 0.1)'
          : '1px solid rgba(0, 0, 0, 0.1)',
        borderRadius: 3,
        overflow: 'hidden',
        mb: 3,
      }}
    >
      {/* Header */}
      <Box
        sx={{
          borderBottom: isDark
            ? '1px solid rgba(255, 255, 255, 0.1)'
            : '1px solid rgba(0, 0, 0, 0.1)',
          px: 3,
          py: 2,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
        }}
      >
        <TimelineIcon color='primary' />
        <Typography variant='h6' sx={{ fontWeight: 600 }}>
          Activity Timeline
        </Typography>
      </Box>

      {/* Issue Details Summary */}
      <Box sx={{ p: 3, borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
        <Typography variant='subtitle2' color='text.secondary' sx={{ mb: 2 }}>
          Quick Info
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Typography variant='body2' color='text.secondary'>
              Status
            </Typography>
            <Chip
              label={fields.status?.name || 'Unknown'}
              size='small'
              color='primary'
              variant='outlined'
            />
          </Box>

          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Typography variant='body2' color='text.secondary'>
              Priority
            </Typography>
            <Chip
              label={fields.priority?.name || 'Medium'}
              size='small'
              color={
                fields.priority?.name?.toLowerCase() === 'high'
                  ? 'error'
                  : fields.priority?.name?.toLowerCase() === 'low'
                    ? 'success'
                    : 'warning'
              }
              variant='outlined'
            />
          </Box>

          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Typography variant='body2' color='text.secondary'>
              Resolution
            </Typography>
            <Typography variant='body2'>
              {fields.resolution?.name || 'Unresolved'}
            </Typography>
          </Box>

          {fields.environment && (
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Typography variant='body2' color='text.secondary'>
                Environment
              </Typography>
              <Typography variant='body2' sx={{ fontSize: '0.75rem' }}>
                {fields.environment.substring(0, 20)}...
              </Typography>
            </Box>
          )}
        </Box>
      </Box>

      {/* Timeline */}
      <Box sx={{ p: 2 }}>
        <Timeline
          sx={{
            m: 0,
            p: 0,
            '& .MuiTimelineItem-root': {
              minHeight: 60,
              '&:before': {
                display: 'none',
              },
            },
          }}
        >
          {timelineEvents.map((event, index) => (
            <TimelineItem key={event.id}>
              <TimelineSeparator>
                <TimelineDot
                  sx={{
                    background:
                      'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
                    border: 'none',
                    boxShadow: '0 0 10px rgba(102, 126, 234, 0.3)',
                    p: 1,
                  }}
                >
                  {getActivityIcon(event.type)}
                </TimelineDot>
                {index < timelineEvents.length - 1 && (
                  <TimelineConnector
                    sx={{
                      background:
                        'linear-gradient(to bottom, rgba(102, 126, 234, 0.5), rgba(118, 75, 162, 0.5))',
                      width: 2,
                    }}
                  />
                )}
              </TimelineSeparator>

              <TimelineContent sx={{ pb: 2 }}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    mb: 0.5,
                  }}
                >
                  <Typography variant='subtitle2' sx={{ fontWeight: 600 }}>
                    {event.title}
                  </Typography>
                  {event.user && (
                    <Avatar
                      src={event.user.avatarUrls?.['24x24']}
                      sx={{ width: 20, height: 20 }}
                    >
                      {event.user.displayName?.[0]}
                    </Avatar>
                  )}
                </Box>

                <Typography
                  variant='body2'
                  color='text.secondary'
                  sx={{ mb: 0.5 }}
                >
                  {event.description}
                </Typography>

                <Typography variant='caption' color='text.secondary'>
                  {formatDate(event.timestamp)}
                </Typography>
              </TimelineContent>
            </TimelineItem>
          ))}
        </Timeline>
      </Box>

      {/* Watchers */}
      {fields.watches?.watchCount > 0 && (
        <Box sx={{ p: 3, borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
          <Typography variant='subtitle2' color='text.secondary' sx={{ mb: 1 }}>
            Watchers
          </Typography>
          <Chip
            label={`${fields.watches.watchCount} watching`}
            size='small'
            variant='outlined'
            color='info'
          />
        </Box>
      )}

      {/* Components */}
      {fields.components && fields.components.length > 0 && (
        <Box sx={{ p: 3, borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
          <Typography variant='subtitle2' color='text.secondary' sx={{ mb: 1 }}>
            Components
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {fields.components.map((component, index) => (
              <Chip
                key={index}
                label={component.name}
                size='small'
                variant='outlined'
                sx={{ fontSize: '0.7rem' }}
              />
            ))}
          </Box>
        </Box>
      )}

      {/* Fix Versions */}
      {fields.fixVersions && fields.fixVersions.length > 0 && (
        <Box sx={{ p: 3, borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
          <Typography variant='subtitle2' color='text.secondary' sx={{ mb: 1 }}>
            Fix Versions
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {fields.fixVersions.map((version, index) => (
              <Chip
                key={index}
                label={version.name}
                size='small'
                color='success'
                variant='outlined'
                sx={{ fontSize: '0.7rem' }}
              />
            ))}
          </Box>
        </Box>
      )}
    </MotionPaper>
  );
};

export default JiraTimeline;
