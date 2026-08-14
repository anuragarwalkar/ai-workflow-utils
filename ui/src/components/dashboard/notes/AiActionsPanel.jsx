import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Tooltip,
  Paper,
  Divider,
  Alert,
} from '@mui/material';
import {
  AutoAwesome as AiIcon,
  Summarize as SummarizeIcon,
  LocalOffer as TagIcon,
  AutoFixHigh as ImproveIcon,
  OpenInFull as ExpandIcon,
  Hub as RelatedIcon,
  Check as CheckIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import {
  useSummarizeNoteMutation,
  useAutoTagNoteMutation,
  useExpandNoteMutation,
  useImproveWritingMutation,
  useGetRelatedNotesQuery,
} from '../../../store/api/dashboardApi';
import { useAppTheme } from '../../../theme/useAppTheme';

const AiActionsPanel = ({
  note,
  onApplyContent,
  onAddTags,
  onSelectRelatedNote,
}) => {
  const { isDark } = useAppTheme();

  // Mutations
  const [summarizeNote, { isLoading: isSummarizing }] = useSummarizeNoteMutation();
  const [autoTagNote, { isLoading: isTagging }] = useAutoTagNoteMutation();
  const [expandNote, { isLoading: isExpanding }] = useExpandNoteMutation();
  const [improveWriting, { isLoading: isImproving }] = useImproveWritingMutation();

  // Related notes query
  const { data: relatedData, isLoading: isLoadingRelated } = useGetRelatedNotesQuery(
    { id: note?.id, limit: 4 },
    { skip: !note?.id }
  );
  const relatedNotes = relatedData?.data || [];

  // Dialog States
  const [expandOpen, setExpandOpen] = useState(false);
  const [expandInstruction, setExpandInstruction] = useState('');
  const [expandPreview, setExpandPreview] = useState(null);

  const [improveOpen, setImproveOpen] = useState(false);
  const [improveMode, setImproveMode] = useState('improve');
  const [improvePreview, setImprovePreview] = useState(null);

  const [suggestedTags, setSuggestedTags] = useState([]);
  const [successToast, setSuccessToast] = useState('');

  // Handle Summarize
  const handleSummarize = async () => {
    if (!note?.id) return;
    try {
      await summarizeNote({ id: note.id }).unwrap();
      setSuccessToast('Note summarized and saved!');
      setTimeout(() => setSuccessToast(''), 3500);
    } catch (err) {
      console.error(err);
    }
  };

  // Handle Auto-Tag
  const handleAutoTag = async () => {
    if (!note?.id) return;
    try {
      const res = await autoTagNote(note.id).unwrap();
      if (res.data?.tags) {
        setSuggestedTags(res.data.tags);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleApplyTag = (tag) => {
    if (onAddTags) {
      onAddTags([tag]);
      setSuggestedTags((prev) => prev.filter((t) => t !== tag));
    }
  };

  const handleApplyAllTags = () => {
    if (onAddTags && suggestedTags.length > 0) {
      onAddTags(suggestedTags);
      setSuggestedTags([]);
      setSuccessToast('All suggested tags added!');
      setTimeout(() => setSuccessToast(''), 3000);
    }
  };

  // Handle Expand
  const handleRunExpand = async () => {
    if (!note?.id) return;
    try {
      const res = await expandNote({
        id: note.id,
        instruction: expandInstruction || 'Elaborate with more details and structured sections.',
      }).unwrap();
      setExpandPreview(res.data?.expandedHtml);
    } catch (err) {
      console.error(err);
    }
  };

  const handleApplyExpanded = (mode = 'append') => {
    if (!expandPreview) return;
    if (mode === 'replace') {
      onApplyContent(expandPreview);
    } else {
      const current = note.richContent || note.content || '';
      onApplyContent(`${current}<br/>${expandPreview}`);
    }
    setExpandOpen(false);
    setExpandPreview(null);
    setExpandInstruction('');
    setSuccessToast('Note content expanded!');
    setTimeout(() => setSuccessToast(''), 3000);
  };

  // Handle Improve
  const handleRunImprove = async () => {
    const rawContent = note?.content || note?.richContent || '';
    if (!rawContent.trim()) return;
    try {
      const res = await improveWriting({
        text: rawContent,
        mode: improveMode,
      }).unwrap();
      setImprovePreview(res.data?.improvedText);
    } catch (err) {
      console.error(err);
    }
  };

  const handleApplyImprove = () => {
    if (!improvePreview) return;
    onApplyContent(improvePreview);
    setImproveOpen(false);
    setImprovePreview(null);
    setSuccessToast('Improved writing applied!');
    setTimeout(() => setSuccessToast(''), 3000);
  };

  if (!note) return null;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {/* Toast Notification */}
      {successToast && (
        <Alert
          severity="success"
          icon={<CheckIcon fontSize="inherit" />}
          sx={{
            py: 0.5,
            bgcolor: isDark ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.1)',
            color: isDark ? '#6ee7b7' : '#065f46',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: '8px',
          }}
        >
          {successToast}
        </Alert>
      )}

      {/* AI Action Buttons Grid */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
        {/* Summarize */}
        <Button
          size="small"
          variant="outlined"
          startIcon={isSummarizing ? <CircularProgress size={14} color="inherit" /> : <SummarizeIcon />}
          onClick={handleSummarize}
          disabled={isSummarizing}
          sx={{
            textTransform: 'none',
            borderRadius: '8px',
            borderColor: 'rgba(124, 58, 237, 0.4)',
            color: '#7C3AED',
            fontWeight: 600,
            fontSize: '0.8rem',
            '&:hover': {
              bgcolor: 'rgba(124, 58, 237, 0.08)',
              borderColor: '#7C3AED',
            },
          }}
        >
          {isSummarizing ? 'Summarizing...' : 'Summarize'}
        </Button>

        {/* Auto Tag */}
        <Button
          size="small"
          variant="outlined"
          startIcon={isTagging ? <CircularProgress size={14} color="inherit" /> : <TagIcon />}
          onClick={handleAutoTag}
          disabled={isTagging}
          sx={{
            textTransform: 'none',
            borderRadius: '8px',
            borderColor: 'rgba(14, 165, 233, 0.4)',
            color: '#0284c7',
            fontWeight: 600,
            fontSize: '0.8rem',
            '&:hover': {
              bgcolor: 'rgba(14, 165, 233, 0.08)',
              borderColor: '#0284c7',
            },
          }}
        >
          {isTagging ? 'Generating...' : 'Auto Tag'}
        </Button>

        {/* Expand Note */}
        <Button
          size="small"
          variant="outlined"
          startIcon={<ExpandIcon />}
          onClick={() => {
            setExpandPreview(null);
            setExpandOpen(true);
          }}
          sx={{
            textTransform: 'none',
            borderRadius: '8px',
            borderColor: 'rgba(16, 185, 129, 0.4)',
            color: '#059669',
            fontWeight: 600,
            fontSize: '0.8rem',
            '&:hover': {
              bgcolor: 'rgba(16, 185, 129, 0.08)',
              borderColor: '#059669',
            },
          }}
        >
          AI Expand
        </Button>

        {/* Improve Writing */}
        <Button
          size="small"
          variant="outlined"
          startIcon={<ImproveIcon />}
          onClick={() => {
            setImprovePreview(null);
            setImproveOpen(true);
          }}
          sx={{
            textTransform: 'none',
            borderRadius: '8px',
            borderColor: 'rgba(245, 158, 11, 0.4)',
            color: '#d97706',
            fontWeight: 600,
            fontSize: '0.8rem',
            '&:hover': {
              bgcolor: 'rgba(245, 158, 11, 0.08)',
              borderColor: '#d97706',
            },
          }}
        >
          Improve Writing
        </Button>
      </Box>

      {/* Suggested Tags Display */}
      {suggestedTags.length > 0 && (
        <Paper
          elevation={0}
          sx={{
            p: 1.5,
            borderRadius: '10px',
            bgcolor: isDark ? 'rgba(124, 58, 237, 0.08)' : 'rgba(124, 58, 237, 0.04)',
            border: '1px solid rgba(124, 58, 237, 0.2)',
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="caption" sx={{ fontWeight: 600, color: '#7C3AED' }}>
              Suggested Tags (Click to add)
            </Typography>
            <Button
              size="small"
              onClick={handleApplyAllTags}
              sx={{ textTransform: 'none', fontSize: '0.7rem', p: '2px 8px', color: '#7C3AED' }}
            >
              Add All
            </Button>
          </Box>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8 }}>
            {suggestedTags.map((tag) => (
              <Chip
                key={tag}
                label={`#${tag}`}
                size="small"
                onClick={() => handleApplyTag(tag)}
                onDelete={() => setSuggestedTags((prev) => prev.filter((t) => t !== tag))}
                deleteIcon={<AddIcon style={{ transform: 'rotate(45deg)' }} />}
                sx={{
                  bgcolor: isDark ? 'rgba(124, 58, 237, 0.2)' : 'rgba(124, 58, 237, 0.1)',
                  color: '#7C3AED',
                  fontWeight: 600,
                  cursor: 'pointer',
                  '&:hover': { bgcolor: 'rgba(124, 58, 237, 0.3)' },
                }}
              />
            ))}
          </Box>
        </Paper>
      )}

      {/* Summary Box */}
      {note.summary && (
        <Paper
          elevation={0}
          sx={{
            p: 1.5,
            borderRadius: '10px',
            bgcolor: isDark ? 'rgba(15, 23, 42, 0.6)' : '#f8fafc',
            border: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.06)',
            position: 'relative',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mb: 0.5 }}>
            <AiIcon sx={{ color: '#7C3AED', fontSize: 16 }} />
            <Typography variant="caption" sx={{ fontWeight: 700, color: '#7C3AED', textTransform: 'uppercase', letterSpacing: 0.5 }}>
              AI Summary
            </Typography>
          </Box>
          <Typography
            variant="body2"
            sx={{
              color: isDark ? '#cbd5e1' : '#475569',
              fontSize: '0.85rem',
              lineHeight: 1.5,
              whiteSpace: 'pre-wrap',
            }}
          >
            {note.summary}
          </Typography>
        </Paper>
      )}

      {/* Semantically Related Notes (LanceDB) */}
      {relatedNotes.length > 0 && (
        <Box sx={{ mt: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mb: 1 }}>
            <RelatedIcon sx={{ color: '#06B6D4', fontSize: 16 }} />
            <Typography variant="caption" sx={{ fontWeight: 700, color: isDark ? '#94a3b8' : '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Related Context (LanceDB)
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.8 }}>
            {relatedNotes.map((rel) => (
              <Box
                key={rel.id}
                onClick={() => onSelectRelatedNote && onSelectRelatedNote(rel.id)}
                sx={{
                  p: 1.2,
                  borderRadius: '8px',
                  bgcolor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                  border: isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.05)',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  '&:hover': {
                    bgcolor: isDark ? 'rgba(124, 58, 237, 0.1)' : 'rgba(124, 58, 237, 0.05)',
                    borderColor: 'rgba(124, 58, 237, 0.3)',
                    transform: 'translateX(2px)',
                  },
                }}
              >
                <Typography variant="body2" sx={{ fontWeight: 600, color: isDark ? '#f1f5f9' : '#0f172a', fontSize: '0.85rem' }}>
                  {rel.title || 'Untitled Note'}
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748b', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {rel.contentSnippet}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>
      )}

      {/* AI Expand Dialog */}
      <Dialog
        open={expandOpen}
        onClose={() => setExpandOpen(false)}
        maxWidth="md"
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
          <ExpandIcon sx={{ color: '#10B981' }} />
          Expand Note with AI
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: '#64748b', mb: 2 }}>
            Choose an expansion goal or type specific instructions for the AI:
          </Typography>

          {/* Quick presets */}
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
            {[
              'Add detailed action items and checklists',
              'Elaborate with technical architecture specifics',
              'Include pros/cons and risk assessment',
              'Provide concrete examples and implementation steps',
            ].map((preset) => (
              <Chip
                key={preset}
                label={preset}
                size="small"
                onClick={() => setExpandInstruction(preset)}
                sx={{
                  bgcolor: expandInstruction === preset ? '#10B981' : isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
                  color: expandInstruction === preset ? '#fff' : isDark ? '#cbd5e1' : '#334155',
                  cursor: 'pointer',
                  fontWeight: 500,
                }}
              />
            ))}
          </Box>

          <TextField
            fullWidth
            multiline
            rows={2}
            placeholder="e.g. Expand each section with architectural considerations..."
            value={expandInstruction}
            onChange={(e) => setExpandInstruction(e.target.value)}
            sx={{ mb: 2 }}
          />

          <Button
            variant="contained"
            onClick={handleRunExpand}
            disabled={isExpanding}
            startIcon={isExpanding ? <CircularProgress size={16} color="inherit" /> : <AiIcon />}
            sx={{ bgcolor: '#10B981', '&:hover': { bgcolor: '#059669' }, textTransform: 'none', borderRadius: '8px', mb: 2 }}
          >
            {isExpanding ? 'Generating Expansion...' : 'Generate Expansion'}
          </Button>

          {/* Expansion Preview */}
          {expandPreview && (
            <Paper
              elevation={0}
              sx={{
                p: 2,
                maxHeight: '280px',
                overflowY: 'auto',
                borderRadius: '8px',
                bgcolor: isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc',
                border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)',
                color: isDark ? '#e2e8f0' : '#1e293b',
              }}
              dangerouslySetInnerHTML={{ __html: expandPreview }}
            />
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setExpandOpen(false)} sx={{ color: '#64748b' }}>
            Cancel
          </Button>
          {expandPreview && (
            <>
              <Button onClick={() => handleApplyExpanded('replace')} sx={{ color: '#f59e0b', textTransform: 'none' }}>
                Replace Current Content
              </Button>
              <Button
                variant="contained"
                onClick={() => handleApplyExpanded('append')}
                sx={{ bgcolor: '#10B981', '&:hover': { bgcolor: '#059669' }, textTransform: 'none' }}
              >
                Append to Note
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>

      {/* AI Improve Writing Dialog */}
      <Dialog
        open={improveOpen}
        onClose={() => setImproveOpen(false)}
        maxWidth="md"
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
          <ImproveIcon sx={{ color: '#F59E0B' }} />
          Improve Writing with AI
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: '#64748b', mb: 2 }}>
            Select the enhancement style:
          </Typography>

          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
            {[
              { id: 'improve', label: 'Polish & Enhance' },
              { id: 'concise', label: 'Make Concise' },
              { id: 'fix_grammar', label: 'Fix Grammar & Spelling' },
              { id: 'professional', label: 'Professional Tone' },
              { id: 'bulletize', label: 'Convert to Bullets' },
              { id: 'action_items', label: 'Extract Action Items' },
            ].map((m) => (
              <Chip
                key={m.id}
                label={m.label}
                onClick={() => setImproveMode(m.id)}
                sx={{
                  bgcolor: improveMode === m.id ? '#F59E0B' : isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
                  color: improveMode === m.id ? '#fff' : isDark ? '#cbd5e1' : '#334155',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              />
            ))}
          </Box>

          <Button
            variant="contained"
            onClick={handleRunImprove}
            disabled={isImproving}
            startIcon={isImproving ? <CircularProgress size={16} color="inherit" /> : <AiIcon />}
            sx={{ bgcolor: '#F59E0B', '&:hover': { bgcolor: '#D97706' }, textTransform: 'none', borderRadius: '8px', mb: 2 }}
          >
            {isImproving ? 'Improving...' : 'Run Enhancement'}
          </Button>

          {improvePreview && (
            <Paper
              elevation={0}
              sx={{
                p: 2,
                maxHeight: '260px',
                overflowY: 'auto',
                borderRadius: '8px',
                bgcolor: isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc',
                border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)',
                color: isDark ? '#e2e8f0' : '#1e293b',
                whiteSpace: 'pre-wrap',
                fontSize: '0.9rem',
                lineHeight: 1.6,
              }}
            >
              {improvePreview}
            </Paper>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setImproveOpen(false)} sx={{ color: '#64748b' }}>
            Cancel
          </Button>
          {improvePreview && (
            <Button
              variant="contained"
              onClick={handleApplyImprove}
              sx={{ bgcolor: '#F59E0B', '&:hover': { bgcolor: '#D97706' }, textTransform: 'none' }}
            >
              Apply to Note
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AiActionsPanel;
