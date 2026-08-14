import { Box, Typography } from '@mui/material';
import { NavLink } from 'react-router-dom';
import {
  Dashboard as DashboardIcon,
  LibraryBooks as LibraryBooksIcon,
  Chat as ChatIcon,
  AutoAwesome as AiIcon,
  ArrowBack as ArrowBackIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import { useAppTheme } from '../../theme/useAppTheme';

const navItems = [
  { label: 'Overview', path: '/ai-dashboard', icon: DashboardIcon, exact: true },
  { label: 'Knowledge Base', path: '/ai-dashboard/knowledge-base', icon: LibraryBooksIcon },
  { label: 'Slack Activity', path: '/ai-dashboard/slack', icon: ChatIcon },
  { label: 'Manage', path: '/ai-dashboard/manage', icon: SettingsIcon },
];

const DashboardSidebar = () => {
  const { isDark } = useAppTheme();

  return (
    <Box sx={{
      width: 250,
      height: '100%',
      bgcolor: isDark ? '#0f172a' : '#f8fafc',
      borderRight: isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.05)',
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
    }}>
      {/* Brand Header */}
      <Box sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 1.5, borderBottom: isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.05)' }}>
        <AiIcon sx={{ color: '#00BFA5' }} />
        <Typography variant="h6" sx={{ fontWeight: 700, color: isDark ? '#f1f5f9' : '#0f172a', fontSize: '1.1rem' }}>
          AI Manager
        </Typography>
      </Box>

      <Box sx={{ p: 2 }}>
        <NavLink
          to="/"
          style={{ textDecoration: 'none' }}
        >
          <Box sx={{
            display: 'flex', alignItems: 'center', gap: 1.5, px: 2, py: 1.5, mb: 2,
            borderRadius: '8px',
            color: '#64748b',
            '&:hover': { bgcolor: 'rgba(100,116,139,0.1)' }
          }}>
            <ArrowBackIcon fontSize="small" />
            <Typography variant="body2" sx={{ fontWeight: 500 }}>Back to Home</Typography>
          </Box>
        </NavLink>
      </Box>

      {/* Nav Links */}
      <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.exact}
              style={({ isActive }) => ({
                textDecoration: 'none',
                display: 'block',
                borderRadius: '8px',
                background: isActive ? (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)') : 'transparent',
                color: isActive ? (isDark ? '#f8fafc' : '#0f172a') : '#64748b',
              })}
            >
              <Box sx={{
                display: 'flex', alignItems: 'center', gap: 1.5, px: 2, py: 1.5,
                '&:hover': {
                  bgcolor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
                  borderRadius: '8px',
                }
              }}>
                <Icon fontSize="small" sx={{ color: 'inherit' }} />
                <Typography variant="body2" sx={{ fontWeight: 500 }}>{item.label}</Typography>
              </Box>
            </NavLink>
          );
        })}
      </Box>

      <Box sx={{ flexGrow: 1 }} />
    </Box>
  );
};

export default DashboardSidebar;
