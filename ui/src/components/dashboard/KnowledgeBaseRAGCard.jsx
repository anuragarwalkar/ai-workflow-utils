import { useState } from 'react';
import { Box, Typography, TextField, Button, CircularProgress } from '@mui/material';
import { useSummarizeTextMutation, useSearchSummariesMutation } from '../../store/api/dashboardApi';
import { useAppTheme } from '../../theme/useAppTheme';

const mockIndexed = [];

const KnowledgeBaseRAGCard = ({ cardStyle }) => {
  const { isDark } = useAppTheme();
  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [summarizeText, { isLoading: isSummarizing }] = useSummarizeTextMutation();
  const [searchSummaries, { isLoading: isSearching, data: searchData }] = useSearchSummariesMutation();

  const handleIndex = async () => {
    if (!inputText.trim()) return;
    try {
      await summarizeText(inputText).unwrap();
      setInputText('');
    } catch (err) {
      console.error(err);
    }
  };

  const handleSearch = (e) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      searchSummaries({ query: searchQuery, limit: 3 });
    }
  };

  const searchResults = searchData?.data || [];

  return (
    <Box sx={{ ...cardStyle, p: 2 }}>
      <Typography variant="subtitle1" sx={{ fontWeight: 600, color: isDark ? '#f1f5f9' : '#0f172a', mb: 2 }}>
        Knowledge Base & RAG
      </Typography>

      <Box sx={{ flexGrow: 1, overflowY: 'auto', pr: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
        
        {/* Brain Dump */}
        <Box>
          <Typography variant="caption" sx={{ color: isDark ? '#f1f5f9' : '#334155', fontWeight: 600, mb: 0.5, display: 'block' }}>
            Input New Insights (Brain Dump)
          </Typography>
          <Box sx={{ position: 'relative' }}>
            <TextField
              fullWidth
              multiline
              rows={3}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              sx={{
                '& .MuiOutlinedInput-root': {
                  color: isDark ? '#94a3b8' : '#64748b',
                  bgcolor: isDark ? '#0f172a' : '#f8fafc',
                  border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)',
                  borderRadius: '8px',
                  '& fieldset': { border: 'none' },
                }
              }}
            />
            <Button 
              size="small"
              onClick={handleIndex}
              disabled={isSummarizing || !inputText.trim()}
              sx={{ 
                position: 'absolute', bottom: 8, right: 8, 
                bgcolor: '#00BFA5', color: 'white', 
                textTransform: 'none', borderRadius: '4px', minWidth: 60,
                '&:hover': { bgcolor: '#00a38c' },
                '&:disabled': { bgcolor: 'rgba(0,191,165,0.3)', color: 'rgba(255,255,255,0.5)' }
              }}
            >
              {isSummarizing ? <CircularProgress size={14} color="inherit" /> : 'Index'}
            </Button>
          </Box>
        </Box>

        {/* Semantic Search */}
        <Box>
          <Typography variant="caption" sx={{ color: isDark ? '#f1f5f9' : '#334155', fontWeight: 600, mb: 0.5, display: 'block' }}>
            Live Semantic Search
          </Typography>
          <TextField
            fullWidth
            size="small"
            placeholder="Placeholder: search authentication patterns..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearch}
            sx={{
              '& .MuiOutlinedInput-root': {
                color: isDark ? '#94a3b8' : '#64748b',
                bgcolor: isDark ? '#0f172a' : '#f8fafc',
                border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)',
                borderRadius: '8px',
                fontSize: '0.8rem',
                '& fieldset': { border: 'none' },
              }
            }}
          />
        </Box>

        {/* Results / Indexed */}
        <Box>
          <Typography variant="caption" sx={{ color: isDark ? '#f1f5f9' : '#334155', fontWeight: 600, mb: 0.5, display: 'block' }}>
            {searchResults.length > 0 ? 'Search Results' : 'Recent Insights Indexed'}
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {searchResults.length === 0 && (
              <Typography variant="caption" sx={{ color: '#64748b' }}>
                No recent insights indexed.
              </Typography>
            )}
            {searchResults.map((item, idx) => (
              <Typography key={idx} variant="caption" sx={{ color: '#94a3b8', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {typeof item === 'string' ? item : (item.summary || item.text)}
              </Typography>
            ))}
          </Box>
        </Box>

      </Box>
    </Box>
  );
};

export default KnowledgeBaseRAGCard;
