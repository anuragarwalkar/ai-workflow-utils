import { Box, Card, CardContent, Typography, IconButton, CircularProgress, Chip, TextField, Button, InputAdornment } from '@mui/material';
import { Storage as StorageIcon, MoreVert as MoreVertIcon, Add as AddIcon, Search as SearchIcon, AutoAwesome as AiIcon } from '@mui/icons-material';
import { useGetNotesQuery, useSearchSummariesMutation } from '../../store/api/dashboardApi';
import { useAppTheme } from '../../theme/useAppTheme';
import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

const NotesCard = ({ cardStyle }) => {
  const { isDark } = useAppTheme();
  const { data: notesData, isLoading } = useGetNotesQuery();
  const [searchSummaries, { isLoading: isSearching, data: searchData }] = useSearchSummariesMutation();
  const [searchQuery, setSearchQuery] = useState('');
  
  const notes = notesData?.data || [];
  const searchResults = searchData?.data || [];

  const displayNotes = searchQuery && searchResults.length > 0 
    ? searchResults.map(r => ({ ...r, id: r.id, summary: r.summary, isIndexed: true })) // Maps LanceDB results to note-like structure
    : notes;

  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    searchSummaries({ query: searchQuery, limit: 10 });
  };

  const handleSearchClear = (e) => {
    if (e.target.value === '') {
      setSearchQuery('');
    } else {
      setSearchQuery(e.target.value);
    }
  };

  return (
    <Card sx={cardStyle}>
      <CardContent sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <StorageIcon sx={{ color: '#7C3AED', fontSize: 20 }} />
              <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#7C3AED' }}>
                Context Stream (LanceDB)
              </Typography>
            </Box>
            <Typography variant="caption" sx={{ color: '#64748b' }}>
              Unstructured notes & knowledge. AI processed and stored.
            </Typography>
          </Box>
          <Button 
            size="small" 
            startIcon={<AddIcon />} 
            sx={{ color: '#7C3AED', textTransform: 'none', fontWeight: 600, '&:hover': { bgcolor: 'rgba(124, 58, 237, 0.1)' } }}
          >
            Add Note
          </Button>
        </Box>

        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
          <Chip label="All Types" size="small" variant="outlined" sx={{ color: '#64748b', borderColor: 'rgba(100,116,139,0.2)' }} />
          <Chip label="All Tags" size="small" variant="outlined" sx={{ color: '#64748b', borderColor: 'rgba(100,116,139,0.2)' }} />
          <Chip label="Newest First" size="small" variant="outlined" sx={{ color: '#64748b', borderColor: 'rgba(100,116,139,0.2)' }} />
          <Box component="form" onSubmit={handleSearch} sx={{ flexGrow: 1, ml: 1 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search notes..."
              value={searchQuery}
              onChange={handleSearchClear}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: 'rgba(100,116,139,0.5)', fontSize: 16 }} />
                  </InputAdornment>
                ),
                endAdornment: isSearching && (
                  <InputAdornment position="end">
                    <CircularProgress size={12} sx={{ color: '#7C3AED' }} />
                  </InputAdornment>
                ),
                sx: { height: 24, fontSize: '0.75rem', borderRadius: 1 }
              }}
            />
          </Box>
        </Box>

        <Box sx={{ flexGrow: 1, overflowY: 'auto', pr: 1 }}>
          {isLoading && <CircularProgress size={24} sx={{ display: 'block', mx: 'auto', mt: 4 }} />}
          
          <AnimatePresence>
            {displayNotes.map(note => (
              <motion.div
                key={note.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
              >
                <Box sx={{ 
                  p: 2, 
                  mb: 2, 
                  borderRadius: '12px',
                  bgcolor: isDark ? '#ffffff' : '#ffffff', // using white as per screenshot for light mode notes
                  border: '1px solid rgba(0,0,0,0.05)',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 1.5
                }}>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Box sx={{ 
                      width: 40, height: 40, borderRadius: '8px', 
                      bgcolor: 'rgba(124, 58, 237, 0.05)', color: '#7C3AED',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                    }}>
                      {/* Icon based on type, placeholder icon for now */}
                      <StorageIcon sx={{ fontSize: 20 }} />
                    </Box>
                    <Box sx={{ flexGrow: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Typography variant="body2" sx={{ color: '#0f172a', fontWeight: 600, mb: 0.5 }}>
                          {note.summary ? (note.summary.split('\\n')[0].replace(/^- /g, '')).substring(0, 50) + (note.summary.length > 50 ? '...' : '') : 'Note'}
                        </Typography>
                        <IconButton size="small" sx={{ color: '#94a3b8', mt: -0.5, mr: -1 }}>
                          <MoreVertIcon fontSize="small" />
                        </IconButton>
                      </Box>
                      <Typography variant="caption" sx={{ color: '#475569', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', mb: 1 }}>
                        {note.content || note.text || note.summary}
                      </Typography>
                      
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                          {(note.tags || ['#note']).map((tag, i) => (
                            <Typography key={i} variant="caption" sx={{ color: '#7C3AED', fontSize: '0.65rem', fontWeight: 500 }}>
                              {tag.startsWith('#') ? tag : `#${tag}`}
                            </Typography>
                          ))}
                        </Box>
                        
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {note.isIndexed && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <AiIcon sx={{ color: '#7C3AED', fontSize: 12 }} />
                              <Typography variant="caption" sx={{ color: '#7C3AED', fontSize: '0.65rem', fontWeight: 600 }}>AI Processed</Typography>
                            </Box>
                          )}
                          <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.65rem' }}>
                            {note.createdAt ? new Date(note.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'now'}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  </Box>
                </Box>
              </motion.div>
            ))}
          </AnimatePresence>

          {!isLoading && displayNotes.length === 0 && (
            <Typography variant="body2" sx={{ color: '#64748b', textAlign: 'center', mt: 4 }}>
              No notes found.
            </Typography>
          )}
        </Box>
        
        <Box sx={{ pt: 1 }}>
          <Typography variant="caption" sx={{ color: '#7C3AED', cursor: 'pointer', fontWeight: 600, '&:hover': { textDecoration: 'underline' } }}>
            View all notes →
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default NotesCard;
