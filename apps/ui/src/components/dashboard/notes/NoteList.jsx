import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  InputAdornment,
  IconButton,
  Chip,
  Menu,
  MenuItem,
  Button,
  Tooltip,
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  AutoAwesome as AiIcon,
  PushPin as PinIcon,
  PushPinOutlined as UnpinIcon,
  Favorite as FavoriteIcon,
  FavoriteBorder as UnfavoriteIcon,
  MoreVert as MoreVertIcon,
  Delete as DeleteIcon,
  ContentCopy as DuplicateIcon,
  Palette as PaletteIcon,
  Clear as ClearIcon,
  Description as RichNoteIcon,
  Notes as PlainNoteIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppTheme } from '../../../theme/useAppTheme';
import { useSearchSummariesMutation } from '../../../store/api/dashboardApi';

const COLOR_OPTIONS = [
  { name: 'None', value: null },
  { name: 'Purple', value: '#7C3AED' },
  { name: 'Blue', value: '#3B82F6' },
  { name: 'Emerald', value: '#10B981' },
  { name: 'Amber', value: '#F59E0B' },
  { name: 'Rose', value: '#EF4444' },
];

const NoteList = ({
  notes = [],
  selectedNoteId,
  onSelectNote,
  onCreateNote,
  onOpenGenerateDialog,
  onDeleteNote,
  onTogglePin,
  onToggleFavorite,
  onDuplicateNote,
  onUpdateNoteColor,
}) => {
  const { isDark } = useAppTheme();
  const [searchSummaries, { data: searchData, isLoading: isSearching }] = useSearchSummariesMutation();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all'); // 'all', 'pinned', 'favorites', 'has_summary'
  const [selectedTag, setSelectedTag] = useState(null);
  const [newNoteMenuAnchor, setNewNoteMenuAnchor] = useState(null);

  // Debounced semantic vector search
  React.useEffect(() => {
    if (searchQuery.trim().length >= 2) {
      const timer = setTimeout(() => {
        searchSummaries({ query: searchQuery.trim(), limit: 10 });
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [searchQuery, searchSummaries]);

  // Context Menu State
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [menuNote, setMenuNote] = useState(null);
  const [colorMenuAnchorEl, setColorMenuAnchorEl] = useState(null);

  // Extract all unique tags
  const allTags = Array.from(
    new Set(notes.flatMap((n) => (Array.isArray(n.tags) ? n.tags : [])))
  ).filter(Boolean);

  const searchResults = searchData?.data || [];
  const semanticMatchingIds = new Set(searchResults.map((r) => r.sourceId || r.id));

  // Filter notes
  const filteredNotes = notes.filter((note) => {
    // Tag filter
    if (selectedTag && (!note.tags || !note.tags.includes(selectedTag))) {
      return false;
    }

    // Category filter
    if (activeFilter === 'pinned' && !note.isPinned) return false;
    if (activeFilter === 'favorites' && !note.isFavorite) return false;
    if (activeFilter === 'has_summary' && !note.summary) return false;

    // Search query: hybrid text match + LanceDB semantic match
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const titleMatch = (note.title || '').toLowerCase().includes(q);
      const contentMatch = (note.content || '').toLowerCase().includes(q);
      const summaryMatch = (note.summary || '').toLowerCase().includes(q);
      const tagMatch = (note.tags || []).some((t) => t.toLowerCase().includes(q));
      const vectorMatch = semanticMatchingIds.has(note.id);
      return titleMatch || contentMatch || summaryMatch || tagMatch || vectorMatch;
    }

    return true;
  });

  const handleOpenMenu = (e, note) => {
    e.stopPropagation();
    setMenuAnchorEl(e.currentTarget);
    setMenuNote(note);
  };

  const handleCloseMenu = () => {
    setMenuAnchorEl(null);
    setColorMenuAnchorEl(null);
    setMenuNote(null);
  };

  const formatRelativeTime = (isoString) => {
    if (!isoString) return '';
    try {
      const date = new Date(isoString);
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays === 1) return 'Yesterday';
      if (diffDays < 7) return `${diffDays}d ago`;
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch {
      return '';
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        width: '100%',
        bgcolor: isDark ? 'rgba(15, 23, 42, 0.4)' : '#ffffff',
        borderRight: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.06)',
      }}
    >
      {/* Header & Create Buttons */}
      <Box sx={{ p: 2, pb: 1.5, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: isDark ? '#f8fafc' : '#0f172a', fontSize: '1.15rem' }}>
              Notes
            </Typography>
            <Chip
              label={notes.length}
              size="small"
              sx={{
                height: 20,
                fontSize: '0.7rem',
                fontWeight: 700,
                bgcolor: isDark ? 'rgba(124, 58, 237, 0.2)' : 'rgba(124, 58, 237, 0.1)',
                color: '#7C3AED',
              }}
            />
          </Box>

          <Box sx={{ display: 'flex', gap: 0.8 }}>
            <Tooltip title="Generate Note with AI">
              <IconButton
                size="small"
                onClick={onOpenGenerateDialog}
                sx={{
                  bgcolor: isDark ? 'rgba(124, 58, 237, 0.15)' : 'rgba(124, 58, 237, 0.1)',
                  color: '#7C3AED',
                  '&:hover': { bgcolor: 'rgba(124, 58, 237, 0.25)' },
                }}
              >
                <AiIcon fontSize="small" />
              </IconButton>
            </Tooltip>

            <Button
              variant="contained"
              size="small"
              startIcon={<AddIcon />}
              onClick={(e) => setNewNoteMenuAnchor(e.currentTarget)}
              sx={{
                bgcolor: '#7C3AED',
                '&:hover': { bgcolor: '#6D28D9' },
                textTransform: 'none',
                borderRadius: '8px',
                fontWeight: 600,
                fontSize: '0.8rem',
                px: 1.5,
              }}
            >
              New
            </Button>

            <Menu
              anchorEl={newNoteMenuAnchor}
              open={Boolean(newNoteMenuAnchor)}
              onClose={() => setNewNoteMenuAnchor(null)}
              PaperProps={{
                sx: {
                  bgcolor: isDark ? '#1e293b' : '#fff',
                  borderRadius: '10px',
                  border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.08)',
                },
              }}
            >
              <MenuItem
                onClick={() => {
                  onCreateNote('rich');
                  setNewNoteMenuAnchor(null);
                }}
                sx={{ gap: 1 }}
              >
                <RichNoteIcon fontSize="small" sx={{ color: '#7C3AED' }} />
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>Rich Text Note</Typography>
                  <Typography variant="caption" sx={{ color: '#64748b' }}>Full formatting, tasks, code</Typography>
                </Box>
              </MenuItem>
              <MenuItem
                onClick={() => {
                  onCreateNote('plain');
                  setNewNoteMenuAnchor(null);
                }}
                sx={{ gap: 1 }}
              >
                <PlainNoteIcon fontSize="small" sx={{ color: '#0EA5E9' }} />
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>Plain Text Note</Typography>
                  <Typography variant="caption" sx={{ color: '#64748b' }}>Lightweight quick notes</Typography>
                </Box>
              </MenuItem>
            </Menu>
          </Box>
        </Box>

        {/* Search Field */}
        <TextField
          fullWidth
          size="small"
          placeholder="Search notes or LanceDB vector context..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: '#64748b', fontSize: 18 }} />
              </InputAdornment>
            ),
            endAdornment: searchQuery ? (
              <InputAdornment position="end">
                <IconButton size="small" onClick={() => setSearchQuery('')} sx={{ p: 0.5 }}>
                  <ClearIcon sx={{ fontSize: 14 }} />
                </IconButton>
              </InputAdornment>
            ) : null,
            sx: {
              height: 36,
              fontSize: '0.85rem',
              borderRadius: '8px',
              bgcolor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)',
            },
          }}
        />

        {/* Filter Pills */}
        <Box sx={{ display: 'flex', gap: 0.8, overflowX: 'auto', pb: 0.5, '::-webkit-scrollbar': { display: 'none' } }}>
          <Chip
            label="All"
            size="small"
            onClick={() => {
              setActiveFilter('all');
              setSelectedTag(null);
            }}
            sx={{
              height: 24,
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: 'pointer',
              bgcolor: activeFilter === 'all' && !selectedTag ? '#7C3AED' : isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
              color: activeFilter === 'all' && !selectedTag ? '#fff' : isDark ? '#cbd5e1' : '#64748b',
            }}
          />
          <Chip
            icon={<PinIcon sx={{ fontSize: '13px !important', color: activeFilter === 'pinned' ? '#fff !important' : '#7C3AED !important' }} />}
            label="Pinned"
            size="small"
            onClick={() => {
              setActiveFilter('pinned');
              setSelectedTag(null);
            }}
            sx={{
              height: 24,
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: 'pointer',
              bgcolor: activeFilter === 'pinned' ? '#7C3AED' : isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
              color: activeFilter === 'pinned' ? '#fff' : isDark ? '#cbd5e1' : '#64748b',
            }}
          />
          <Chip
            icon={<FavoriteIcon sx={{ fontSize: '13px !important', color: activeFilter === 'favorites' ? '#fff !important' : '#EF4444 !important' }} />}
            label="Favorites"
            size="small"
            onClick={() => {
              setActiveFilter('favorites');
              setSelectedTag(null);
            }}
            sx={{
              height: 24,
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: 'pointer',
              bgcolor: activeFilter === 'favorites' ? '#EF4444' : isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
              color: activeFilter === 'favorites' ? '#fff' : isDark ? '#cbd5e1' : '#64748b',
            }}
          />
          <Chip
            label="Summarized"
            size="small"
            onClick={() => {
              setActiveFilter('has_summary');
              setSelectedTag(null);
            }}
            sx={{
              height: 24,
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: 'pointer',
              bgcolor: activeFilter === 'has_summary' ? '#059669' : isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
              color: activeFilter === 'has_summary' ? '#fff' : isDark ? '#cbd5e1' : '#64748b',
            }}
          />
        </Box>

        {/* Tags Row */}
        {allTags.length > 0 && (
          <Box sx={{ display: 'flex', gap: 0.6, flexWrap: 'wrap', maxHeight: '54px', overflowY: 'auto' }}>
            {allTags.map((tag) => (
              <Chip
                key={tag}
                label={`#${tag}`}
                size="small"
                onClick={() => {
                  setSelectedTag(selectedTag === tag ? null : tag);
                  setActiveFilter('all');
                }}
                sx={{
                  height: 20,
                  fontSize: '0.65rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  bgcolor: selectedTag === tag ? '#7C3AED' : isDark ? 'rgba(124, 58, 237, 0.15)' : 'rgba(124, 58, 237, 0.08)',
                  color: selectedTag === tag ? '#fff' : '#7C3AED',
                  border: selectedTag === tag ? 'none' : '1px solid rgba(124, 58, 237, 0.2)',
                }}
              />
            ))}
          </Box>
        )}
      </Box>

      {/* Note List Scrollable Area */}
      <Box sx={{ flexGrow: 1, overflowY: 'auto', px: 1.5, pb: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
        <AnimatePresence>
          {filteredNotes.map((note) => {
            const isSelected = note.id === selectedNoteId;
            const snippet = note.content || note.summary || 'Empty note';

            return (
              <motion.div
                key={note.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.15 }}
              >
                <Box
                  onClick={() => onSelectNote(note.id)}
                  sx={{
                    p: 1.5,
                    borderRadius: '12px',
                    cursor: 'pointer',
                    position: 'relative',
                    bgcolor: isSelected
                      ? isDark
                        ? 'rgba(124, 58, 237, 0.2)'
                        : 'rgba(124, 58, 237, 0.08)'
                      : isDark
                      ? 'rgba(255, 255, 255, 0.025)'
                      : '#ffffff',
                    border: isSelected
                      ? '1px solid #7C3AED'
                      : isDark
                      ? '1px solid rgba(255, 255, 255, 0.05)'
                      : '1px solid rgba(0, 0, 0, 0.06)',
                    boxShadow: isSelected
                      ? '0 2px 10px rgba(124, 58, 237, 0.15)'
                      : '0 1px 3px rgba(0, 0, 0, 0.02)',
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': {
                      bgcolor: isSelected
                        ? isDark
                          ? 'rgba(124, 58, 237, 0.25)'
                          : 'rgba(124, 58, 237, 0.12)'
                        : isDark
                        ? 'rgba(255, 255, 255, 0.05)'
                        : 'rgba(0, 0, 0, 0.02)',
                      transform: 'translateY(-1px)',
                    },
                    borderLeft: note.color ? `4px solid ${note.color}` : undefined,
                  }}
                >
                  {/* Top Bar: Title, Pin, Menu */}
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 0.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, overflow: 'hidden' }}>
                      {note.isPinned && (
                        <PinIcon sx={{ fontSize: 14, color: '#7C3AED', flexShrink: 0 }} />
                      )}
                      {note.isFavorite && (
                        <FavoriteIcon sx={{ fontSize: 13, color: '#EF4444', flexShrink: 0 }} />
                      )}
                      <Typography
                        variant="subtitle2"
                        sx={{
                          fontWeight: 700,
                          color: isDark ? '#f8fafc' : '#0f172a',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          fontSize: '0.9rem',
                        }}
                      >
                        {note.title || 'Untitled Note'}
                      </Typography>
                    </Box>

                    <IconButton
                      size="small"
                      onClick={(e) => handleOpenMenu(e, note)}
                      sx={{
                        p: 0.3,
                        color: '#94a3b8',
                        '&:hover': { color: isDark ? '#f8fafc' : '#0f172a' },
                      }}
                    >
                      <MoreVertIcon fontSize="small" sx={{ fontSize: 18 }} />
                    </IconButton>
                  </Box>

                  {/* Content Preview */}
                  <Typography
                    variant="body2"
                    sx={{
                      color: isDark ? '#94a3b8' : '#64748b',
                      fontSize: '0.8rem',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      mb: 1,
                      lineHeight: 1.4,
                    }}
                  >
                    {snippet}
                  </Typography>

                  {/* Bottom Bar: Tags & Time */}
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', overflow: 'hidden' }}>
                      {(note.tags || []).slice(0, 2).map((t, idx) => (
                        <Typography
                          key={idx}
                          variant="caption"
                          sx={{
                            color: '#7C3AED',
                            fontSize: '0.65rem',
                            fontWeight: 600,
                          }}
                        >
                          {t.startsWith('#') ? t : `#${t}`}
                        </Typography>
                      ))}
                      {(note.tags || []).length > 2 && (
                        <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.65rem' }}>
                          +{note.tags.length - 2}
                        </Typography>
                      )}
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                      {note.isIndexed && (
                        <Tooltip title="Vector indexed in LanceDB">
                          <AiIcon sx={{ fontSize: 12, color: '#7C3AED' }} />
                        </Tooltip>
                      )}
                      <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.7rem' }}>
                        {formatRelativeTime(note.updatedAt || note.createdAt)}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {filteredNotes.length === 0 && (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="body2" sx={{ color: '#64748b', mb: 1 }}>
              No notes found.
            </Typography>
            <Button
              size="small"
              startIcon={<AddIcon />}
              onClick={() => onCreateNote('rich')}
              sx={{ color: '#7C3AED', textTransform: 'none', fontWeight: 600 }}
            >
              Create first note
            </Button>
          </Box>
        )}
      </Box>

      {/* Note Context Menu */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleCloseMenu}
        PaperProps={{
          sx: {
            bgcolor: isDark ? '#1e293b' : '#fff',
            borderRadius: '10px',
            minWidth: 160,
            border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.08)',
          },
        }}
      >
        <MenuItem
          onClick={() => {
            if (menuNote) onTogglePin(menuNote.id);
            handleCloseMenu();
          }}
          sx={{ gap: 1, fontSize: '0.85rem' }}
        >
          {menuNote?.isPinned ? <UnpinIcon fontSize="small" /> : <PinIcon fontSize="small" />}
          {menuNote?.isPinned ? 'Unpin Note' : 'Pin to Top'}
        </MenuItem>

        <MenuItem
          onClick={() => {
            if (menuNote) onToggleFavorite(menuNote.id);
            handleCloseMenu();
          }}
          sx={{ gap: 1, fontSize: '0.85rem' }}
        >
          {menuNote?.isFavorite ? <UnfavoriteIcon fontSize="small" /> : <FavoriteIcon fontSize="small" sx={{ color: '#EF4444' }} />}
          {menuNote?.isFavorite ? 'Remove Favorite' : 'Add to Favorites'}
        </MenuItem>

        <MenuItem
          onClick={() => {
            if (menuNote) onDuplicateNote(menuNote);
            handleCloseMenu();
          }}
          sx={{ gap: 1, fontSize: '0.85rem' }}
        >
          <DuplicateIcon fontSize="small" /> Duplicate
        </MenuItem>

        <MenuItem
          onClick={(e) => setColorMenuAnchorEl(e.currentTarget)}
          sx={{ gap: 1, fontSize: '0.85rem' }}
        >
          <PaletteIcon fontSize="small" /> Color Tag
        </MenuItem>

        <MenuItem
          onClick={() => {
            if (menuNote) onDeleteNote(menuNote.id);
            handleCloseMenu();
          }}
          sx={{ gap: 1, fontSize: '0.85rem', color: '#EF4444' }}
        >
          <DeleteIcon fontSize="small" /> Delete
        </MenuItem>
      </Menu>

      {/* Color Sub-Menu */}
      <Menu
        anchorEl={colorMenuAnchorEl}
        open={Boolean(colorMenuAnchorEl)}
        onClose={() => setColorMenuAnchorEl(null)}
        PaperProps={{
          sx: {
            bgcolor: isDark ? '#1e293b' : '#fff',
            borderRadius: '10px',
            p: 1,
            display: 'flex',
            gap: 1,
          },
        }}
      >
        {COLOR_OPTIONS.map((c) => (
          <Box
            key={c.name}
            onClick={() => {
              if (menuNote) onUpdateNoteColor(menuNote.id, c.value);
              handleCloseMenu();
            }}
            sx={{
              width: 24,
              height: 24,
              borderRadius: '50%',
              bgcolor: c.value || (isDark ? '#475569' : '#cbd5e1'),
              cursor: 'pointer',
              border: menuNote?.color === c.value ? '2px solid #fff' : '2px solid transparent',
              '&:hover': { transform: 'scale(1.2)' },
              transition: 'transform 0.15s ease',
              title: c.name,
            }}
          />
        ))}
      </Menu>
    </Box>
  );
};

export default NoteList;
