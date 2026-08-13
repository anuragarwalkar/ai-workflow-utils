import { Box, Card, CardContent, Typography, Avatar, Chip, IconButton, Badge, CircularProgress, Link } from '@mui/material';
import { Refresh as RefreshIcon, Comment as CommentIcon, Settings as SettingsIcon } from '@mui/icons-material';
import { useGetSlackItemsQuery } from '../../store/api/dashboardApi';
import { useNavigate } from 'react-router-dom';

const OverviewCard = ({ cardStyle }) => {
  const { data: slackResponse, isLoading, isFetching, refetch } = useGetSlackItemsQuery(undefined, { pollingInterval: 60000 });
  const navigate = useNavigate();

  const items = slackResponse?.data || [];

  return (
    <Card sx={cardStyle}>
      <CardContent sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="h6" sx={{ color: '#E8EDF5', fontWeight: 600 }}>
              Slack Overview
            </Typography>
            <Badge badgeContent={items.length} color="secondary" sx={{ '& .MuiBadge-badge': { bgcolor: '#7C3AED' } }} />
          </Box>
          <Box>
            <IconButton onClick={() => navigate('/settings')} size="small" sx={{ color: 'rgba(232, 237, 245, 0.5)', mr: 1 }}>
              <SettingsIcon fontSize="small" />
            </IconButton>
            <IconButton onClick={refetch} disabled={isLoading || isFetching} size="small" sx={{ color: '#00BFA5' }}>
              {(isLoading || isFetching) ? <CircularProgress size={20} color="inherit" /> : <RefreshIcon fontSize="small" />}
            </IconButton>
          </Box>
        </Box>

        <Box sx={{ flexGrow: 1, overflowY: 'auto', pr: 1, '&::-webkit-scrollbar': { width: '4px' }, '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(0,191,165,0.2)', borderRadius: '4px' } }}>
          {items.length === 0 && !isLoading && (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#8899BB' }}>
              <Typography variant="body2" sx={{ mb: 1 }}>No new messages found.</Typography>
              <Typography variant="caption">Check your Slack integration in Settings.</Typography>
            </Box>
          )}
          
          {items.map((item, i) => (
            <Box key={item.id + i} sx={{ 
              p: 2, 
              mb: 2, 
              borderRadius: '12px', 
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              transition: 'all 0.2s',
              '&:hover': {
                background: 'rgba(255, 255, 255, 0.06)',
                transform: 'translateX(4px)'
              }
            }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Avatar sx={{ width: 24, height: 24, bgcolor: '#7C3AED', fontSize: '0.75rem' }}>
                    <CommentIcon sx={{ fontSize: '0.85rem' }} />
                  </Avatar>
                  <Typography variant="caption" sx={{ color: '#00BFA5', fontWeight: 500 }}>
                    {item.channelId}
                  </Typography>
                </Box>
                <Typography variant="caption" sx={{ color: '#8899BB' }}>
                  {new Date(parseFloat(item.ts) * 1000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ color: '#E8EDF5', opacity: 0.9, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {item.text}
              </Typography>
            </Box>
          ))}
        </Box>
      </CardContent>
    </Card>
  );
};

export default OverviewCard;
