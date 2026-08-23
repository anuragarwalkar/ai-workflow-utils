import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  Typography,
  TextField,
  IconButton,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Tooltip,
  Paper,
  Divider,
} from '@mui/material';
import {
  PushPin as PinIcon,
  PushPinOutlined as UnpinIcon,
  Favorite as FavoriteIcon,
  FavoriteBorder as UnfavoriteIcon,
  Delete as DeleteIcon,
  AutoAwesome as AiIcon,
  CheckCircle as SyncedIcon,
  CloudUpload as SavingIcon,
  LocalOffer as TagIcon,
  Add as AddIcon,
  Description as RichIcon,
  TextFields as PlainIcon,
  Palette as ColorIcon,
} from '@mui/icons-material';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  useGetNotesQuery,
  useCreateNoteMutation,
  useUpdateNoteMutation,
  useDeleteNoteMutation,
  useToggleNotePinMutation,
  useToggleNoteFavoriteMutation,
  useGenerateNoteMutation,
} from '../../../store/api/dashboardApi';
import NoteList from './NoteList';
import RichTextEditor from './RichTextEditor';
import AiActionsPanel from './AiActionsPanel';
import { useAppTheme } from '../../../theme/useAppTheme';

const COLOR_PALETTE = [
  { name: 'Default', value: null },
  { name: 'Purple', value: '#7C3AED' },
  { name: 'Blue', value: '#3B82F6' },
  { name: 'Emerald', value: '#10B981' },
  { name: 'Amber', value: '#F59E0B' },
  { name: 'Rose', value: '#EF4444' },
  { name: 'Cyan', value: '#06B6D4' },
];

const NotesPage = () => {
  const { isDark } = useAppTheme();
  const { id: routeNoteId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // RTK Query hooks
  const { data: notesData, isLoading } = useGetNotesQuery();
  const [createNote, { isLoading: isCreating }] = useCreateNoteMutation();
  const [updateNote, { isLoading: isUpdating }] = useUpdateNoteMutation();
  const [deleteNote] = useDeleteNoteMutation();
  const [togglePin] = useToggleNotePinMutation();
  const [toggleFavorite] = useToggleNoteFavoriteMutation();
  const [generateNote, { isLoading: isGenerating }] = useGenerateNoteMutation();

  const notes = notesData?.data || [];

  // Selected note logic: check route param -> query param -> first note in list
  const initialId = routeNoteId || searchParams.get('id');
  const [selectedNoteId, setSelectedNoteId] = useState(initialId || null);

  // Local note edit state for smooth instant typing
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editRichContent, setEditRichContent] = useState('');
  const [editContentType, setEditContentType] = useState('rich');
  const [editTags, setEditTags] = useState([]);
  const [newTagInput, setNewTagInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // AI Generate Dialog State
  const [generateDialogOpen, setGenerateDialogOpen] = useState(false);
  const [generatePrompt, setGeneratePrompt] = useState('');

  // Debounce save timer ref
  const saveTimeoutRef = useRef(null);

  // Active note object
  const activeNote = notes.find((n) => n.id === selectedNoteId);

  // Select first note automatically if none selected and notes exist
  useEffect(() => {
    if (!selectedNoteId && notes.length > 0) {
      setSelectedNoteId(notes[0].id);
    } else if (selectedNoteId && !notes.some((n) => n.id === selectedNoteId) && notes.length > 0) {
      setSelectedNoteId(notes[0].id);
    }
  }, [notes, selectedNoteId]);

  // Sync active note into local form state
  useEffect(() => {
    if (activeNote) {
      setEditTitle(activeNote.title || '');
      setEditContent(activeNote.content || '');
      setEditRichContent(activeNote.richContent || activeNote.content || '');
      setEditContentType(activeNote.contentType || 'rich');
      setEditTags(activeNote.tags || []);
    }
  }, [activeNote?.id]);

  // Auto-save logic with debounce
  const triggerAutoSave = useCallback(
    (patch) => {
      if (!selectedNoteId) return;
      setIsSaving(true);
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      saveTimeoutRef.current = setTimeout(async () => {
        try {
          await updateNote({ id: selectedNoteId, ...patch });
        } catch (err) {
          console.error('Failed to auto-save note:', err);
        } finally {
          setIsSaving(false);
        }
      }, 700);
    },
    [selectedNoteId, updateNote]
  );

  // Field change handlers
  const handleTitleChange = (e) => {
    const val = e.target.value;
    setEditTitle(val);
    triggerAutoSave({ title: val });
  };

  const handleRichContentChange = (html) => {
    setEditRichContent(html);
    triggerAutoSave({ richContent: html, contentType: 'rich' });
  };

  const handlePlainContentChange = (e) => {
    const val = e.target.value;
    setEditContent(val);
    triggerAutoSave({ content: val, richContent: val, contentType: 'plain' });
  };

  const handleContentTypeToggle = () => {
    const nextType = editContentType === 'rich' ? 'plain' : 'rich';
    setEditContentType(nextType);
    triggerAutoSave({ contentType: nextType });
  };

  // Tag Handlers
  const handleAddTag = (tagToAdd) => {
    const trimmed = (tagToAdd || newTagInput).trim().replace(/^#/, '').toLowerCase();
    if (!trimmed || editTags.includes(trimmed)) return;
    const nextTags = [...editTags, trimmed];
    setEditTags(nextTags);
    setNewTagInput('');
    triggerAutoSave({ tags: nextTags });
  };

  const handleRemoveTag = (tagToRemove) => {
    const nextTags = editTags.filter((t) => t !== tagToRemove);
    setEditTags(nextTags);
    triggerAutoSave({ tags: nextTags });
  };

  const handleAddMultipleTags = (tagsList) => {
    const cleaned = tagsList.map((t) => t.replace(/^#/, '').toLowerCase().trim()).filter(Boolean);
    const merged = Array.from(new Set([...editTags, ...cleaned]));
    setEditTags(merged);
    triggerAutoSave({ tags: merged });
  };

  // Create Note
  const handleCreateNote = async (type = 'rich') => {
    try {
      const newNote = await createNote({
        title: '',
        content: '',
        richContent: '',
        contentType: type,
        tags: [],
        type: 'Note',
      }).unwrap();

      if (newNote.data?.id) {
        setSelectedNoteId(newNote.data.id);
        setSearchParams({ id: newNote.data.id });
      }
    } catch (err) {
      console.error('Failed to create note:', err);
    }
  };

  // Duplicate Note
  const handleDuplicateNote = async (sourceNote) => {
    try {
      const duplicated = await createNote({
        title: `${sourceNote.title || 'Untitled'} (Copy)`,
        content: sourceNote.content || '',
        richContent: sourceNote.richContent || '',
        contentType: sourceNote.contentType || 'rich',
        tags: sourceNote.tags || [],
        color: sourceNote.color || null,
        type: 'Note',
      }).unwrap();

      if (duplicated.data?.id) {
        setSelectedNoteId(duplicated.data.id);
      }
    } catch (err) {
      console.error('Failed to duplicate note:', err);
    }
  };

  // Delete Note
  const handleDeleteNote = async (id) => {
    try {
      await deleteNote(id);
      if (selectedNoteId === id) {
        const remaining = notes.filter((n) => n.id !== id);
        setSelectedNoteId(remaining.length > 0 ? remaining[0].id : null);
      }
    } catch (err) {
      console.error('Failed to delete note:', err);
    }
  };

  // Note Color
  const handleUpdateNoteColor = async (id, color) => {
    await updateNote({ id, color });
  };

  // Select note handler
  const handleSelectNote = (id) => {
    setSelectedNoteId(id);
    setSearchParams({ id });
  };

  // Generate note from prompt
  const handleGenerateNoteSubmit = async () => {
    if (!generatePrompt.trim()) return;
    try {
      const res = await generateNote({ prompt: generatePrompt, autoSave: true }).unwrap();
      setGenerateDialogOpen(false);
      setGeneratePrompt('');
      if (res.data?.note?.id) {
        setSelectedNoteId(res.data.note.id);
        setSearchParams({ id: res.data.note.id });
      }
    } catch (err) {
      console.error('Failed to generate note:', err);
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        height: '100%',
        width: '100%',
        overflow: 'hidden',
        bgcolor: isDark ? '#0f172a' : '#f8fafc',
      }}
    >
      {/* Left Column: Note List Panel */}
      <Box
        sx={{
          width: { xs: '100%', md: '350px', lg: '380px' },
          height: '100%',
          flexShrink: 0,
          display: { xs: selectedNoteId ? 'none' : 'block', md: 'block' },
        }}
      >
        <NoteList
          notes={notes}
          selectedNoteId={selectedNoteId}
          onSelectNote={handleSelectNote}
          onCreateNote={handleCreateNote}
          onOpenGenerateDialog={() => setGenerateDialogOpen(true)}
          onDeleteNote={handleDeleteNote}
          onTogglePin={(id) => togglePin(id)}
          onToggleFavorite={(id) => toggleFavorite(id)}
          onDuplicateNote={handleDuplicateNote}
          onUpdateNoteColor={handleUpdateNoteColor}
        />
      </Box>

      {/* Right Column: Active Note Editor */}
      <Box
        sx={{
          flexGrow: 1,
          height: '100%',
          display: { xs: selectedNoteId ? 'flex' : 'none', md: 'flex' },
          flexDirection: 'column',
          overflowY: 'auto',
          p: { xs: 2, md: 3 },
          bgcolor: isDark ? '#090d16' : '#ffffff',
        }}
      >
        {activeNote ? (
          <Box
            sx={{
              maxWidth: '900px',
              width: '100%',
              mx: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: 2.5,
              height: '100%',
            }}
          >
            {/* Top Action & Status Bar */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 1.5,
                pb: 1,
                borderBottom: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.06)',
              }}
            >
              {/* Type Switcher & Vector Sync Badge */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Chip
                  icon={editContentType === 'rich' ? <RichIcon sx={{ fontSize: 16 }} /> : <PlainIcon sx={{ fontSize: 16 }} />}
                  label={editContentType === 'rich' ? 'Rich Text' : 'Plain Text'}
                  size="small"
                  onClick={handleContentTypeToggle}
                  sx={{
                    bgcolor: isDark ? 'rgba(124, 58, 237, 0.15)' : 'rgba(124, 58, 237, 0.08)',
                    color: '#7C3AED',
                    fontWeight: 600,
                    cursor: 'pointer',
                    '&:hover': { bgcolor: 'rgba(124, 58, 237, 0.25)' },
                  }}
                />

                <Tooltip title="Synchronized into LanceDB vector memory for semantic search and AI context">
                  <Chip
                    icon={<SyncedIcon sx={{ fontSize: 14, color: '#10B981 !important' }} />}
                    label="LanceDB Synced"
                    size="small"
                    sx={{
                      bgcolor: isDark ? 'rgba(16, 185, 129, 0.1)' : 'rgba(16, 185, 129, 0.08)',
                      color: '#059669',
                      fontWeight: 600,
                      fontSize: '0.72rem',
                    }}
                  />
                </Tooltip>

                {/* Save status */}
                <Typography variant="caption" sx={{ color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  {isSaving ? (
                    <>
                      <CircularProgress size={10} color="inherit" /> Saving...
                    </>
                  ) : (
                    'Saved'
                  )}
                </Typography>
              </Box>

              {/* Right Action Icons */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                {/* Pin Button */}
                <Tooltip title={activeNote.isPinned ? 'Unpin' : 'Pin note'}>
                  <IconButton
                    size="small"
                    onClick={() => togglePin(activeNote.id)}
                    sx={{ color: activeNote.isPinned ? '#7C3AED' : '#94a3b8' }}
                  >
                    {activeNote.isPinned ? <PinIcon fontSize="small" /> : <UnpinIcon fontSize="small" />}
                  </IconButton>
                </Tooltip>

                {/* Favorite Button */}
                <Tooltip title={activeNote.isFavorite ? 'Remove Favorite' : 'Add to Favorites'}>
                  <IconButton
                    size="small"
                    onClick={() => toggleFavorite(activeNote.id)}
                    sx={{ color: activeNote.isFavorite ? '#EF4444' : '#94a3b8' }}
                  >
                    {activeNote.isFavorite ? <FavoriteIcon fontSize="small" /> : <UnfavoriteIcon fontSize="small" />}
                  </IconButton>
                </Tooltip>

                {/* Color Selector */}
                <Box sx={{ display: 'flex', gap: 0.5, mx: 1 }}>
                  {COLOR_PALETTE.map((c) => (
                    <Box
                      key={c.name}
                      onClick={() => handleUpdateNoteColor(activeNote.id, c.value)}
                      sx={{
                        width: 16,
                        height: 16,
                        borderRadius: '50%',
                        bgcolor: c.value || (isDark ? '#475569' : '#cbd5e1'),
                        cursor: 'pointer',
                        border: activeNote.color === c.value ? '2px solid #7C3AED' : '1px solid transparent',
                        '&:hover': { transform: 'scale(1.2)' },
                        transition: 'transform 0.15s ease',
                      }}
                      title={c.name}
                    />
                  ))}
                </Box>

                {/* Delete Button */}
                <Tooltip title="Delete Note">
                  <IconButton
                    size="small"
                    onClick={() => handleDeleteNote(activeNote.id)}
                    sx={{ color: '#ef4444' }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>

            {/* Editable Title */}
            <TextField
              variant="standard"
              placeholder="Untitled Note"
              value={editTitle}
              onChange={handleTitleChange}
              fullWidth
              InputProps={{
                disableUnderline: true,
                sx: {
                  fontSize: { xs: '1.5rem', md: '1.85rem' },
                  fontWeight: 700,
                  color: isDark ? '#f8fafc' : '#0f172a',
                  fontFamily: '"Inter", sans-serif',
                },
              }}
            />

            {/* AI Assistant Actions Toolbar */}
            <AiActionsPanel
              note={activeNote}
              onApplyContent={(newHtml) => {
                setEditRichContent(newHtml);
                triggerAutoSave({ richContent: newHtml, contentType: 'rich' });
              }}
              onAddTags={handleAddMultipleTags}
              onSelectRelatedNote={handleSelectNote}
            />

            {/* Editor Area */}
            <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', minHeight: '380px' }}>
              {editContentType === 'rich' ? (
                <RichTextEditor
                  content={editRichContent}
                  onChange={handleRichContentChange}
                  minHeight="380px"
                />
              ) : (
                <TextField
                  fullWidth
                  multiline
                  minRows={16}
                  placeholder="Start typing your plain text note..."
                  value={editContent}
                  onChange={handlePlainContentChange}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '12px',
                      color: isDark ? '#e2e8f0' : '#1e293b',
                      bgcolor: isDark ? 'rgba(15, 23, 42, 0.5)' : '#ffffff',
                      fontFamily: '"Inter", sans-serif',
                      fontSize: '0.95rem',
                      lineHeight: 1.6,
                    },
                  }}
                />
              )}
            </Box>

            {/* Tags & Metadata Footer */}
            <Paper
              elevation={0}
              sx={{
                p: 2,
                borderRadius: '12px',
                bgcolor: isDark ? 'rgba(15, 23, 42, 0.4)' : '#f8fafc',
                border: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.06)',
                display: 'flex',
                flexDirection: 'column',
                gap: 1.5,
              }}
            >
              {/* Tag Editor Row */}
              <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                <TagIcon sx={{ color: '#7C3AED', fontSize: 18 }} />
                <Typography variant="caption" sx={{ fontWeight: 600, color: isDark ? '#cbd5e1' : '#475569' }}>
                  Tags:
                </Typography>

                {editTags.map((tag) => (
                  <Chip
                    key={tag}
                    label={`#${tag}`}
                    size="small"
                    onDelete={() => handleRemoveTag(tag)}
                    sx={{
                      bgcolor: isDark ? 'rgba(124, 58, 237, 0.2)' : 'rgba(124, 58, 237, 0.1)',
                      color: '#7C3AED',
                      fontWeight: 600,
                      fontSize: '0.75rem',
                    }}
                  />
                ))}

                <TextField
                  size="small"
                  placeholder="+ Add tag (Enter)"
                  value={newTagInput}
                  onChange={(e) => setNewTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                  variant="standard"
                  InputProps={{
                    disableUnderline: true,
                    sx: {
                      fontSize: '0.75rem',
                      width: '120px',
                      color: isDark ? '#e2e8f0' : '#1e293b',
                    },
                  }}
                />
              </Box>

              {/* Timestamps */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pt: 1, borderTop: isDark ? '1px solid rgba(255,255,255,0.04)' : '1px solid rgba(0,0,0,0.04)' }}>
                <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                  Created {activeNote.createdAt ? new Date(activeNote.createdAt).toLocaleString() : 'recently'}
                </Typography>
                <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                  Last updated {activeNote.updatedAt ? new Date(activeNote.updatedAt).toLocaleString() : 'recently'}
                </Typography>
              </Box>
            </Paper>
          </Box>
        ) : (
          /* Empty State */
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              gap: 2,
              textAlign: 'center',
            }}
          >
            <Box
              sx={{
                width: 72,
                height: 72,
                borderRadius: '50%',
                bgcolor: isDark ? 'rgba(124, 58, 237, 0.15)' : 'rgba(124, 58, 237, 0.08)',
                color: '#7C3AED',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <AiIcon sx={{ fontSize: 36 }} />
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 700, color: isDark ? '#f8fafc' : '#0f172a' }}>
              No Note Selected
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748b', maxWidth: '400px' }}>
              Create a new rich text note, write plain text, or let AI generate a note based on a topic.
            </Typography>
            <Box sx={{ display: 'flex', gap: 1.5, mt: 1 }}>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => handleCreateNote('rich')}
                sx={{ bgcolor: '#7C3AED', '&:hover': { bgcolor: '#6D28D9' }, textTransform: 'none', borderRadius: '8px' }}
              >
                New Rich Note
              </Button>
              <Button
                variant="outlined"
                startIcon={<AiIcon />}
                onClick={() => setGenerateDialogOpen(true)}
                sx={{ borderColor: '#7C3AED', color: '#7C3AED', textTransform: 'none', borderRadius: '8px' }}
              >
                Generate with AI
              </Button>
            </Box>
          </Box>
        )}
      </Box>

      {/* Generate Note with AI Dialog */}
      <Dialog
        open={generateDialogOpen}
        onClose={() => setGenerateDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: isDark ? '#0f172a' : '#fff',
            borderRadius: '16px',
            border: isDark ? '1px solid rgba(255,255,255,0.1)' : 'none',
          },
        }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, color: isDark ? '#f8fafc' : '#0f172a' }}>
          <AiIcon sx={{ color: '#7C3AED' }} />
          Generate Note with AI
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: '#64748b', mb: 2 }}>
            Describe what you need notes on. AI will generate a structured rich-text note, summary, and topic tags automatically:
          </Typography>

          <TextField
            autoFocus
            fullWidth
            multiline
            rows={4}
            placeholder="e.g. Architecture decisions for migration to LanceDB vector memory with LangGraph agent workflows..."
            value={generatePrompt}
            onChange={(e) => setGeneratePrompt(e.target.value)}
            sx={{
              '& .MuiOutlinedInput-root': {
                color: isDark ? '#e2e8f0' : '#1e293b',
                bgcolor: isDark ? 'rgba(255,255,255,0.04)' : 'transparent',
              },
            }}
          />

          {/* Quick Prompt Suggestions */}
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2 }}>
            {[
              'Meeting notes for sprint planning',
              'System architecture and DB schema',
              'Release checklist & QA test cases',
              'Bug postmortem & root cause analysis',
            ].map((sug) => (
              <Chip
                key={sug}
                label={sug}
                size="small"
                onClick={() => setGeneratePrompt(sug)}
                sx={{
                  cursor: 'pointer',
                  bgcolor: isDark ? 'rgba(124, 58, 237, 0.15)' : 'rgba(124, 58, 237, 0.08)',
                  color: '#7C3AED',
                  fontWeight: 500,
                  '&:hover': { bgcolor: 'rgba(124, 58, 237, 0.25)' },
                }}
              />
            ))}
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setGenerateDialogOpen(false)} sx={{ color: '#64748b' }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleGenerateNoteSubmit}
            disabled={!generatePrompt.trim() || isGenerating}
            startIcon={isGenerating ? <CircularProgress size={16} color="inherit" /> : <AiIcon />}
            sx={{ bgcolor: '#7C3AED', '&:hover': { bgcolor: '#6D28D9' }, textTransform: 'none', borderRadius: '8px' }}
          >
            {isGenerating ? 'Generating Note...' : 'Generate & Open'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default NotesPage;
