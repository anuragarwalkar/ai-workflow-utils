import React, { useEffect, useState } from 'react';
import { Box, IconButton, Tooltip, Typography } from '@mui/material';
import { NavLink } from 'react-router-dom';
import {
  AutoAwesome as AiIcon,
  ArrowBack as ArrowBackIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Dashboard as DashboardIcon,
  EditNote as NotesIcon,
  Settings as SettingsIcon,
  Storage as StorageIcon,
} from '@mui/icons-material';
import { useAppTheme } from '../../theme/useAppTheme';
import { preloadRoute } from '../../routes/lazyComponents';

import { API_BASE_URL } from '../../config/environment.js';

const navItems = [
  { label: 'Overview', path: '/ai-dashboard', icon: DashboardIcon, exact: true },
  { label: 'AI Notes', path: '/ai-dashboard/notes', icon: NotesIcon },
  { label: 'Vector DB', path: '/ai-dashboard/vector-db', icon: StorageIcon },
  { label: 'Manage', path: '/ai-dashboard/manage', icon: SettingsIcon },
];

const DashboardSidebar = () => {
  const { isDark } = useAppTheme();

  const [isCollapsed, setIsCollapsed] = useState(true);

  // Clear legacy persisted expanded state so reload always defaults to collapsed
  useEffect(() => {
    try {
      localStorage.removeItem('dashboard_sidebar_collapsed');
    } catch {
      // Ignore
    }
  }, []);

  const toggleSidebar = () => {
    setIsCollapsed(prev => !prev);
  };

  const sidebarWidth = isCollapsed ? 72 : 250;

  return (
    <Box
      sx={{
        width: sidebarWidth,
        height: '100%',
        bgcolor: isDark ? '#0f172a' : '#f8fafc',
        borderRight: isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.05)',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        transition: 'width 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        overflowX: 'hidden',
      }}
    >
      {/* Brand Header */}
      <Box
        sx={{
          p: isCollapsed ? 2 : 3,
          display: 'flex',
          alignItems: 'center',
          justifyContent: isCollapsed ? 'center' : 'flex-start',
          gap: 1.5,
          borderBottom: isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.05)',
          minHeight: '73px',
          boxSizing: 'border-box',
        }}
      >
        <AiIcon sx={{ color: '#00BFA5', flexShrink: 0 }} />
        <Typography
          sx={{
            fontWeight: 700,
            color: isDark ? '#f1f5f9' : '#0f172a',
            fontSize: '1.1rem',
            whiteSpace: 'nowrap',
            opacity: isCollapsed ? 0 : 1,
            transition: 'opacity 0.2s',
            display: isCollapsed ? 'none' : 'block',
          }}
          variant='h6'
        >
          AI Manager
        </Typography>
      </Box>

      <Box
        sx={{
          p: isCollapsed ? 1 : 2,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'stretch',
        }}
      >
        <Tooltip placement='right' title={isCollapsed ? 'Back to Home' : ''}>
          <NavLink
            style={{
              textDecoration: 'none',
              display: 'block',
              width: '100%',
              marginBottom: '16px',
            }}
            to='/'
            onFocus={() => preloadRoute('/')}
            onMouseEnter={() => preloadRoute('/')}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: isCollapsed ? 'center' : 'flex-start',
                gap: 1.5,
                px: isCollapsed ? 0 : 2,
                py: 1.5,
                borderRadius: '8px',
                color: '#64748b',
                '&:hover': { bgcolor: 'rgba(100,116,139,0.1)' },
              }}
            >
              <ArrowBackIcon fontSize='small' sx={{ flexShrink: 0 }} />
              <Typography
                sx={{
                  fontWeight: 500,
                  whiteSpace: 'nowrap',
                  opacity: isCollapsed ? 0 : 1,
                  display: isCollapsed ? 'none' : 'block',
                }}
                variant='body2'
              >
                Back to Home
              </Typography>
            </Box>
          </NavLink>
        </Tooltip>

        {/* Nav Links */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, width: '100%' }}>
          {navItems.map(item => {
            const Icon = item.icon;
            const navItem = (
              <NavLink
                end={item.exact}
                key={item.path}
                style={({ isActive }) => ({
                  textDecoration: 'none',
                  display: 'block',
                  width: '100%',
                  boxSizing: 'border-box',
                  borderRadius: '8px',
                  background: isActive
                    ? isDark
                      ? 'rgba(255,255,255,0.1)'
                      : 'rgba(0,0,0,0.05)'
                    : 'transparent',
                  color: isActive ? (isDark ? '#f8fafc' : '#0f172a') : '#64748b',
                })}
                to={item.path}
                onFocus={() => preloadRoute(item.path)}
                onMouseEnter={() => preloadRoute(item.path)}
              >
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: isCollapsed ? 'center' : 'flex-start',
                    gap: 1.5,
                    px: isCollapsed ? 0 : 2,
                    py: 1.5,
                    '&:hover': {
                      bgcolor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
                      borderRadius: '8px',
                    },
                  }}
                >
                  <Icon fontSize='small' sx={{ color: 'inherit', flexShrink: 0 }} />
                  <Typography
                    sx={{
                      fontWeight: 500,
                      whiteSpace: 'nowrap',
                      opacity: isCollapsed ? 0 : 1,
                      display: isCollapsed ? 'none' : 'block',
                    }}
                    variant='body2'
                  >
                    {item.label}
                  </Typography>
                </Box>
              </NavLink>
            );

            return isCollapsed ? (
              <Tooltip key={item.path} placement='right' title={item.label}>
                {navItem}
              </Tooltip>
            ) : (
              navItem
            );
          })}
        </Box>
      </Box>

      <Box sx={{ flexGrow: 1 }} />

      {/* Collapse Toggle */}
      <Box
        sx={{
          p: 2,
          borderTop: isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.05)',
          display: 'flex',
          justifyContent: isCollapsed ? 'center' : 'flex-end',
        }}
      >
        <IconButton size='small' sx={{ color: '#64748b' }} onClick={toggleSidebar}>
          {isCollapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
        </IconButton>
      </Box>
    </Box>
  );
};

export default DashboardSidebar;
