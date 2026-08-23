import { Box, Typography, Switch, CircularProgress, Paper } from '@mui/material';
import { SettingsSuggest as SettingsIcon } from '@mui/icons-material';
import { useAppTheme } from '../../theme/useAppTheme';
import { useGetTileConfigQuery, useUpdateTileConfigMutation } from '../../store/api/dashboardApi';

const ManagePage = () => {
  const { isDark } = useAppTheme();
  const { data: tileConfigResponse, isLoading } = useGetTileConfigQuery();
  const [updateTileConfig] = useUpdateTileConfigMutation();

  const tiles = tileConfigResponse?.data || [];

  const handleToggleTile = (id, currentVisible) => {
    const updatedTiles = tiles.map(t => 
      t.id === id ? { ...t, visible: !currentVisible } : t
    );
    updateTileConfig(updatedTiles);
  };

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h5" sx={{ fontWeight: 700, color: isDark ? '#f8fafc' : '#0f172a', mb: 1 }}>
        Manage Dashboard
      </Typography>
      <Typography variant="body2" sx={{ color: '#64748b', mb: 4 }}>
        Configure your dashboard tiles and preferences.
      </Typography>

      <Paper sx={{
        background: isDark ? '#1e293b' : '#ffffff',
        border: isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.05)',
        borderRadius: '16px',
        boxShadow: isDark ? '0 4px 6px -1px rgba(0, 0, 0, 0.2)' : '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
        p: 3,
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
          <SettingsIcon sx={{ fontSize: 24, color: '#7C3AED' }} />
          <Typography variant="h6" sx={{ fontWeight: 600, color: isDark ? '#f1f5f9' : '#0f172a' }}>
            Dashboard Tiles
          </Typography>
        </Box>

        <Typography variant="body2" sx={{ color: '#64748b', mb: 3 }}>
          Toggle tiles on or off to customize your dashboard overview.
        </Typography>

        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress sx={{ color: '#7C3AED' }} />
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {tiles.slice().sort((a, b) => a.order - b.order).map(tile => (
              <Box
                key={tile.id}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  p: 2,
                  borderRadius: '8px',
                  bgcolor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
                  border: isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.05)',
                  '&:hover': {
                    bgcolor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                  },
                }}
              >
                <Typography
                  variant="body1"
                  sx={{
                    color: isDark ? '#f1f5f9' : '#0f172a',
                    fontWeight: 500,
                  }}
                >
                  {tile.label}
                </Typography>
                <Switch
                  checked={tile.visible}
                  onChange={() => handleToggleTile(tile.id, tile.visible)}
                  sx={{
                    '& .MuiSwitch-switchBase.Mui-checked': { color: '#7C3AED' },
                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: '#7C3AED' },
                  }}
                />
              </Box>
            ))}
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default ManagePage;
