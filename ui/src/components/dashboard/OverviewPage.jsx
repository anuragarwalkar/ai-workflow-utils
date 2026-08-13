import { Box } from '@mui/material';
import PRReviewsCard from './PRReviewsCard';
import KnowledgeBaseRAGCard from './KnowledgeBaseRAGCard';
import SlackShieldCard from './SlackShieldCard';
import TaskTimelineCard from './TaskTimelineCard';
import PerformanceMetricsCard from './PerformanceMetricsCard';
import { useAppTheme } from '../../theme/useAppTheme';

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
      display: 'grid',
      gridTemplateColumns: 'repeat(12, 1fr)',
      gridTemplateRows: 'minmax(400px, auto) minmax(250px, auto)',
      gap: 2,
      height: '100%',
    }}>
      {/* Top Row */}
      <Box sx={{ gridColumn: 'span 6', height: '100%' }}>
        <PRReviewsCard cardStyle={baseCardStyle} />
      </Box>
      <Box sx={{ gridColumn: 'span 3', height: '100%' }}>
        <KnowledgeBaseRAGCard cardStyle={baseCardStyle} />
      </Box>
      <Box sx={{ gridColumn: 'span 3', height: '100%' }}>
        <SlackShieldCard cardStyle={baseCardStyle} />
      </Box>

      {/* Bottom Row */}
      <Box sx={{ gridColumn: 'span 8', height: '100%' }}>
        <TaskTimelineCard cardStyle={baseCardStyle} />
      </Box>
      <Box sx={{ gridColumn: 'span 4', height: '100%' }}>
        <PerformanceMetricsCard cardStyle={baseCardStyle} />
      </Box>
    </Box>
  );
};

export default OverviewPage;
