import { Box, Typography } from '@mui/material';
import { NavLink } from 'react-router-dom';
import {
  Dashboard as DashboardIcon,
  Reviews as ReviewsIcon,
  LibraryBooks as LibraryBooksIcon,
  Chat as ChatIcon,
  Schedule as ScheduleIcon,
  AutoAwesome as AiIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import { useAppTheme } from '../../theme/useAppTheme';

const navItems = [
  { label: 'Overview', path: '/ai-dashboard', icon: DashboardIcon, exact: true },
  { label: 'PR Reviews', path: '/ai-dashboard/pr-reviews', icon: ReviewsIcon },
  { label: 'Knowledge Base', path: '/ai-dashboard/knowledge-base', icon: LibraryBooksIcon },
  { label: 'Slack Activity', path: '/ai-dashboard/slack', icon: ChatIcon },
  { label: 'Task & Nag Queue', path: '/ai-dashboard/tasks', icon: ScheduleIcon },
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
          Anurag's AI Manager
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
      <Box sx={{ flexGrow: 1, p: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
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

      {/* Status Panel (Bottom) */}
      <Box sx={{ p: 2, borderTop: isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.05)' }}>
        <Box sx={{ p: 1.5, bgcolor: isDark ? 'rgba(0, 191, 165, 0.1)' : 'rgba(0, 191, 165, 0.05)', borderRadius: '8px', border: '1px solid rgba(0, 191, 165, 0.2)' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#00BFA5' }} />
            <Typography variant="caption" sx={{ color: isDark ? '#e2e8f0' : '#334155', fontWeight: 600 }}>LangGraph Status: Active</Typography>
          </Box>
          <Typography variant="caption" sx={{ display: 'block', color: '#64748b', ml: 2 }}>BullMQ: 3 Jobs</Typography>
          <Typography variant="caption" sx={{ display: 'block', color: '#64748b', ml: 2 }}>LanceDB: 1.2GB</Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default DashboardSidebar;
