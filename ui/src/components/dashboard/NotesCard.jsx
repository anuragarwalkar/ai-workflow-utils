import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  IconButton,
  CircularProgress,
  Chip,
  TextField,
  Button,
  InputAdornment,
  Menu,
  MenuItem,
  Tooltip,
} from '@mui/material';
import {
  Storage as StorageIcon,
  MoreVert as MoreVertIcon,
  Add as AddIcon,
  Search as SearchIcon,
  AutoAwesome as AiIcon,
  Delete as DeleteIcon,
  PushPin as PinIcon,
  Favorite as FavoriteIcon,
  OpenInNew as OpenIcon,
  Description as RichNoteIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import {
  useGetNotesQuery,
  useSearchSummariesMutation,
  useCreateNoteMutation,
  useDeleteNoteMutation,
} from '../../store/api/dashboardApi';
import { useAppTheme } from '../../theme/useAppTheme';
import { AnimatePresence, motion } from 'framer-motion';

const NotesCard = ({ cardStyle }) => {
  const { isDark } = useAppTheme();
  const navigate = useNavigate();

  const { data: notesData, isLoading } = useGetNotesQuery();
  const [searchSummaries, { isLoading: isSearching, data: searchData }] = useSearchSummariesMutation();
  const [createNote, { isLoading: isCreating }] = useCreateNoteMutation();
  const [deleteNote] = useDeleteNoteMutation();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('All');

  // Menu State
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedNoteId, setSelectedNoteId] = useState(null);

  const notes = notesData?.data || [];
  const searchResults = searchData?.data || [];

  // Debounced semantic search into LanceDB as user types
  React.useEffect(() => {
    if (searchQuery.trim().length >= 2) {
      const timer = setTimeout(() => {
        searchSummaries({ query: searchQuery.trim(), limit: 10 });
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [searchQuery, searchSummaries]);

  let displayNotes =
    searchQuery.trim() && searchResults.length > 0
      ? searchResults.map((r) => {
          const originalNote = notes.find((n) => n.id === r.sourceId || n.id === r.id);
          if (originalNote) return originalNote;
          return {
            id: r.sourceId || r.id,
            title: r.title || (r.text ? r.text.substring(0, 40) : 'Note'),
            content: r.text,
            summary: r.summary,
            tags: r.tags || [],
            isIndexed: true,
            createdAt: r.createdAt || new Date().toISOString(),
          };
        })
      : notes;

  if (filterType === 'Newest First') {
    displayNotes = [...displayNotes].sort(
      (a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt)
    );
  } else if (filterType === 'Has Tags') {
    displayNotes = displayNotes.filter((n) => n.tags && n.tags.length > 0);
  } else if (filterType === 'Pinned') {
    displayNotes = displayNotes.filter((n) => n.isPinned);
  }

  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    searchSummaries({ query: searchQuery.trim(), limit: 10 });
  };

  const handleSearchClear = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleAddNoteClick = async () => {
    try {
      const newNote = await createNote({
        title: '',
        content: '',
        richContent: '',
        contentType: 'rich',
        tags: [],
        type: 'Note',
      }).unwrap();

      if (newNote.data?.id) {
        navigate(`/ai-dashboard/notes?id=${newNote.data.id}`);
      } else {
        navigate('/ai-dashboard/notes');
      }
    } catch {
      navigate('/ai-dashboard/notes');
    }
  };

  const handleNoteClick = (id) => {
    navigate(`/ai-dashboard/notes?id=${id}`);
  };

  const handleDelete = async () => {
    if (selectedNoteId) {
      await deleteNote(selectedNoteId);
    }
    setAnchorEl(null);
    setSelectedNoteId(null);
  };

  return (
    <Card sx={cardStyle}>
      <CardContent sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5, pr: 4.5 }}>
          <Box sx={{ pr: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <StorageIcon sx={{ color: '#7C3AED', fontSize: 20 }} />
              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#7C3AED' }}>
                Context Stream (LanceDB)
              </Typography>
            </Box>
            <Typography variant="caption" sx={{ color: '#64748b' }}>
              Rich AI-powered notes & vector indexed knowledge base.
            </Typography>
          </Box>

          <Button
            size="small"
            startIcon={<AddIcon sx={{ fontSize: '0.95rem !important' }} />}
            onClick={handleAddNoteClick}
            disabled={isCreating}
            sx={{
              color: '#7C3AED',
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.78rem',
              height: 28,
              px: 1.25,
              whiteSpace: 'nowrap',
              flexShrink: 0,
              bgcolor: isDark ? 'rgba(124, 58, 237, 0.12)' : 'rgba(124, 58, 237, 0.08)',
              border: '1px solid rgba(124, 58, 237, 0.25)',
              '&:hover': { bgcolor: 'rgba(124, 58, 237, 0.18)', borderColor: '#7C3AED' },
              borderRadius: '7px',
            }}
          >
            New Note
          </Button>
        </Box>

        {/* Filter Pills & Search */}
        <Box sx={{ display: 'flex', gap: 0.8, mb: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
          <Chip
            label="All"
            size="small"
            onClick={() => setFilterType('All')}
            sx={{
              height: 24,
              fontSize: '0.72rem',
              fontWeight: 600,
              bgcolor: filterType === 'All' ? '#7C3AED' : isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
              color: filterType === 'All' ? '#fff' : isDark ? '#cbd5e1' : '#64748b',
              cursor: 'pointer',
            }}
          />
          <Chip
            label="Pinned"
            size="small"
            onClick={() => setFilterType('Pinned')}
            sx={{
              height: 24,
              fontSize: '0.72rem',
              fontWeight: 600,
              bgcolor: filterType === 'Pinned' ? '#7C3AED' : isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
              color: filterType === 'Pinned' ? '#fff' : isDark ? '#cbd5e1' : '#64748b',
              cursor: 'pointer',
            }}
          />
          <Chip
            label="Has Tags"
            size="small"
            onClick={() => setFilterType('Has Tags')}
            sx={{
              height: 24,
              fontSize: '0.72rem',
              fontWeight: 600,
              bgcolor: filterType === 'Has Tags' ? '#7C3AED' : isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
              color: filterType === 'Has Tags' ? '#fff' : isDark ? '#cbd5e1' : '#64748b',
              cursor: 'pointer',
            }}
          />

          <Box component="form" onSubmit={handleSearch} sx={{ flexGrow: 1, minWidth: '130px' }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search notes..."
              value={searchQuery}
              onChange={handleSearchClear}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: 'rgba(100,116,139,0.5)', fontSize: 15 }} />
                  </InputAdornment>
                ),
                endAdornment: isSearching && (
                  <InputAdornment position="end">
                    <CircularProgress size={12} sx={{ color: '#7C3AED' }} />
                  </InputAdornment>
                ),
                sx: { height: 26, fontSize: '0.75rem', borderRadius: 1.5 },
              }}
            />
          </Box>
        </Box>

        {/* Note Previews List */}
        <Box sx={{ flexGrow: 1, overflowY: 'auto', pr: 0.5, display: 'flex', flexDirection: 'column', gap: 1.2 }}>
          {isLoading && <CircularProgress size={24} sx={{ display: 'block', mx: 'auto', mt: 4 }} />}

          <AnimatePresence>
            {displayNotes.map((note) => {
              const displayTitle = note.title || (note.summary ? note.summary.split('\n')[0].replace(/^- /g, '').substring(0, 45) : 'Untitled Note');
              const snippet = note.content || note.text || note.summary || 'No text content';

              return (
                <motion.div
                  key={note.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                >
                  <Box
                    onClick={() => handleNoteClick(note.id)}
                    sx={{
                      p: 1.5,
                      borderRadius: '12px',
                      bgcolor: isDark ? 'rgba(255,255,255,0.03)' : '#ffffff',
                      border: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.06)',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 1,
                      cursor: 'pointer',
                      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                      borderLeft: note.color ? `4px solid ${note.color}` : undefined,
                      '&:hover': {
                        bgcolor: isDark ? 'rgba(124, 58, 237, 0.12)' : 'rgba(124, 58, 237, 0.04)',
                        borderColor: 'rgba(124, 58, 237, 0.3)',
                        transform: 'translateY(-1px)',
                      },
                    }}
                  >
                    <Box sx={{ display: 'flex', gap: 1.5 }}>
                      <Box
                        sx={{
                          width: 36,
                          height: 36,
                          borderRadius: '8px',
                          bgcolor: 'rgba(124, 58, 237, 0.08)',
                          color: '#7C3AED',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <RichNoteIcon sx={{ fontSize: 18 }} />
                      </Box>

                      <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6, overflow: 'hidden' }}>
                            {note.isPinned && <PinIcon sx={{ fontSize: 13, color: '#7C3AED' }} />}
                            {note.isFavorite && <FavoriteIcon sx={{ fontSize: 12, color: '#EF4444' }} />}
                            <Typography
                              variant="body2"
                              sx={{
                                color: isDark ? '#f8fafc' : '#0f172a',
                                fontWeight: 700,
                                fontSize: '0.85rem',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                              }}
                            >
                              {displayTitle}
                            </Typography>
                          </Box>

                          <IconButton
                            size="small"
                            sx={{ color: '#94a3b8', mt: -0.5, mr: -0.5 }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setAnchorEl(e.currentTarget);
                              setSelectedNoteId(note.id);
                            }}
                          >
                            <MoreVertIcon fontSize="small" sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Box>

                        <Typography
                          variant="caption"
                          sx={{
                            color: isDark ? '#94a3b8' : '#475569',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            my: 0.5,
                            lineHeight: 1.35,
                          }}
                        >
                          {snippet}
                        </Typography>

                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                            {(note.tags || []).slice(0, 2).map((tag, i) => (
                              <Typography
                                key={i}
                                variant="caption"
                                sx={{ color: '#7C3AED', fontSize: '0.65rem', fontWeight: 600 }}
                              >
                                {tag.startsWith('#') ? tag : `#${tag}`}
                              </Typography>
                            ))}
                          </Box>

                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                            {note.isIndexed && (
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3 }}>
                                <AiIcon sx={{ color: '#7C3AED', fontSize: 11 }} />
                                <Typography variant="caption" sx={{ color: '#7C3AED', fontSize: '0.65rem', fontWeight: 600 }}>
                                  Indexed
                                </Typography>
                              </Box>
                            )}
                            <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.65rem' }}>
                              {note.updatedAt || note.createdAt
                                ? new Date(note.updatedAt || note.createdAt).toLocaleDateString([], {
                                    month: 'short',
                                    day: 'numeric',
                                  })
                                : 'now'}
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                    </Box>
                  </Box>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {!isLoading && displayNotes.length === 0 && (
            <Typography variant="body2" sx={{ color: '#64748b', textAlign: 'center', mt: 4 }}>
              No notes found.
            </Typography>
          )}
        </Box>

        {/* Footer Link to Dedicated Page */}
        <Box sx={{ pt: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography
            variant="caption"
            onClick={() => navigate('/ai-dashboard/notes')}
            sx={{
              color: '#7C3AED',
              cursor: 'pointer',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              '&:hover': { textDecoration: 'underline' },
            }}
          >
            Open Full Notes App <OpenIcon sx={{ fontSize: 13 }} />
          </Typography>

          <Typography variant="caption" sx={{ color: '#94a3b8' }}>
            {notes.length} note{notes.length === 1 ? '' : 's'} stored
          </Typography>
        </Box>
      </CardContent>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        PaperProps={{ sx: { bgcolor: isDark ? '#1e293b' : '#fff', borderRadius: '12px', minWidth: '120px' } }}
      >
        <MenuItem
          onClick={() => {
            if (selectedNoteId) navigate(`/ai-dashboard/notes?id=${selectedNoteId}`);
            setAnchorEl(null);
          }}
          sx={{ fontSize: '0.85rem' }}
        >
          <OpenIcon fontSize="small" sx={{ mr: 1, color: '#7C3AED' }} /> Open Editor
        </MenuItem>
        <MenuItem onClick={handleDelete} sx={{ color: '#ef4444', fontSize: '0.85rem' }}>
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} /> Delete
        </MenuItem>
      </Menu>
    </Card>
  );
};

export default NotesCard;
