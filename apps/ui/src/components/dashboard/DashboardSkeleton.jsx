import React from 'react';
import { Box, Card, CardContent, Grid, Skeleton } from '@mui/material';
import { useAppTheme } from '../../theme/useAppTheme';
import RouteProgressBar from '../common/RouteProgressBar';

export const DashboardSkeleton = () => {
  const { isDark } = useAppTheme();

  const skeletonBg = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)';

  const cardStyle = {
    height: '100%',
    minHeight: '380px',
    background: isDark ? 'rgba(15, 23, 42, 0.75)' : 'rgba(255, 255, 255, 0.85)',
    backdropFilter: 'blur(20px)',
    border: isDark ? '1px solid rgba(0, 191, 165, 0.15)' : '1px solid rgba(0, 0, 0, 0.08)',
    borderRadius: '16px',
    boxShadow: isDark ? '0 8px 32px rgba(0, 0, 0, 0.3)' : '0 8px 24px rgba(0, 0, 0, 0.05)',
  };

  return (
    <Box sx={{ p: 2, width: '100%', position: 'relative' }}>
      {/* Top progress indicator */}
      <RouteProgressBar />

      {/* Header bar skeleton */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Skeleton
            height={36}
            sx={{ bgcolor: skeletonBg, borderRadius: '6px' }}
            variant="text"
            width={240}
          />
          <Skeleton
            height={20}
            sx={{ bgcolor: skeletonBg, borderRadius: '4px', mt: 0.5 }}
            variant="text"
            width={340}
          />
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Skeleton height={36} sx={{ bgcolor: skeletonBg, borderRadius: '8px' }} variant="rounded" width={110} />
          <Skeleton height={36} sx={{ bgcolor: skeletonBg, borderRadius: '50%' }} variant="rounded" width={36} />
        </Box>
      </Box>

      {/* Grid of Content Tiles Skeleton */}
      <Grid container spacing={3}>
        {[1, 2, 3].map((i) => (
          <Grid item key={i} md={4} xs={12}>
            <Card sx={cardStyle}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Skeleton height={28} sx={{ bgcolor: skeletonBg }} variant="text" width="55%" />
                  <Skeleton height={28} sx={{ bgcolor: skeletonBg }} variant="circular" width={28} />
                </Box>
                <Skeleton height={68} sx={{ mb: 2, bgcolor: skeletonBg, borderRadius: '10px' }} variant="rounded" />
                <Skeleton height={68} sx={{ mb: 2, bgcolor: skeletonBg, borderRadius: '10px' }} variant="rounded" />
                <Skeleton height={68} sx={{ bgcolor: skeletonBg, borderRadius: '10px' }} variant="rounded" />
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default DashboardSkeleton;
