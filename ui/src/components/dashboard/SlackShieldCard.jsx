import { Box, Typography, IconButton, CircularProgress, Chip, Avatar } from '@mui/material';
import { Refresh as RefreshIcon, Send as SendIcon } from '@mui/icons-material';
import { useGetSlackItemsQuery } from '../../store/api/dashboardApi';
import { useAppTheme } from '../../theme/useAppTheme';

const SlackShieldCard = ({ cardStyle }) => {
  const { isDark } = useAppTheme();
  const { data: slackResponse, isLoading, isFetching, refetch } = useGetSlackItemsQuery(undefined, { pollingInterval: 60000 });

  const items = slackResponse?.data || [];

  return (
    <Box sx={{ ...cardStyle, p: 2 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, color: isDark ? '#f1f5f9' : '#0f172a' }}>
          Slack Integration
        </Typography>
      </Box>

      {/* Sub-header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, borderBottom: isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.05)', pb: 1 }}>
        <Typography variant="caption" sx={{ color: isDark ? '#f1f5f9' : '#334155', fontWeight: 600 }}>Live Messages</Typography>
        <IconButton onClick={refetch} disabled={isLoading || isFetching} size="small" sx={{ color: '#00BFA5' }}>
          {(isLoading || isFetching) ? <CircularProgress size={14} color="inherit" /> : <RefreshIcon fontSize="small" />}
        </IconButton>
      </Box>

      {/* Message List */}
      <Box sx={{ flexGrow: 1, overflowY: 'auto', pr: 1, display: 'flex', flexDirection: 'column', gap: 1.5,
        '&::-webkit-scrollbar': { width: '4px' }, 
        '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(0,191,165,0.2)', borderRadius: '4px' }
      }}>
        {items.length === 0 && !isLoading && (
          <Typography variant="caption" sx={{ color: '#64748b', textAlign: 'center', mt: 4 }}>
            No new messages found.
          </Typography>
        )}

        {/* Real Items */}
        {items.map((item, i) => (
          <Box key={item.id + i} sx={{ 
            p: 1.5, 
            bgcolor: isDark ? 'rgba(0, 191, 165, 0.05)' : 'rgba(0, 191, 165, 0.02)', 
            border: isDark ? '1px solid rgba(0, 191, 165, 0.1)' : '1px solid rgba(0, 191, 165, 0.2)',
            borderRadius: '8px' 
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Chip label={item.channelId} size="small" sx={{ height: 20, fontSize: '0.65rem', bgcolor: 'rgba(0,191,165,0.1)', color: '#00BFA5', fontWeight: 600 }} />
              <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.65rem' }}>
                {new Date(parseFloat(item.ts) * 1000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
              </Typography>
            </Box>
            <Typography variant="caption" sx={{ color: isDark ? '#e2e8f0' : '#334155', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              {item.text}
            </Typography>
          </Box>
        ))}

      </Box>

      {/* Input area */}
      <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1, p: 1, bgcolor: isDark ? '#0f172a' : '#f8fafc', borderRadius: '8px', border: isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.05)' }}>
        <Typography variant="caption" sx={{ color: '#64748b', flexGrow: 1, px: 1 }}>Filtered messages</Typography>
        <SendIcon sx={{ color: '#64748b', fontSize: 16 }} />
      </Box>
    </Box>
  );
};

export default SlackShieldCard;
