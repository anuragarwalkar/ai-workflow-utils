import { Paper, Typography, Box, Chip } from '@mui/material';
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
  Done,
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
          elevation={0}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
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
              variant='subtitle1'
              sx={{ fontWeight: 600, fontSize: '0.9rem' }}
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
                        variant='body2'
                        sx={{ fontWeight: 600, fontSize: '0.85rem' }}
                      >
                        {event.title}
                      </Typography>
                    </Box>

                    <Typography
                      variant='caption'
                      color='text.secondary'
                      sx={{ mb: 0.25, fontSize: '0.75rem' }}
                    >
                      {event.description}
                    </Typography>

                    <Typography
                      variant='caption'
                      color='text.secondary'
                      sx={{ fontSize: '0.7rem' }}
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
          elevation={0}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
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
        >
          <Typography
            variant='caption'
            color='text.secondary'
            sx={{ mb: 1.5, fontWeight: 600 }}
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
              <Typography variant='caption' color='text.secondary'>
                Status
              </Typography>
              <Chip
                label={fields.status?.name || 'Unknown'}
                size='small'
                color='primary'
                variant='outlined'
                sx={{ height: 20, fontSize: '0.65rem' }}
              />
            </Box>

            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Typography variant='caption' color='text.secondary'>
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
                sx={{ height: 20, fontSize: '0.65rem' }}
              />
            </Box>

            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Typography variant='caption' color='text.secondary'>
                Resolution
              </Typography>
              <Typography variant='caption' sx={{ fontSize: '0.7rem' }}>
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
