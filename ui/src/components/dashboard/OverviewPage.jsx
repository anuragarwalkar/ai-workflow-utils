import { Box, Typography } from '@mui/material';
import { useAppTheme } from '../../theme/useAppTheme';
import { DashboardCustomize as DashboardCustomizeIcon } from '@mui/icons-material';

const OverviewPage = () => {
  const { isDark } = useAppTheme();

  const baseCardStyle = {
    background: isDark ? '#1e293b' : '#ffffff',
    border: isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.05)',
    borderRadius: '12px',
    boxShadow: isDark ? 'none' : '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
  };

  return (
    <Box sx={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
      color: isDark ? '#64748b' : '#94a3b8',
      gap: 2,
    }}>
      <DashboardCustomizeIcon sx={{ fontSize: 64, opacity: 0.5 }} />
      <Typography variant="h6" sx={{ fontWeight: 600 }}>
        Your Dashboard is Empty
      </Typography>
      <Typography variant="body2" sx={{ opacity: 0.8 }}>
        Customizable tiles and drag-and-drop support coming soon.
      </Typography>
    </Box>
  );
};

export default OverviewPage;
