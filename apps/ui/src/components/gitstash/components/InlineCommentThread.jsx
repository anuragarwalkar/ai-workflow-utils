import React, { useState } from 'react';
import {
  Box,
  Typography,
  Avatar,
  Button,
  TextField,
  CircularProgress,
} from '@mui/material';
import {
  Reply as ReplyIcon,
  Send as SendIcon,
} from '@mui/icons-material';

const CommentItem = ({ comment, onReply, isReply = false }) => {
  const authorName =
    comment.author?.displayName ||
    comment.author?.name ||
    comment.author?.emailAddress ||
    'User';

  const authorInitials = authorName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  const formattedDate = comment.createdDate
    ? new Date(comment.createdDate).toLocaleString([], {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'Just now';

  return (
    <Box
      sx={{
        p: 1.5,
        borderBottom: isReply ? 'none' : '1px solid #21262d',
        '&:last-child': { borderBottom: 'none' },
      }}
    >
      {/* Author Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        <Avatar
          sx={{
            width: 24,
            height: 24,
            fontSize: '0.75rem',
            bgcolor: '#1f6feb',
            color: '#ffffff',
          }}
          src={comment.author?.avatarUrl}
        >
          {authorInitials}
        </Avatar>
        <Typography variant="subtitle2" sx={{ fontWeight: 600, fontSize: '0.8125rem', color: '#e6edf3' }}>
          {authorName}
        </Typography>
        <Typography variant="caption" sx={{ color: '#8b949e', fontSize: '0.75rem' }}>
          {formattedDate}
        </Typography>
      </Box>

      {/* Comment Body */}
      <Typography
        variant="body2"
        sx={{
          fontSize: '0.85rem',
          lineHeight: 1.5,
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          color: '#e6edf3',
          pl: 4,
        }}
      >
        {comment.text}
      </Typography>

      {/* Replies */}
      {comment.comments && comment.comments.length > 0 && (
        <Box sx={{ pl: 4, mt: 1, borderLeft: '2px solid #30363d' }}>
          {comment.comments.map((reply) => (
            <CommentItem key={reply.id} comment={reply} isReply={true} />
          ))}
        </Box>
      )}
    </Box>
  );
};

const InlineCommentThread = ({
  comments = [],
  filePath,
  lineNumber,
  lineType,
  onAddReply,
}) => {
  const [replyingToId, setReplyingToId] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePostReply = async (parentId) => {
    if (!replyText.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onAddReply({
        commentText: replyText.trim(),
        parent: { id: parentId },
        anchor: {
          path: filePath,
          line: lineNumber,
          lineType,
          fileType: lineType === 'REMOVED' ? 'FROM' : 'TO',
        },
      });
      setReplyText('');
      setReplyingToId(null);
    } catch (err) {
      console.error('Failed to post reply:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!comments || comments.length === 0) return null;

  return (
    <Box
      sx={{
        my: 1.5,
        mx: 2,
        borderRadius: 2,
        border: '1px solid #30363d',
        backgroundColor: '#161b22',
        color: '#e6edf3',
        boxShadow: '0 2px 10px rgba(0,0,0,0.4)',
        overflow: 'hidden',
        maxWidth: '850px',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {comments.map((comment) => (
        <Box key={comment.id || Math.random()}>
          <CommentItem comment={comment} />

          {/* Reply trigger / form */}
          {replyingToId === comment.id ? (
            <Box sx={{ p: 1.5, pt: 0, pl: 5 }}>
              <TextField
                fullWidth
                multiline
                minRows={2}
                placeholder="Write a reply..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                size="small"
                variant="outlined"
                sx={{
                  mb: 1,
                  '& .MuiOutlinedInput-root': {
                    fontSize: '0.8125rem',
                    backgroundColor: '#0d1117',
                    color: '#e6edf3',
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
                }}
              />
              <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                <Button
                  size="small"
                  onClick={() => {
                    setReplyingToId(null);
                    setReplyText('');
                  }}
                  sx={{ color: '#8b949e', textTransform: 'none' }}
                >
                  Cancel
                </Button>
                <Button
                  size="small"
                  variant="contained"
                  disabled={!replyText.trim() || isSubmitting}
                  onClick={() => handlePostReply(comment.id)}
                  startIcon={
                    isSubmitting ? (
                      <CircularProgress size={12} color="inherit" />
                    ) : (
                      <SendIcon sx={{ fontSize: 12 }} />
                    )
                  }
                  sx={{
                    textTransform: 'none',
                    fontSize: '0.75rem',
                    backgroundColor: '#238636',
                    color: '#ffffff',
                    '&:hover': {
                      backgroundColor: '#2ea043',
                    },
                  }}
                >
                  Reply
                </Button>
              </Box>
            </Box>
          ) : (
            <Box sx={{ px: 2, pb: 1, display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                size="small"
                startIcon={<ReplyIcon sx={{ fontSize: 14 }} />}
                onClick={() => setReplyingToId(comment.id)}
                sx={{ textTransform: 'none', fontSize: '0.75rem', color: '#8b949e', '&:hover': { color: '#e6edf3' } }}
              >
                Reply
              </Button>
            </Box>
          )}
        </Box>
      ))}
    </Box>
  );
};

export default InlineCommentThread;
