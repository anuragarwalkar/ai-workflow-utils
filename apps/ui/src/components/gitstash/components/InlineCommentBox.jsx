import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Chip,
  IconButton,
  CircularProgress,
} from '@mui/material';
import {
  Close as CloseIcon,
  Send as SendIcon,
  ChatBubbleOutline as CommentIcon,
} from '@mui/icons-material';

const InlineCommentBox = ({
  filePath,
  lineNumber,
  lineType,
  fileType,
  srcPath,
  projectKey,
  repoSlug,
  pullRequestId,
  onCommentAdded,
  onCancel,
}) => {
  const [commentText, setCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleSubmit = async () => {
    if (!commentText.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const anchor = {
        line: lineNumber,
        lineType: lineType || 'CONTEXT',
        fileType: fileType || (lineType === 'REMOVED' ? 'FROM' : 'TO'),
        path: filePath,
      };

      if (srcPath && srcPath !== filePath) {
        anchor.srcPath = srcPath;
      }

      await onCommentAdded({
        commentText: commentText.trim(),
        anchor,
      });

      setCommentText('');
    } catch (err) {
      console.error('Failed to post inline comment:', err);
      setErrorMessage(err?.data?.message || err?.message || 'Failed to post comment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === 'Escape') {
      onCancel();
    }
  };

  return (
    <Box
      sx={{
        my: 1.5,
        mx: 2,
        p: 2,
        borderRadius: 2,
        border: '1px solid #30363d',
        backgroundColor: '#161b22',
        color: '#e6edf3',
        boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
        maxWidth: '850px',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 1.5,
          pb: 1,
          borderBottom: '1px solid #21262d',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
          <CommentIcon sx={{ fontSize: 18, color: '#58a6ff' }} />
          <Typography variant="subtitle2" sx={{ fontWeight: 600, fontSize: '0.85rem', color: '#e6edf3' }}>
            Add Comment on Line {lineNumber}
          </Typography>
          <Chip
            label={lineType || 'LINE'}
            size="small"
            sx={{
              height: 20,
              fontSize: '0.7rem',
              fontWeight: 600,
              backgroundColor:
                lineType === 'ADDED'
                  ? 'rgba(46, 160, 67, 0.25)'
                  : lineType === 'REMOVED'
                  ? 'rgba(248, 81, 73, 0.25)'
                  : 'rgba(110, 118, 129, 0.2)',
              color:
                lineType === 'ADDED'
                  ? '#3fb950'
                  : lineType === 'REMOVED'
                  ? '#f85149'
                  : '#8b949e',
            }}
          />
        </Box>
        <IconButton size="small" onClick={onCancel} sx={{ color: '#8b949e', p: 0.5, '&:hover': { color: '#ffffff' } }}>
          <CloseIcon sx={{ fontSize: 16 }} />
        </IconButton>
      </Box>

      {/* Text Area */}
      <TextField
        inputRef={inputRef}
        fullWidth
        multiline
        minRows={3}
        maxRows={10}
        placeholder={`Leave a comment on line ${lineNumber}... (Markdown supported)`}
        value={commentText}
        onChange={(e) => setCommentText(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={isSubmitting}
        variant="outlined"
        size="small"
        sx={{
          '& .MuiOutlinedInput-root': {
            backgroundColor: '#0d1117',
            color: '#e6edf3',
            fontFamily: "'Segoe UI', -apple-system, sans-serif",
            fontSize: '0.875rem',
            '& fieldset': {
              borderColor: '#30363d',
            },
            '&:hover fieldset': {
              borderColor: '#58a6ff',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#58a6ff',
            },
          },
          '& textarea': {
            color: '#e6edf3',
          },
          '& textarea::placeholder': {
            color: '#8b949e',
            opacity: 1,
          },
        }}
      />

      {errorMessage && (
        <Typography variant="caption" color="error" sx={{ display: 'block', mt: 1 }}>
          {errorMessage}
        </Typography>
      )}

      {/* Actions */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mt: 1.5,
        }}
      >
        <Typography variant="caption" sx={{ color: '#8b949e', fontSize: '0.75rem' }}>
          Tip: Press <strong>Ctrl+Enter</strong> to submit
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            size="small"
            variant="outlined"
            onClick={onCancel}
            disabled={isSubmitting}
            sx={{
              textTransform: 'none',
              fontSize: '0.8125rem',
              color: '#c9d1d9',
              borderColor: '#30363d',
              '&:hover': {
                borderColor: '#8b949e',
                backgroundColor: 'rgba(255,255,255,0.05)',
              },
            }}
          >
            Cancel
          </Button>
          <Button
            size="small"
            variant="contained"
            onClick={handleSubmit}
            disabled={isSubmitting || !commentText.trim()}
            startIcon={
              isSubmitting ? (
                <CircularProgress size={14} color="inherit" />
              ) : (
                <SendIcon sx={{ fontSize: 14 }} />
              )
            }
            sx={{
              textTransform: 'none',
              fontSize: '0.8125rem',
              fontWeight: 600,
              backgroundColor: '#238636',
              color: '#ffffff',
              '&:hover': {
                backgroundColor: '#2ea043',
              },
              '&.Mui-disabled': {
                backgroundColor: 'rgba(35, 134, 54, 0.4)',
                color: 'rgba(255,255,255,0.4)',
              },
            }}
          >
            {isSubmitting ? 'Posting...' : 'Comment'}
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default InlineCommentBox;
