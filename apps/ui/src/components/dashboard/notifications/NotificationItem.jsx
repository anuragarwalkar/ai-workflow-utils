import React from 'react';
import PropTypes from 'prop-types';
import { Box, Typography, IconButton, Tooltip, Chip } from '@mui/material';
import {
  AccessTime as ReminderIcon,
  CheckCircleOutline as TaskIcon,
  AutoAwesome as AiIcon,
  NotificationsNone as SystemIcon,
  Done as MarkReadIcon,
  DeleteOutline as DeleteIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useAppTheme } from '../../../theme/useAppTheme';

const formatTimeAgo = (dateString) => {
  if (!dateString) return '';
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now - date;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 45) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  if (diffDay === 1) return 'Yesterday';
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

const getNotificationIcon = (type) => {
  switch (type) {
    case 'reminder':
      return <ReminderIcon sx={{ fontSize: 18, color: '#F59E0B' }} />;
    case 'todo':
      return <TaskIcon sx={{ fontSize: 18, color: '#10B981' }} />;
    case 'ai':
      return <AiIcon sx={{ fontSize: 18, color: '#7C3AED' }} />;
    default:
      return <SystemIcon sx={{ fontSize: 18, color: '#3B82F6' }} />;
  }
};

const getSeverityColor = (severity) => {
  switch (severity) {
    case 'error':
      return '#EF4444';
    case 'warning':
      return '#F59E0B';
    case 'success':
      return '#10B981';
    default:
      return '#3B82F6';
  }
};

const NotificationItem = ({ notification, onMarkRead, onDelete }) => {
  const { isDark } = useAppTheme();
  const isUnread = notification.status === 'unread';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0, marginBottom: 0 }}
      transition={{ duration: 0.2 }}
    >
      <Box
        sx={{
          p: 1.75,
          mb: 1,
          borderRadius: '12px',
          bgcolor: isUnread
            ? isDark
              ? 'rgba(124, 58, 237, 0.12)'
              : 'rgba(124, 58, 237, 0.05)'
            : isDark
            ? 'rgba(255, 255, 255, 0.02)'
            : 'rgba(0, 0, 0, 0.02)',
          border: isUnread
            ? '1px solid rgba(124, 58, 237, 0.3)'
            : isDark
            ? '1px solid rgba(255, 255, 255, 0.05)'
            : '1px solid rgba(0, 0, 0, 0.05)',
          position: 'relative',
          transition: 'all 0.2s ease',
          '&:hover': {
            bgcolor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          },
        }}
      >
        {/* Unread indicator dot */}
        {isUnread && (
          <Box
            sx={{
              position: 'absolute',
              top: 14,
              left: 8,
              width: 6,
              height: 6,
              borderRadius: '50%',
              bgcolor: '#7C3AED',
              boxShadow: '0 0 6px rgba(124, 58, 237, 0.8)',
            }}
          />
        )}

        <Box sx={{ pl: isUnread ? 1.5 : 0.5, display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
          {/* Icon */}
          <Box
            sx={{
              p: 0.75,
              borderRadius: '8px',
              bgcolor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              mt: 0.25,
            }}
          >
            {getNotificationIcon(notification.type)}
          </Box>

          {/* Content */}
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, mb: 0.5 }}>
              <Typography
                variant="subtitle2"
                sx={{
                  fontWeight: isUnread ? 700 : 500,
                  color: isDark ? '#f1f5f9' : '#0f172a',
                  fontSize: '0.875rem',
                  lineHeight: 1.3,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {notification.title}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: '#94a3b8',
                  fontSize: '0.7rem',
                  flexShrink: 0,
                }}
              >
                {formatTimeAgo(notification.createdAt)}
              </Typography>
            </Box>

            {notification.message && (
              <Typography
                variant="body2"
                sx={{
                  color: isDark ? '#94a3b8' : '#64748b',
                  fontSize: '0.8rem',
                  lineHeight: 1.4,
                  mb: 1,
                  wordBreak: 'break-word',
                }}
              >
                {notification.message}
              </Typography>
            )}

            {/* Badges and Actions */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 0.5 }}>
              <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                <Chip
                  label={notification.type || 'system'}
                  size="small"
                  sx={{
                    height: 20,
                    fontSize: '0.65rem',
                    textTransform: 'uppercase',
                    fontWeight: 600,
                    bgcolor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
                    color: isDark ? '#cbd5e1' : '#64748b',
                  }}
                />
                {notification.severity && notification.severity !== 'info' && (
                  <Chip
                    label={notification.severity}
                    size="small"
                    sx={{
                      height: 20,
                      fontSize: '0.65rem',
                      textTransform: 'capitalize',
                      fontWeight: 600,
                      bgcolor: `${getSeverityColor(notification.severity)}18`,
                      color: getSeverityColor(notification.severity),
                    }}
                  />
                )}
              </Box>

              <Box sx={{ display: 'flex', gap: 0.5 }}>
                {isUnread && onMarkRead && (
                  <Tooltip title="Mark as read">
                    <IconButton
                      size="small"
                      onClick={() => onMarkRead(notification.id)}
                      sx={{
                        p: 0.5,
                        color: '#7C3AED',
                        '&:hover': { bgcolor: 'rgba(124, 58, 237, 0.1)' },
                      }}
                    >
                      <MarkReadIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  </Tooltip>
                )}
                {onDelete && (
                  <Tooltip title="Delete">
                    <IconButton
                      size="small"
                      onClick={() => onDelete(notification.id)}
                      sx={{
                        p: 0.5,
                        color: '#94a3b8',
                        '&:hover': { bgcolor: 'rgba(239, 68, 68, 0.1)', color: '#EF4444' },
                      }}
                    >
                      <DeleteIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>
    </motion.div>
  );
};

NotificationItem.propTypes = {
  notification: PropTypes.shape({
    id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    message: PropTypes.string,
    type: PropTypes.string,
    severity: PropTypes.string,
    status: PropTypes.string,
    createdAt: PropTypes.string,
  }).isRequired,
  onMarkRead: PropTypes.func,
  onDelete: PropTypes.func,
};

export default NotificationItem;
