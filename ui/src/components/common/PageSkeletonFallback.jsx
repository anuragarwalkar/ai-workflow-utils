import React from 'react';
import { Box, Grid, Skeleton, Typography } from '@mui/material';
import { AutoAwesome as AutoAwesomeIcon, Psychology as PsychologyIcon } from '@mui/icons-material';
import { keyframes } from '@mui/system';
import { useAppTheme } from '../../theme/useAppTheme';
import RouteProgressBar from './RouteProgressBar';

const pulseGlow = keyframes`
  0%, 100% {
    opacity: 0.6;
    transform: scale(0.98);
  }
  50% {
    opacity: 1;
    transform: scale(1.02);
  }
`;

/**
 * Context-aware in-layout page skeleton fallback
 * Used when navigating between routes inside Layout without causing full-screen unmounts
 */
const PageSkeletonFallback = ({ title = 'Loading Module...' }) => {
  const { isDark } = useAppTheme();

  const skeletonBg = isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.05)';

  return (
    <Box sx={{ width: '100%', py: 2, px: { xs: 1, sm: 2 }, position: 'relative' }}>
      {/* Top glowing progress bar */}
      <RouteProgressBar />

      {/* Top Header Section Skeleton */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          mb: 4,
        }}
      >
        {/* Pulsing AI Badge */}
        <Box
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 1,
            px: 2,
            py: 0.75,
            borderRadius: '20px',
            background: isDark
              ? 'linear-gradient(135deg, rgba(102, 126, 234, 0.15) 0%, rgba(78, 205, 196, 0.15) 100%)'
              : 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
            border: isDark
              ? '1px solid rgba(78, 205, 196, 0.3)'
              : '1px solid rgba(102, 126, 234, 0.2)',
            animation: `${pulseGlow} 2s ease-in-out infinite`,
            mb: 2,
          }}
        >
          <PsychologyIcon sx={{ fontSize: 18, color: '#4ecdc4' }} />
          <Typography
            sx={{
              fontWeight: 600,
              background: 'linear-gradient(135deg, #667eea 0%, #4ecdc4 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
            variant="caption"
          >
            {title}
          </Typography>
          <AutoAwesomeIcon sx={{ fontSize: 14, color: '#f093fb' }} />
        </Box>

        <Skeleton
          height={38}
          sx={{ bgcolor: skeletonBg, borderRadius: '8px', mb: 1.5, minWidth: 200, maxWidth: 360 }}
          variant="rounded"
          width="40%"
        />
        <Skeleton
          height={22}
          sx={{ bgcolor: skeletonBg, minWidth: 260, maxWidth: 520 }}
          variant="text"
          width="60%"
        />
      </Box>

      {/* Main Content Grid Skeleton */}
      <Grid container spacing={3}>
        {/* Left / Main form or card area */}
        <Grid item md={8} xs={12}>
          <Box
            sx={{
              p: 3,
              borderRadius: '16px',
              border: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.06)',
              background: isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.01)',
            }}
          >
            <Skeleton height={24} sx={{ bgcolor: skeletonBg, mb: 2 }} variant="rounded" width="30%" />
            <Skeleton height={48} sx={{ bgcolor: skeletonBg, mb: 2.5, borderRadius: '8px' }} variant="rounded" width="100%" />
            <Skeleton height={24} sx={{ bgcolor: skeletonBg, mb: 2 }} variant="rounded" width="40%" />
            <Skeleton height={120} sx={{ bgcolor: skeletonBg, mb: 2.5, borderRadius: '8px' }} variant="rounded" width="100%" />
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 3 }}>
              <Skeleton height={38} sx={{ bgcolor: skeletonBg, borderRadius: '8px' }} variant="rounded" width={100} />
              <Skeleton height={38} sx={{ bgcolor: skeletonBg, borderRadius: '8px' }} variant="rounded" width={140} />
            </Box>
          </Box>
        </Grid>

        {/* Right / Sidebar helper card */}
        <Grid item md={4} xs={12}>
          <Box
            sx={{
              p: 3,
              borderRadius: '16px',
              border: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.06)',
              background: isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.01)',
            }}
          >
            <Skeleton height={24} sx={{ bgcolor: skeletonBg, mb: 2 }} variant="rounded" width="50%" />
            <Skeleton height={20} sx={{ bgcolor: skeletonBg, mb: 1.5 }} variant="rounded" width="100%" />
            <Skeleton height={20} sx={{ bgcolor: skeletonBg, mb: 1.5 }} variant="rounded" width="90%" />
            <Skeleton height={20} sx={{ bgcolor: skeletonBg, mb: 3 }} variant="rounded" width="75%" />
            <Skeleton height={80} sx={{ bgcolor: skeletonBg, borderRadius: '8px' }} variant="rounded" width="100%" />
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default PageSkeletonFallback;
