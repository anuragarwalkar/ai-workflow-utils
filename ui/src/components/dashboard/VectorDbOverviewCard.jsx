import React, { useState } from 'react';
import {
  Box,
  Typography,
  Chip,
  TextField,
  InputAdornment,
  IconButton,
  Button,
  CircularProgress,
} from '@mui/material';
import {
  Storage as StorageIcon,
  Search as SearchIcon,
  ArrowForward as ArrowForwardIcon,
  Memory as MemoryIcon,
  Dataset as DatasetIcon,
  FlashOn as FlashIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAppTheme } from '../../theme/useAppTheme';
import { useGetLanceDbStatsQuery, useSearchLanceDbMutation } from '../../store/api/dashboardApi';

const VectorDbOverviewCard = ({ cardStyle }) => {
  const { isDark } = useAppTheme();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const { data: statsData, isLoading: isStatsLoading } = useGetLanceDbStatsQuery();
  const [searchLanceDb, { data: searchData, isLoading: isSearching }] = useSearchLanceDbMutation();

  const stats = statsData?.data || {};
  const recentRecords = stats.recentRecords || [];
  const searchResults = searchData?.data?.results || [];

  const handleSearch = (e) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      searchLanceDb({ query: searchQuery.trim(), limit: 3 });
    }
  };

  return (
    <Box sx={{ ...cardStyle, p: 2.5, minHeight: 340, height: '100%', display: 'flex', flexDirection: 'column' }}>
      
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, pr: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{ p: 0.75, borderRadius: '8px', bgcolor: 'rgba(0,191,165,0.1)', color: '#00BFA5' }}>
            <StorageIcon fontSize="small" />
          </Box>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: isDark ? '#f1f5f9' : '#0f172a', lineHeight: 1.2 }}>
              Vector DB
            </Typography>
            <Typography variant="caption" sx={{ color: isDark ? '#94a3b8' : '#64748b' }}>
              LanceDB Embedded Engine
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
          <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: '#10B981', boxShadow: '0 0 6px #10B981' }} />
          <Typography variant="caption" sx={{ color: '#10B981', fontWeight: 600, fontSize: '0.75rem' }}>
            Online
          </Typography>
        </Box>
      </Box>

      {/* Mini Stats Bar */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 1.5,
          mb: 2,
          p: 1.5,
          borderRadius: '12px',
          bgcolor: isDark ? 'rgba(15,23,42,0.6)' : 'rgba(241,245,249,0.7)',
          border: isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.05)',
        }}
      >
        <Box>
          <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.7rem', display: 'block' }}>
            VECTORS
          </Typography>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: isDark ? '#f8fafc' : '#0f172a' }}>
            {isStatsLoading ? '...' : stats.totalRecords ?? 0}
          </Typography>
        </Box>
        <Box>
          <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.7rem', display: 'block' }}>
            DIMENSION
          </Typography>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: isDark ? '#f8fafc' : '#0f172a' }}>
            {stats.embeddingInfo?.dimension || 1536}d
          </Typography>
        </Box>
        <Box>
          <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.7rem', display: 'block' }}>
            DISK SIZE
          </Typography>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: isDark ? '#f8fafc' : '#0f172a' }}>
            {stats.diskSizeFormatted || '256 KB'}
          </Typography>
        </Box>
      </Box>

      {/* Search Input */}
      <Box sx={{ mb: 2 }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Quick vector query (press Enter)..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={handleSearch}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" sx={{ color: '#00BFA5' }} />
              </InputAdornment>
            ),
            endAdornment: isSearching && (
              <InputAdornment position="end">
                <CircularProgress size={14} sx={{ color: '#00BFA5' }} />
              </InputAdornment>
            ),
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              bgcolor: isDark ? '#0f172a' : '#ffffff',
              borderRadius: '10px',
              fontSize: '0.85rem',
              '& fieldset': { borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)' },
              '&:hover fieldset': { borderColor: '#00BFA5' },
            },
          }}
        />
      </Box>

      {/* Recent Vectors / Search Results list */}
      <Box sx={{ flexGrow: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 1, pr: 0.5, mb: 2 }}>
        <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          {searchResults.length > 0 ? `Matches for "${searchQuery}"` : 'Indexed Vector Memory'}
        </Typography>

        {searchResults.length > 0 ? (
          searchResults.map((item, idx) => (
            <Box
              key={idx}
              sx={{
                p: 1.25,
                borderRadius: '8px',
                bgcolor: isDark ? 'rgba(0,191,165,0.06)' : 'rgba(0,191,165,0.03)',
                border: '1px solid rgba(0,191,165,0.2)',
                display: 'flex',
                flexDirection: 'column',
                gap: 0.5,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Chip label={item.type || 'note'} size="small" sx={{ height: 18, fontSize: '0.65rem', textTransform: 'capitalize' }} />
                <Typography variant="caption" sx={{ color: '#00BFA5', fontWeight: 700 }}>
                  {item.similarityScore}% match
                </Typography>
              </Box>
              <Typography variant="caption" sx={{ color: isDark ? '#cbd5e1' : '#334155', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {item.text}
              </Typography>
            </Box>
          ))
        ) : recentRecords.length > 0 ? (
          recentRecords.slice(0, 3).map((item, idx) => (
            <Box
              key={idx}
              sx={{
                p: 1.25,
                borderRadius: '8px',
                bgcolor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
                border: isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.05)',
                display: 'flex',
                flexDirection: 'column',
                gap: 0.5,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Chip label={item.type || 'note'} size="small" sx={{ height: 18, fontSize: '0.65rem', textTransform: 'capitalize' }} />
                <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.68rem', fontFamily: 'monospace' }}>
                  {item.id ? `${item.id.substring(0, 8)}...` : ''}
                </Typography>
              </Box>
              <Typography variant="caption" sx={{ color: isDark ? '#94a3b8' : '#64748b', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {item.text}
              </Typography>
            </Box>
          ))
        ) : (
          <Typography variant="caption" sx={{ color: '#64748b', py: 2, textAlign: 'center' }}>
            No vectors indexed yet.
          </Typography>
        )}
      </Box>

      {/* Footer link to full dashboard */}
      <Box sx={{ pt: 1, borderTop: isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.05)' }}>
        <Button
          fullWidth
          size="small"
          onClick={() => navigate('/ai-dashboard/vector-db')}
          endIcon={<ArrowForwardIcon sx={{ fontSize: '1rem !important' }} />}
          sx={{
            textTransform: 'none',
            color: '#00BFA5',
            fontWeight: 600,
            fontSize: '0.8125rem',
            py: 0.5,
            justifyContent: 'space-between',
            px: 1,
            '&:hover': { bgcolor: 'rgba(0,191,165,0.08)' },
          }}
        >
          Open Vector DB Explorer
        </Button>
      </Box>
    </Box>
  );
};

export default VectorDbOverviewCard;
