import React from 'react';
import { Avatar, Box, Chip, Grid, Paper, Typography } from '@mui/material';
import {
  Timeline,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineItem,
  TimelineSeparator,
} from '@mui/lab';
import {
  Assignment,
  Attachment,
  BugReport,
  Comment,
  Create,
  Done,
  Edit,
  Timeline as TimelineIcon,
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
    <Box sx={{ display: 'flex', gap: 3, mb: 3 }}>
      {/* Left Side - Main Timeline */}
      <Box sx={{ flex: 2 }}>
        <MotionPaper
          animate={{ opacity: 1, x: 0 }}
          elevation={0}
          initial={{ opacity: 0, x: -20 }}
          sx={{
            background: isDark ? 'rgba(45, 55, 72, 0.95)' : 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
            borderRadius: 3,
            overflow: 'hidden',
          }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {/* Header */}
          <Box
            sx={{
              borderBottom: isDark
                ? '1px solid rgba(255, 255, 255, 0.1)'
                : '1px solid rgba(0, 0, 0, 0.1)',
              px: 2,
              py: 1.5,
              display: 'flex',
              alignItems: 'center',
              gap: 1,
            }}
          >
            <TimelineIcon color='primary' />
            <Typography sx={{ fontWeight: 600, fontSize: '1.1rem' }} variant='h6'>
              Activity Timeline
            </Typography>
          </Box>

          {/* Timeline - Compact */}
          <Box sx={{ p: 1.5 }}>
            <Timeline
              sx={{
                m: 0,
                p: 0,
                '& .MuiTimelineItem-root': {
                  minHeight: 50,
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
                        background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
                        border: 'none',
                        boxShadow: '0 0 10px rgba(102, 126, 234, 0.3)',
                        p: 0.5,
                        width: 28,
                        height: 28,
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

                  <TimelineContent sx={{ pb: 1.5 }}>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        mb: 0.5,
                      }}
                    >
                      <Typography sx={{ fontWeight: 600, fontSize: '0.85rem' }} variant='subtitle2'>
                        {event.title}
                      </Typography>
                      {event.user ? (
                        <Avatar
                          src={event.user.avatarUrls?.['24x24']}
                          sx={{ width: 16, height: 16 }}
                        >
                          {event.user.displayName?.[0]}
                        </Avatar>
                      ) : null}
                    </Box>

                    <Typography
                      color='text.secondary'
                      sx={{ mb: 0.5, fontSize: '0.75rem' }}
                      variant='body2'
                    >
                      {event.description}
                    </Typography>

                    <Typography
                      color='text.secondary'
                      sx={{ fontSize: '0.7rem' }}
                      variant='caption'
                    >
                      {formatDate(event.timestamp)}
                    </Typography>
                  </TimelineContent>
                </TimelineItem>
              ))}
            </Timeline>
          </Box>
        </MotionPaper>
      </Box>

      {/* Right Side - Quick Info & Metadata */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
        {/* Quick Info Card */}
        <MotionPaper
          animate={{ opacity: 1, x: 0 }}
          elevation={0}
          initial={{ opacity: 0, x: 20 }}
          sx={{
            background: isDark ? 'rgba(45, 55, 72, 0.95)' : 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
            borderRadius: 3,
            p: 2,
          }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Typography
            color='text.secondary'
            sx={{ mb: 1.5, fontSize: '0.8rem' }}
            variant='subtitle2'
          >
            Quick Info
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Typography color='text.secondary' sx={{ fontSize: '0.75rem' }} variant='body2'>
                Status
              </Typography>
              <Chip
                color='primary'
                label={fields.status?.name || 'Unknown'}
                size='small'
                sx={{ height: 20, fontSize: '0.65rem' }}
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
              <Typography color='text.secondary' sx={{ fontSize: '0.75rem' }} variant='body2'>
                Priority
              </Typography>
              <Chip
                color={
                  fields.priority?.name?.toLowerCase() === 'high'
                    ? 'error'
                    : fields.priority?.name?.toLowerCase() === 'low'
                      ? 'success'
                      : 'warning'
                }
                label={fields.priority?.name || 'Medium'}
                size='small'
                sx={{ height: 20, fontSize: '0.65rem' }}
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
              <Typography color='text.secondary' sx={{ fontSize: '0.75rem' }} variant='body2'>
                Resolution
              </Typography>
              <Typography sx={{ fontSize: '0.75rem' }} variant='body2'>
                {fields.resolution?.name || 'Unresolved'}
              </Typography>
            </Box>

            {fields.environment ? (
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <Typography color='text.secondary' sx={{ fontSize: '0.75rem' }} variant='body2'>
                  Environment
                </Typography>
                <Typography sx={{ fontSize: '0.7rem' }} variant='body2'>
                  {fields.environment.substring(0, 15)}...
                </Typography>
              </Box>
            ) : null}
          </Box>
        </MotionPaper>

        {/* Additional Metadata Cards */}
        <MotionPaper
          animate={{ opacity: 1, x: 0 }}
          elevation={0}
          initial={{ opacity: 0, x: 20 }}
          sx={{
            background: isDark ? 'rgba(45, 55, 72, 0.95)' : 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
            borderRadius: 3,
            p: 2,
          }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          {/* Watchers */}
          {fields.watches?.watchCount > 0 && (
            <Box sx={{ mb: 2 }}>
              <Typography
                color='text.secondary'
                sx={{ mb: 1, fontSize: '0.8rem' }}
                variant='subtitle2'
              >
                Watchers
              </Typography>
              <Chip
                color='info'
                label={`${fields.watches.watchCount} watching`}
                size='small'
                sx={{ height: 20, fontSize: '0.65rem' }}
                variant='outlined'
              />
            </Box>
          )}

          {/* Components */}
          {fields.components && fields.components.length > 0 ? (
            <Box sx={{ mb: 2 }}>
              <Typography
                color='text.secondary'
                sx={{ mb: 1, fontSize: '0.8rem' }}
                variant='subtitle2'
              >
                Components
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {fields.components.map((component, index) => (
                  <Chip
                    key={index}
                    label={component.name}
                    size='small'
                    sx={{ fontSize: '0.65rem', height: 20 }}
                    variant='outlined'
                  />
                ))}
              </Box>
            </Box>
          ) : null}

          {/* Fix Versions */}
          {fields.fixVersions && fields.fixVersions.length > 0 ? (
            <Box>
              <Typography
                color='text.secondary'
                sx={{ mb: 1, fontSize: '0.8rem' }}
                variant='subtitle2'
              >
                Fix Versions
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {fields.fixVersions.map((version, index) => (
                  <Chip
                    color='success'
                    key={index}
                    label={version.name}
                    size='small'
                    sx={{ fontSize: '0.65rem', height: 20 }}
                    variant='outlined'
                  />
                ))}
              </Box>
            </Box>
          ) : null}
        </MotionPaper>
      </Box>
    </Box>
  );
};

export default JiraTimeline;
