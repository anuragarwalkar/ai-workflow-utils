import React, { useState } from 'react';
import { Box } from '@mui/material';
import NotificationBell from './notifications/NotificationBell';
import NotificationCenter from './notifications/NotificationCenter';
import { useGetUnreadNotificationCountQuery } from '../../store/api/dashboardApi';
import useNotifications from '../../hooks/useNotifications';

const DashboardHeader = () => {
  const [anchorEl, setAnchorEl] = useState(null);

  const { data: unreadData } = useGetUnreadNotificationCountQuery(undefined, {
    pollingInterval: 10000, // Background refresh every 10s as fallback to Socket.IO
  });
  const unreadCount = unreadData?.data?.unreadCount || 0;

  // Notification hook to handle desktop permissions and real-time Socket.IO listeners
  useNotifications();

  const handleOpenNotifications = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseNotifications = () => {
    setAnchorEl(null);
  };

  return (
    <Box
      sx={{
        position: 'absolute',
        top: 16,
        right: 24,
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
      }}
    >
      {/* Notification Bell */}
      <NotificationBell
        unreadCount={unreadCount}
        onClick={handleOpenNotifications}
        isOpen={Boolean(anchorEl)}
      />

      {/* Notification Center Popover */}
      <NotificationCenter
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleCloseNotifications}
      />
    </Box>
  );
};

export default DashboardHeader;
