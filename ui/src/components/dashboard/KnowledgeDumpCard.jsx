import { useState } from 'react';
import { Box, Card, CardContent, Typography, TextField, Button, CircularProgress, IconButton, InputAdornment, Divider } from '@mui/material';
import { AutoAwesome as AiIcon, Search as SearchIcon, ContentCopy as CopyIcon } from '@mui/icons-material';
import { useSummarizeTextMutation, useSearchSummariesMutation } from '../../store/api/dashboardApi';
import { motion, AnimatePresence } from 'framer-motion';

const KnowledgeDumpCard = ({ cardStyle }) => {
  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [latestSummary, setLatestSummary] = useState(null);

  const [summarizeText, { isLoading: isSummarizing }] = useSummarizeTextMutation();
  const [searchSummaries, { isLoading: isSearching }] = useSearchSummariesMutation();

  const handleSummarize = async () => {
    if (!inputText.trim()) return;
    try {
      const response = await summarizeText(inputText).unwrap();
      if (response.success) {
        setLatestSummary(response.data.summary);
        setInputText(''); // clear input
      }
    } catch (err) {
      console.error('Summarize failed', err);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    try {
      const response = await searchSummaries({ query: searchQuery, limit: 3 }).unwrap();
      if (response.success) {
        setSearchResults(response.data);
      }
    } catch (err) {
      console.error('Search failed', err);
    }
  };

  return (
    <Card sx={cardStyle}>
      <CardContent sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
          <Typography variant="h6" sx={{ color: '#E8EDF5', fontWeight: 600 }}>
            Knowledge Dump
          </Typography>
          <AiIcon sx={{ color: '#7C3AED', fontSize: 20 }} />
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, flexGrow: 1, overflowY: 'auto', pr: 1, '&::-webkit-scrollbar': { width: '4px' }, '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(124, 58, 237, 0.2)', borderRadius: '4px' } }}>
          
          {/* Summarize Section */}
          <Box>
            <TextField
              fullWidth
              multiline
              rows={3}
              placeholder="Paste large text, logs, or notes here to summarize & store..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              disabled={isSummarizing}
              sx={{
                mb: 1,
                '& .MuiOutlinedInput-root': {
                  color: '#E8EDF5',
                  bgcolor: 'rgba(255,255,255,0.02)',
                  borderRadius: '12px',
                  '& fieldset': { borderColor: 'rgba(124, 58, 237, 0.2)' },
                  '&:hover fieldset': { borderColor: 'rgba(124, 58, 237, 0.4)' },
                  '&.Mui-focused fieldset': { borderColor: '#7C3AED' },
                }
              }}
            />
            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button 
                variant="contained" 
                onClick={handleSummarize}
                disabled={isSummarizing || !inputText.trim()}
                sx={{ 
                  bgcolor: '#7C3AED', 
                  color: 'white',
                  borderRadius: '8px',
                  textTransform: 'none',
                  '&:hover': { bgcolor: '#6D28D9' }
                }}
                startIcon={isSummarizing ? <CircularProgress size={16} color="inherit" /> : <AiIcon />}
              >
                Summarize & Store
              </Button>
            </Box>
          </Box>

          <AnimatePresence>
            {latestSummary && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                <Box sx={{ p: 2, bgcolor: 'rgba(124, 58, 237, 0.1)', borderRadius: '12px', border: '1px solid rgba(124, 58, 237, 0.2)', mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ color: '#7C3AED', mb: 1, fontWeight: 600 }}>Latest Summary (Stored ✓)</Typography>
                  <Typography variant="body2" sx={{ color: '#E8EDF5', whiteSpace: 'pre-line' }}>{latestSummary}</Typography>
                </Box>
              </motion.div>
            )}
          </AnimatePresence>

          <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)', my: 1 }} />

          {/* Search Section */}
          <Box component="form" onSubmit={handleSearch}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search past memories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: 'rgba(255,255,255,0.3)' }} />
                  </InputAdornment>
                ),
                endAdornment: isSearching && (
                  <InputAdornment position="end">
                    <CircularProgress size={16} sx={{ color: '#7C3AED' }} />
                  </InputAdornment>
                )
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  color: '#E8EDF5',
                  bgcolor: 'rgba(255,255,255,0.05)',
                  borderRadius: '20px',
                  '& fieldset': { border: 'none' },
                }
              }}
            />
          </Box>

          {/* Search Results */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {searchResults.map((result, idx) => (
              <Box key={idx} sx={{ p: 1.5, borderRadius: '8px', bgcolor: 'rgba(255,255,255,0.03)', '&:hover': { bgcolor: 'rgba(255,255,255,0.05)' } }}>
                <Typography variant="body2" sx={{ color: '#E8EDF5', mb: 0.5, fontWeight: 500 }}>
                  {result.summary ? (result.summary.length > 100 ? result.summary.substring(0, 100) + '...' : result.summary) : 'No summary'}
                </Typography>
                <Typography variant="caption" sx={{ color: '#8899BB', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  "{result.text}"
                </Typography>
              </Box>
            ))}
          </Box>

        </Box>
      </CardContent>
    </Card>
  );
};

export default KnowledgeDumpCard;
