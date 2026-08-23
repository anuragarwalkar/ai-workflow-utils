import React from 'react';
import PropTypes from 'prop-types';
import { IconButton, Badge, Tooltip, Box } from '@mui/material';
import { Notifications as NotificationsIcon, NotificationsNone as NotificationsNoneIcon } from '@mui/icons-material';
import { motion } from 'framer-motion';

const NotificationBell = ({ unreadCount = 0, onClick, isOpen = false }) => {
  const hasUnread = unreadCount > 0;

  return (
    <Tooltip title={hasUnread ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'Notifications'}>
      <Box sx={{ position: 'relative', display: 'inline-flex' }}>
        <IconButton
          onClick={onClick}
          size="medium"
          aria-label="Open notifications"
          sx={{
            color: isOpen || hasUnread ? '#7C3AED' : 'text.secondary',
            bgcolor: isOpen
              ? 'rgba(124, 58, 237, 0.15)'
              : hasUnread
              ? 'rgba(124, 58, 237, 0.08)'
              : 'transparent',
            borderRadius: '10px',
            p: 1,
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              bgcolor: 'rgba(124, 58, 237, 0.15)',
              transform: 'scale(1.05)',
              color: '#7C3AED',
            },
          }}
        >
          {hasUnread && (
            <motion.div
              animate={{ scale: [1, 1.15, 1] }}
              transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <Badge
                badgeContent={unreadCount}
                max={99}
                sx={{
                  '& .MuiBadge-badge': {
                    bgcolor: '#EF4444',
                    color: 'white',
                    fontWeight: 700,
                    fontSize: '0.7rem',
                    height: 18,
                    minWidth: 18,
                    px: 0.5,
                    boxShadow: '0 0 8px rgba(239, 68, 68, 0.6)',
                  },
                }}
              >
                <NotificationsIcon sx={{ fontSize: 22 }} />
              </Badge>
            </motion.div>
          )}

          {!hasUnread && (
            <NotificationsNoneIcon sx={{ fontSize: 22 }} />
          )}
        </IconButton>
      </Box>
    </Tooltip>
  );
};

NotificationBell.propTypes = {
  unreadCount: PropTypes.number,
  onClick: PropTypes.func.isRequired,
  isOpen: PropTypes.bool,
};

export default NotificationBell;
