import { Box, Card, CardContent, Grid, Skeleton, Typography } from '@mui/material';

export const DashboardSkeleton = () => {
  const cardStyle = {
    height: '100%',
    minHeight: '400px',
    background: 'rgba(13, 20, 40, 0.85)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(0, 191, 165, 0.15)',
    borderRadius: '16px',
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Skeleton variant="text" width={300} height={40} sx={{ mx: 'auto', bgcolor: 'rgba(255,255,255,0.1)' }} />
        <Skeleton variant="text" width={400} height={20} sx={{ mx: 'auto', bgcolor: 'rgba(255,255,255,0.1)' }} />
      </Box>
      <Grid container spacing={3}>
        {[1, 2, 3].map(i => (
          <Grid item xs={12} md={4} key={i}>
            <Card sx={cardStyle}>
              <CardContent>
                <Skeleton variant="text" width="50%" height={32} sx={{ mb: 3, bgcolor: 'rgba(255,255,255,0.1)' }} />
                <Skeleton variant="rounded" height={60} sx={{ mb: 2, bgcolor: 'rgba(255,255,255,0.1)' }} />
                <Skeleton variant="rounded" height={60} sx={{ mb: 2, bgcolor: 'rgba(255,255,255,0.1)' }} />
                <Skeleton variant="rounded" height={60} sx={{ bgcolor: 'rgba(255,255,255,0.1)' }} />
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default DashboardSkeleton;
