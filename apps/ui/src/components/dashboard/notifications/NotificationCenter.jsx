import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
  Popover,
  Box,
  Typography,
  IconButton,
  Button,
  Tabs,
  Tab,
  Divider,
  CircularProgress,
  Badge,
  Tooltip,
} from '@mui/material';
import {
  DoneAll as DoneAllIcon,
  DeleteSweep as ClearAllIcon,
  Close as CloseIcon,
  NotificationsNone as EmptyIcon,
  Send as TestIcon,
  CloudDone as CloudDoneIcon,
} from '@mui/icons-material';
import { AnimatePresence } from 'framer-motion';
import { useAppTheme } from '../../../theme/useAppTheme';
import NotificationItem from './NotificationItem';
import {
  useGetNotificationsQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
  useDeleteNotificationMutation,
  useClearAllNotificationsMutation,
  useTriggerTestNotificationMutation,
} from '../../../store/api/dashboardApi';

const NotificationCenter = ({ anchorEl, open, onClose }) => {
  const { isDark } = useAppTheme();
  const [tab, setTab] = useState('all');

  const { data: notificationsData, isLoading, refetch } = useGetNotificationsQuery();
  const [markRead] = useMarkNotificationReadMutation();
  const [markAllRead, { isLoading: isMarkingAll }] = useMarkAllNotificationsReadMutation();
  const [deleteNotification] = useDeleteNotificationMutation();
  const [clearAll, { isLoading: isClearing }] = useClearAllNotificationsMutation();
  const [triggerTest, { isLoading: isTesting }] = useTriggerTestNotificationMutation();

  const notifications = notificationsData?.data?.notifications || [];
  const unreadCount = notificationsData?.data?.unreadCount || 0;

  const filteredNotifications = notifications.filter(n => {
    if (tab === 'unread') return n.status === 'unread';
    if (tab === 'reminders') return n.type === 'reminder';
    if (tab === 'todos') return n.type === 'todo';
    return true;
  });

  const handleMarkAllRead = async () => {
    try {
      await markAllRead().unwrap();
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const handleClearAll = async () => {
    if (window.confirm('Are you sure you want to clear all notifications?')) {
      try {
        await clearAll().unwrap();
      } catch (err) {
        console.error('Failed to clear notifications:', err);
      }
    }
  };

  const handleSendTest = async () => {
    try {
      await triggerTest({
        title: '🔔 Server Notification Test',
        message: 'This notification was triggered from the server background engine!',
        type: 'system',
        severity: 'info',
      }).unwrap();
    } catch (err) {
      console.error('Failed to trigger test notification:', err);
    }
  };

  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'right',
      }}
      transformOrigin={{
        vertical: 'top',
        horizontal: 'right',
      }}
      PaperProps={{
        sx: {
          width: { xs: 320, sm: 400 },
          maxHeight: 560,
          borderRadius: '16px',
          bgcolor: isDark ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.98)',
          backdropFilter: 'blur(20px)',
          border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.08)',
          boxShadow: isDark
            ? '0 20px 40px rgba(0, 0, 0, 0.5)'
            : '0 20px 40px rgba(0, 0, 0, 0.15)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          mt: 1.5,
        },
      }}
    >
      {/* Header */}
      <Box sx={{ p: 2, pb: 1.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: isDark ? '#f1f5f9' : '#0f172a', fontSize: '1.05rem' }}>
              Notifications
            </Typography>
            {unreadCount > 0 && (
              <Badge
                badgeContent={unreadCount}
                color="primary"
                sx={{
                  '& .MuiBadge-badge': {
                    bgcolor: '#7C3AED',
                    fontWeight: 700,
                    fontSize: '0.7rem',
                  },
                }}
              />
            )}
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Tooltip title="Server Sync Active">
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                  px: 1,
                  py: 0.25,
                  borderRadius: '12px',
                  bgcolor: 'rgba(16, 185, 129, 0.1)',
                  color: '#10B981',
                  fontSize: '0.7rem',
                  fontWeight: 600,
                }}
              >
                <CloudDoneIcon sx={{ fontSize: 13 }} />
                <span>Server</span>
              </Box>
            </Tooltip>
            <IconButton size="small" onClick={onClose} sx={{ color: 'text.secondary' }}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>

        {/* Quick action bar */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pt: 0.5 }}>
          <Button
            size="small"
            startIcon={<TestIcon sx={{ fontSize: 13 }} />}
            onClick={handleSendTest}
            disabled={isTesting}
            sx={{
              fontSize: '0.72rem',
              textTransform: 'none',
              color: '#7C3AED',
              p: 0.5,
              minWidth: 0,
            }}
          >
            {isTesting ? 'Sending...' : 'Test Alert'}
          </Button>

          <Box sx={{ display: 'flex', gap: 1 }}>
            {unreadCount > 0 && (
              <Button
                size="small"
                startIcon={<DoneAllIcon sx={{ fontSize: 14 }} />}
                onClick={handleMarkAllRead}
                disabled={isMarkingAll}
                sx={{
                  fontSize: '0.72rem',
                  textTransform: 'none',
                  color: '#64748b',
                  p: 0.5,
                  minWidth: 0,
                  '&:hover': { color: '#7C3AED' },
                }}
              >
                Mark all read
              </Button>
            )}
            {notifications.length > 0 && (
              <Button
                size="small"
                startIcon={<ClearAllIcon sx={{ fontSize: 14 }} />}
                onClick={handleClearAll}
                disabled={isClearing}
                sx={{
                  fontSize: '0.72rem',
                  textTransform: 'none',
                  color: '#64748b',
                  p: 0.5,
                  minWidth: 0,
                  '&:hover': { color: '#EF4444' },
                }}
              >
                Clear all
              </Button>
            )}
          </Box>
        </Box>
      </Box>

      {/* Filter Tabs */}
      <Tabs
        value={tab}
        onChange={(e, newTab) => setTab(newTab)}
        variant="fullWidth"
        sx={{
          minHeight: 36,
          borderBottom: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.06)',
          '& .MuiTab-root': {
            minHeight: 36,
            fontSize: '0.75rem',
            fontWeight: 600,
            textTransform: 'none',
            color: 'text.secondary',
            '&.Mui-selected': {
              color: '#7C3AED',
            },
          },
          '& .MuiTabs-indicator': {
            bgcolor: '#7C3AED',
          },
        }}
      >
        <Tab label={`All (${notifications.length})`} value="all" />
        <Tab label={`Unread (${unreadCount})`} value="unread" />
        <Tab label="Reminders" value="reminders" />
        <Tab label="Tasks" value="todos" />
      </Tabs>

      {/* Notifications List */}
      <Box
        sx={{
          p: 1.5,
          overflowY: 'auto',
          flexGrow: 1,
          maxHeight: 380,
          '&::-webkit-scrollbar': {
            width: 6,
          },
          '&::-webkit-scrollbar-thumb': {
            bgcolor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
            borderRadius: 3,
          },
        }}
      >
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 6 }}>
            <CircularProgress size={28} sx={{ color: '#7C3AED' }} />
          </Box>
        ) : filteredNotifications.length === 0 ? (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              py: 6,
              textAlign: 'center',
              color: 'text.secondary',
            }}
          >
            <EmptyIcon sx={{ fontSize: 44, color: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)', mb: 1 }} />
            <Typography variant="body2" sx={{ fontWeight: 600, color: isDark ? '#cbd5e1' : '#475569' }}>
              No notifications
            </Typography>
            <Typography variant="caption" sx={{ color: '#94a3b8', mt: 0.5 }}>
              {tab === 'unread'
                ? "You're all caught up! No unread notifications."
                : 'Reminders and task alerts from the server will show up here.'}
            </Typography>
          </Box>
        ) : (
          <AnimatePresence>
            {filteredNotifications.map(notification => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkRead={id => markRead(id)}
                onDelete={id => deleteNotification(id)}
              />
            ))}
          </AnimatePresence>
        )}
      </Box>

      {/* Footer Info */}
      <Divider sx={{ borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }} />
      <Box
        sx={{
          px: 2,
          py: 1,
          bgcolor: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.015)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.7rem' }}>
          Driven by background server engine
        </Typography>
        <Button
          size="small"
          onClick={() => refetch()}
          sx={{ fontSize: '0.7rem', textTransform: 'none', color: '#7C3AED', p: 0, minWidth: 0 }}
        >
          Refresh
        </Button>
      </Box>
    </Popover>
  );
};

NotificationCenter.propTypes = {
  anchorEl: PropTypes.any,
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default NotificationCenter;
