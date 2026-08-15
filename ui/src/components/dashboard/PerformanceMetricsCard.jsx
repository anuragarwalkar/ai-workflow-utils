import { Box, Typography } from '@mui/material';
import { useAppTheme } from '../../theme/useAppTheme';

const PerformanceMetricsCard = ({ cardStyle }) => {
  const { isDark } = useAppTheme();

  return (
    <Box sx={{ ...cardStyle, p: 2 }}>
      <Typography variant="subtitle1" sx={{ fontWeight: 600, color: isDark ? '#f1f5f9' : '#0f172a', mb: 2, pr: 4 }}>
        Performance metrics
      </Typography>

      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, height: '100%' }}>
        
        {/* Chart 1 */}
        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
          <Typography variant="caption" sx={{ color: isDark ? '#f1f5f9' : '#334155', fontWeight: 600, mb: 1 }}>Avg. PR Turnaround Time</Typography>
          <Box sx={{ flexGrow: 1, position: 'relative', borderLeft: '1px solid rgba(255,255,255,0.1)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            {/* Y Axis Labels */}
            <Typography variant="caption" sx={{ position: 'absolute', left: -16, top: 0, fontSize: '0.6rem', color: '#64748b' }}>15</Typography>
            <Typography variant="caption" sx={{ position: 'absolute', left: -16, top: '50%', transform: 'translateY(-50%)', fontSize: '0.6rem', color: '#64748b' }}>8</Typography>
            <Typography variant="caption" sx={{ position: 'absolute', left: -12, bottom: 0, fontSize: '0.6rem', color: '#64748b' }}>0</Typography>
            
            {/* X Axis Labels */}
            <Typography variant="caption" sx={{ position: 'absolute', left: '20%', bottom: -18, fontSize: '0.6rem', color: '#64748b' }}>10</Typography>
            <Typography variant="caption" sx={{ position: 'absolute', left: '50%', bottom: -18, fontSize: '0.6rem', color: '#64748b' }}>20</Typography>
            <Typography variant="caption" sx={{ position: 'absolute', left: '80%', bottom: -18, fontSize: '0.6rem', color: '#64748b' }}>30</Typography>

            {/* SVG Graph */}
            <svg width="100%" height="100%" preserveAspectRatio="none" viewBox="0 0 100 100" style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
              <defs>
                <linearGradient id="grad1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#00BFA5" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#00BFA5" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              <polygon points="0,100 0,60 30,80 70,30 100,50 100,100" fill="url(#grad1)" />
              <polyline points="0,60 30,80 70,30 100,50" fill="none" stroke="#00BFA5" strokeWidth="2" vectorEffect="non-scaling-stroke" />
            </svg>
          </Box>
        </Box>

        {/* Chart 2 */}
        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
          <Typography variant="caption" sx={{ color: isDark ? '#f1f5f9' : '#334155', fontWeight: 600, mb: 1 }}>Questions Handled Autonomously</Typography>
          <Box sx={{ flexGrow: 1, position: 'relative', borderLeft: '1px solid rgba(255,255,255,0.1)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            {/* Y Axis Labels */}
            <Typography variant="caption" sx={{ position: 'absolute', left: -22, top: 0, fontSize: '0.6rem', color: '#64748b' }}>100</Typography>
            <Typography variant="caption" sx={{ position: 'absolute', left: -16, top: '50%', transform: 'translateY(-50%)', fontSize: '0.6rem', color: '#64748b' }}>50</Typography>
            <Typography variant="caption" sx={{ position: 'absolute', left: -12, bottom: 0, fontSize: '0.6rem', color: '#64748b' }}>0</Typography>
            
            {/* X Axis Labels */}
            <Typography variant="caption" sx={{ position: 'absolute', left: '20%', bottom: -18, fontSize: '0.6rem', color: '#64748b' }}>10</Typography>
            <Typography variant="caption" sx={{ position: 'absolute', left: '50%', bottom: -18, fontSize: '0.6rem', color: '#64748b' }}>20</Typography>
            <Typography variant="caption" sx={{ position: 'absolute', left: '80%', bottom: -18, fontSize: '0.6rem', color: '#64748b' }}>30</Typography>

            {/* SVG Graph */}
            <svg width="100%" height="100%" preserveAspectRatio="none" viewBox="0 0 100 100" style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
              <defs>
                <linearGradient id="grad2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#00BFA5" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#00BFA5" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              <polygon points="0,100 0,90 30,50 60,60 100,20 100,100" fill="url(#grad2)" />
              <polyline points="0,90 30,50 60,60 100,20" fill="none" stroke="#00BFA5" strokeWidth="2" vectorEffect="non-scaling-stroke" />
              {/* Star icon mapped at (80, 40) approx */}
              <circle cx="85" cy="40" r="2" fill="#fff" opacity="0.8" />
              <polygon points="85,32 87,38 93,40 87,42 85,48 83,42 77,40 83,38" fill="rgba(255,255,255,0.2)" />
            </svg>
          </Box>
        </Box>

      </Box>
    </Box>
  );
};

export default PerformanceMetricsCard;
