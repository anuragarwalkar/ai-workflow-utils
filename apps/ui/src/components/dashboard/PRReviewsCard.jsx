import { Box, Typography, Avatar, Chip, Button } from '@mui/material';
import { useAppTheme } from '../../theme/useAppTheme';

const mockPrs = [];

const PRReviewsCard = ({ cardStyle }) => {
  const { isDark } = useAppTheme();
  
  return (
    <Box sx={{ ...cardStyle, p: 0 }}>
      {/* Header */}
      <Box sx={{ p: 2, pr: 5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.05)' }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, color: isDark ? '#f1f5f9' : '#0f172a' }}>PR Reviews</Typography>
      </Box>

      {/* Table Header */}
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 3fr 1.5fr 1fr 2fr 1.5fr', p: 1.5, borderBottom: isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.05)', color: '#64748b' }}>
        <Typography variant="caption" sx={{ fontWeight: 600 }}>Repo</Typography>
        <Typography variant="caption" sx={{ fontWeight: 600 }}>PR Title</Typography>
        <Typography variant="caption" sx={{ fontWeight: 600 }}>Assignee</Typography>
        <Typography variant="caption" sx={{ fontWeight: 600 }}>Priority</Typography>
        <Typography variant="caption" sx={{ fontWeight: 600 }}>AI Status</Typography>
        <Box></Box>
      </Box>

      {/* Table Body */}
      <Box sx={{ flexGrow: 1, overflowY: 'auto' }}>
        {mockPrs.length === 0 && (
          <Typography variant="caption" sx={{ color: '#64748b', textAlign: 'center', display: 'block', mt: 4 }}>
            No active PRs found.
          </Typography>
        )}
        {mockPrs.map((pr, i) => (
          <Box key={i} sx={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 3fr 1.5fr 1fr 2fr 1.5fr', 
            p: 1.5, 
            alignItems: 'center',
            borderBottom: isDark ? '1px solid rgba(255,255,255,0.02)' : '1px solid rgba(0,0,0,0.02)',
            '&:hover': { bgcolor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)' }
          }}>
            <Typography variant="body2" sx={{ color: '#94a3b8' }}>{pr.repo}</Typography>
            <Typography variant="body2" sx={{ color: isDark ? '#e2e8f0' : '#334155', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden', pr: 2 }}>
              {pr.title}
            </Typography>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Avatar src={pr.assignee.avatar} sx={{ width: 20, height: 20, fontSize: '0.7rem' }}>{pr.assignee.name.charAt(0)}</Avatar>
              <Typography variant="body2" sx={{ color: '#94a3b8' }}>{pr.assignee.name}</Typography>
            </Box>

            <Chip label={pr.priority} size="small" sx={{ 
              width: 'fit-content',
              bgcolor: pr.priority === 'P1' ? '#7f1d1d' : '#713f12', 
              color: pr.priority === 'P1' ? '#fca5a5' : '#fde047',
              fontWeight: 700, 
              fontSize: '0.65rem',
              height: 20
            }} />

            <Typography variant="body2" sx={{ 
              color: pr.isErrorStatus ? '#ef4444' : (pr.status.includes('Drafting') ? '#00BFA5' : '#94a3b8'),
              fontSize: '0.8rem'
            }}>
              {pr.status}
              {pr.status.includes('60%') && (
                <Box sx={{ width: '80%', height: 2, bgcolor: 'rgba(0,191,165,0.2)', mt: 0.5, borderRadius: 1 }}>
                  <Box sx={{ width: '60%', height: '100%', bgcolor: '#00BFA5', borderRadius: 1 }} />
                </Box>
              )}
            </Typography>

            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button 
                variant={pr.type === 'secondary' ? 'outlined' : 'contained'}
                size="small"
                sx={{ 
                  textTransform: 'none', 
                  fontSize: '0.7rem',
                  py: 0.25,
                  bgcolor: pr.type === 'primary' ? 'rgba(0, 191, 165, 0.2)' : (pr.type === 'error' ? 'rgba(239, 68, 68, 0.1)' : 'transparent'),
                  color: pr.type === 'primary' ? '#00BFA5' : (pr.type === 'error' ? '#ef4444' : '#94a3b8'),
                  borderColor: pr.type === 'secondary' ? 'rgba(148, 163, 184, 0.2)' : 'transparent',
                  '&:hover': {
                    bgcolor: pr.type === 'primary' ? 'rgba(0, 191, 165, 0.3)' : (pr.type === 'error' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(148, 163, 184, 0.1)')
                  }
                }}
              >
                {pr.action}
              </Button>
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export default PRReviewsCard;
