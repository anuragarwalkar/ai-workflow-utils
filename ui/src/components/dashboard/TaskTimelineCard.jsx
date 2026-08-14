import { Box, Typography } from '@mui/material';
import { useAppTheme } from '../../theme/useAppTheme';

const TaskTimelineCard = ({ cardStyle }) => {
  const { isDark } = useAppTheme();

  return (
    <Box sx={{ ...cardStyle, p: 0 }}>
      {/* Header */}
      <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.05)' }}>
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, color: isDark ? '#f1f5f9' : '#0f172a' }}>
            Task & Nagging Queue
          </Typography>
          <Typography variant="caption" sx={{ color: '#64748b' }}>
            Delayed Jobs managed in managed by BullMQ
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Box sx={{ px: 2, py: 0.5, borderRadius: '4px', border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)', fontSize: '0.7rem', color: '#94a3b8' }}>Upcoming Jobs</Box>
          <Box sx={{ px: 2, py: 0.5, borderRadius: '4px', border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)', fontSize: '0.7rem', color: '#94a3b8' }}>Delayed Views</Box>
        </Box>
      </Box>

      {/* Timeline Grid */}
      <Box sx={{ flexGrow: 1, p: 2, display: 'flex', flexDirection: 'column', position: 'relative' }}>
        {/* Time Axis */}
        <Box sx={{ display: 'flex', borderBottom: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)', pb: 1, mb: 2 }}>
          <Typography variant="caption" sx={{ width: 120, fontWeight: 600, color: isDark ? '#f1f5f9' : '#334155' }}>Timeline</Typography>
          <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'space-between', px: 2, color: '#64748b' }}>
            <Typography variant="caption">1:00</Typography>
            <Typography variant="caption">12:30</Typography>
            <Typography variant="caption">13:30</Typography>
            <Typography variant="caption">14:30</Typography>
            <Typography variant="caption">15:00</Typography>
            <Typography variant="caption">16:00</Typography>
          </Box>
        </Box>

        {/* Current Time Indicator line */}
        <Box sx={{ position: 'absolute', top: 32, bottom: 16, left: '42%', width: 1, bgcolor: '#ef4444', zIndex: 0 }}>
          <Box sx={{ position: 'absolute', top: -4, left: -3, width: 7, height: 7, borderRadius: '50%', bgcolor: '#ef4444' }} />
        </Box>

        {/* Rows */}
        <Box sx={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          
          {/* Row 1 */}
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="caption" sx={{ width: 120, color: '#94a3b8' }}>Upcoming nags <Typography component="span" sx={{ color: '#64748b', fontSize: '0.65rem' }}>4.5 nith</Typography></Typography>
            <Box sx={{ flexGrow: 1, position: 'relative', height: 24 }}>
              <Box sx={{ position: 'absolute', left: '15%', width: '30%', height: '100%', bgcolor: 'rgba(51, 65, 85, 0.5)', borderRadius: '4px', display: 'flex', alignItems: 'center', px: 1 }}>
                <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.65rem' }}>Upcoming Nags (Delayed nags)</Typography>
              </Box>
            </Box>
          </Box>

          {/* Row 2 */}
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="caption" sx={{ width: 120, color: '#94a3b8' }}>Upcoming nags <Typography component="span" sx={{ color: '#64748b', fontSize: '0.65rem' }}>2.5 nth</Typography></Typography>
            <Box sx={{ flexGrow: 1, position: 'relative', height: 24 }}>
              <Box sx={{ position: 'absolute', left: '35%', width: '40%', height: '100%', bgcolor: 'rgba(51, 65, 85, 0.5)', borderRadius: '4px', display: 'flex', alignItems: 'center', px: 1 }}>
                <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.65rem' }}>Awaiting Your Approval (Exeter nags)</Typography>
              </Box>
            </Box>
          </Box>

          {/* Row 3 */}
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="caption" sx={{ width: 120, color: '#94a3b8' }}>Automated Checks <Typography component="span" sx={{ color: '#64748b', fontSize: '0.65rem' }}>1th</Typography></Typography>
            <Box sx={{ flexGrow: 1, position: 'relative', height: 24 }}>
              <Box sx={{ position: 'absolute', left: '42%', width: '50%', height: '100%', bgcolor: 'rgba(51, 65, 85, 0.5)', borderRadius: '4px', display: 'flex', alignItems: 'center', px: 1 }}>
                <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.65rem' }}>Automated Checks (Autorate nags)</Typography>
              </Box>
            </Box>
          </Box>

        </Box>
      </Box>
    </Box>
  );
};

export default TaskTimelineCard;
