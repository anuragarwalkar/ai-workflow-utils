import { Box, Chip, Paper, Typography } from '@mui/material';
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
  Comment,
  Create,
  Done,
  Edit,
  Timeline as TimelineIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useAppTheme } from '../../../../theme/useAppTheme';

const MotionPaper = motion(Paper);

const JiraTimelineSimple = ({ jiraData }) => {
  const { isDark } = useAppTheme();

  const getActivityIcon = type => {
    switch (type) {
      case 'created':
        return <Create sx={{ fontSize: 12 }} />;
      case 'updated':
        return <Edit sx={{ fontSize: 12 }} />;
      case 'commented':
        return <Comment sx={{ fontSize: 12 }} />;
      case 'resolved':
        return <Done sx={{ fontSize: 12 }} />;
      case 'assigned':
        return <Assignment sx={{ fontSize: 12 }} />;
      default:
        return <Create sx={{ fontSize: 12 }} />;
    }
  };

  const formatDate = dateString => {
    if (!dateString) return 'Unknown';
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

  // Simplified timeline events
  const timelineEvents = [
    {
      id: 1,
      type: 'created',
      title: 'Issue Created',
      description: `Created by ${jiraData?.fields?.reporter?.displayName || 'Unknown'}`,
      timestamp: jiraData?.fields?.created,
    },
    {
      id: 2,
      type: 'assigned',
      title: 'Assigned',
      description: `Assigned to ${jiraData?.fields?.assignee?.displayName || 'Unassigned'}`,
      timestamp: jiraData?.fields?.created,
    },
    {
      id: 3,
      type: 'updated',
      title: 'Last Updated',
      description: 'Issue was updated',
      timestamp: jiraData?.fields?.updated,
    },
  ].filter(event => event.timestamp);

  const fields = jiraData?.fields || {};

  return (
    <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
      {/* Main Timeline */}
      <Box sx={{ flex: 2 }}>
        <MotionPaper
          animate={{ opacity: 1, x: 0 }}
          elevation={0}
          initial={{ opacity: 0, x: -20 }}
          sx={{
            background: isDark
              ? 'rgba(45, 55, 72, 0.95)'
              : 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            border: isDark
              ? '1px solid rgba(255, 255, 255, 0.1)'
              : '1px solid rgba(0, 0, 0, 0.1)',
            borderRadius: 2,
            overflow: 'hidden',
          }}
          transition={{ duration: 0.5 }}
        >
          {/* Header */}
          <Box
            sx={{
              borderBottom: isDark
                ? '1px solid rgba(255, 255, 255, 0.1)'
                : '1px solid rgba(0, 0, 0, 0.1)',
              px: 1.5,
              py: 1,
              display: 'flex',
              alignItems: 'center',
              gap: 1,
            }}
          >
            <TimelineIcon color='primary' sx={{ fontSize: 18 }} />
            <Typography
              sx={{ fontWeight: 600, fontSize: '0.9rem' }}
              variant='subtitle1'
            >
              Activity Timeline
            </Typography>
          </Box>

          {/* Timeline */}
          <Box sx={{ p: 1.5 }}>
            <Timeline
              sx={{
                m: 0,
                p: 0,
                '& .MuiTimelineItem-root': {
                  minHeight: 45,
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
                        boxShadow: '0 0 8px rgba(102, 126, 234, 0.3)',
                        p: 0.5,
                        width: 24,
                        height: 24,
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
                        mb: 0.25,
                      }}
                    >
                      <Typography
                        sx={{ fontWeight: 600, fontSize: '0.85rem' }}
                        variant='body2'
                      >
                        {event.title}
                      </Typography>
                    </Box>

                    <Typography
                      color='text.secondary'
                      sx={{ mb: 0.25, fontSize: '0.75rem' }}
                      variant='caption'
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

      {/* Quick Info Sidebar */}
      <Box sx={{ flex: 1 }}>
        <MotionPaper
          animate={{ opacity: 1, x: 0 }}
          elevation={0}
          initial={{ opacity: 0, x: 20 }}
          sx={{
            background: isDark
              ? 'rgba(45, 55, 72, 0.95)'
              : 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            border: isDark
              ? '1px solid rgba(255, 255, 255, 0.1)'
              : '1px solid rgba(0, 0, 0, 0.1)',
            borderRadius: 2,
            p: 1.5,
          }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Typography
            color='text.secondary'
            sx={{ mb: 1.5, fontWeight: 600 }}
            variant='caption'
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
              <Typography color='text.secondary' variant='caption'>
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
              <Typography color='text.secondary' variant='caption'>
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
              <Typography color='text.secondary' variant='caption'>
                Resolution
              </Typography>
              <Typography sx={{ fontSize: '0.7rem' }} variant='caption'>
                {fields.resolution?.name || 'Unresolved'}
              </Typography>
            </Box>
          </Box>
        </MotionPaper>
      </Box>
    </Box>
  );
};

export default JiraTimelineSimple;
