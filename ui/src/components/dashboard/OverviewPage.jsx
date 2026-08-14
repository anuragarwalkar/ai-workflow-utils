import { Box, Typography, CircularProgress, Grid } from '@mui/material';
import { useAppTheme } from '../../theme/useAppTheme';
import { useGetTileConfigQuery } from '../../store/api/dashboardApi';
import CommandBar from './CommandBar';
import NotesCard from './NotesCard';
import ReminderCard from './ReminderCard';
import TodoCard from './TodoCard';
import KnowledgeBaseRAGCard from './KnowledgeBaseRAGCard';
import PRReviewsCard from './PRReviewsCard';
import TaskTimelineCard from './TaskTimelineCard';
import PerformanceMetricsCard from './PerformanceMetricsCard';

const OverviewPage = () => {
  const { isDark } = useAppTheme();
  const { data: tileConfigResponse, isLoading } = useGetTileConfigQuery();

  const tiles = tileConfigResponse?.data || [];
  
  const getTileVisibility = (id) => {
    const tile = tiles.find(t => t.id === id);
    return tile ? tile.visible : false;
  };

  const baseCardStyle = {
    background: isDark ? '#1e293b' : '#ffffff',
    border: isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.05)',
    borderRadius: '16px',
    boxShadow: isDark ? '0 4px 6px -1px rgba(0, 0, 0, 0.2)' : '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <CircularProgress sx={{ color: '#7C3AED' }} />
      </Box>
    );
  }

  return (
    <Box sx={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      gap: 3,
    }}>
      <Box sx={{ px: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, color: isDark ? '#f8fafc' : '#0f172a', mb: 1 }}>
          Overview
        </Typography>
        <Typography variant="body2" sx={{ color: '#64748b', mb: 3 }}>
          Your AI command center. Capture, organize and act on information effortlessly.
        </Typography>
        <CommandBar />
      </Box>

      <Grid container spacing={3} sx={{ px: 2, flexGrow: 1, pb: 4 }}>
        {/* Left Column (60%) */}
        <Grid item xs={12} md={7} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {getTileVisibility('contextStream') && (
            <Box sx={{ height: 500 }}>
              <NotesCard cardStyle={baseCardStyle} />
            </Box>
          )}
          {getTileVisibility('knowledgeBase') && (
            <Box sx={{ height: 400 }}>
              <KnowledgeBaseRAGCard cardStyle={baseCardStyle} />
            </Box>
          )}
          {getTileVisibility('prReviews') && (
            <Box sx={{ height: 400 }}>
              <PRReviewsCard cardStyle={baseCardStyle} />
            </Box>
          )}
          {getTileVisibility('performanceMetrics') && (
            <Box sx={{ height: 350 }}>
              <PerformanceMetricsCard cardStyle={baseCardStyle} />
            </Box>
          )}
        </Grid>

        {/* Right Column (40%) */}
        <Grid item xs={12} md={5} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {getTileVisibility('reminders') && (
            <Box sx={{ height: 300 }}>
              <ReminderCard cardStyle={baseCardStyle} />
            </Box>
          )}
          
          {getTileVisibility('todos') && (
            <Box sx={{ height: 350 }}>
              <TodoCard cardStyle={baseCardStyle} />
            </Box>
          )}
          
          {getTileVisibility('taskTimeline') && (
            <Box sx={{ height: 350 }}>
              <TaskTimelineCard cardStyle={baseCardStyle} />
            </Box>
          )}
        </Grid>
      </Grid>
    </Box>
  );
};

export default OverviewPage;
