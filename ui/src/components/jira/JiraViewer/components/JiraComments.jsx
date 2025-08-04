import React, { useState } from 'react';
import {
  Paper,
  Typography,
  Box,
  Avatar,
  Divider,
  IconButton,
  Button,
  TextField,
  Menu,
  MenuItem,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Tooltip,
} from '@mui/material';
import {
  Comment,
  Reply,
  MoreVert,
  AutoAwesome,
  Send,
  FormatQuote,
  Edit,
  Delete,
  ThumbUp,
  ThumbDown,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  useGenerateCommentReplyMutation,
  useFormatCommentMutation,
} from '../../../../store/api/jiraApi';

const MotionPaper = motion(Paper);
const MotionBox = motion(Box);

const JiraComments = ({ jiraData }) => {
  const [generateCommentReply] = useGenerateCommentReplyMutation();
  const [formatComment] = useFormatCommentMutation();

  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedComment, setSelectedComment] = useState(null);
  const [aiDialogOpen, setAiDialogOpen] = useState(false);
  const [aiAction, setAiAction] = useState('');
  const [aiResult, setAiResult] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Mock comments data (in real app, this would come from Jira API)
  const comments = jiraData?.fields?.comment?.comments || [
    {
      id: '1',
      author: {
        displayName: 'John Doe',
        emailAddress: 'john@example.com',
        avatarUrls: { '24x24': '' },
      },
      body: 'This issue needs more investigation. The error seems to occur intermittently.',
      created: '2024-01-15T10:30:00.000Z',
      updated: '2024-01-15T10:30:00.000Z',
    },
    {
      id: '2',
      author: {
        displayName: 'Jane Smith',
        emailAddress: 'jane@example.com',
        avatarUrls: { '24x24': '' },
      },
      body: 'I can reproduce this issue on the latest build. Here are the steps:\n\n1. Navigate to the dashboard\n2. Click on the reports section\n3. Error occurs when trying to export data',
      created: '2024-01-15T14:20:00.000Z',
      updated: '2024-01-15T14:20:00.000Z',
    },
  ];

  const handleMenuOpen = (event, comment) => {
    setAnchorEl(event.currentTarget);
    setSelectedComment(comment);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedComment(null);
  };

  const handleAiAction = async action => {
    setAiAction(action);
    setAiDialogOpen(true);
    setIsProcessing(true);

    try {
      let result;
      const context = `Issue: ${jiraData?.fields?.summary}\nType: ${jiraData?.fields?.issuetype?.name}`;

      switch (action) {
        case 'reply':
          result = await generateCommentReply({
            comment: selectedComment.body,
            context,
            tone: 'professional',
          }).unwrap();
          setAiResult(result.data.suggestedReply);
          break;

        case 'format':
          result = await formatComment({
            comment: selectedComment.body,
            format: 'jira',
          }).unwrap();
          setAiResult(result.data.formatted);
          break;

        default:
          setAiResult('AI action not implemented yet.');
      }
    } catch {
      setAiResult('Failed to process request. Please try again.');
    } finally {
      setIsProcessing(false);
    }

    handleMenuClose();
  };

  const handleReply = comment => {
    setReplyTo(comment);
    setReplyText('');
  };

  const formatDate = dateString => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 },
  };

  return (
    <>
      <MotionPaper
        elevation={0}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        sx={{
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: 3,
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <Box
          sx={{
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            px: 3,
            py: 2,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
          }}
        >
          <Comment color='primary' />
          <Typography variant='h6' sx={{ fontWeight: 600 }}>
            Comments ({comments.length})
          </Typography>
          <Chip
            label='AI Enhanced'
            size='small'
            color='primary'
            variant='outlined'
            icon={<AutoAwesome />}
            sx={{ ml: 'auto', fontSize: '0.75rem' }}
          />
        </Box>

        <Box sx={{ p: 3 }}>
          {/* New Comment Input */}
          <MotionBox
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            sx={{
              mb: 3,
              p: 2,
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: 2,
              background: 'rgba(255, 255, 255, 0.02)',
            }}
          >
            <TextField
              fullWidth
              multiline
              rows={3}
              placeholder='Add a comment...'
              value={newComment}
              onChange={e => setNewComment(e.target.value)}
              variant='outlined'
              sx={{
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  '& fieldset': {
                    borderColor: 'rgba(255, 255, 255, 0.2)',
                  },
                  '&:hover fieldset': {
                    borderColor: 'rgba(102, 126, 234, 0.5)',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: 'rgba(102, 126, 234, 0.8)',
                  },
                },
              }}
            />
            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
              <Button
                variant='outlined'
                startIcon={<AutoAwesome />}
                size='small'
                onClick={() => {
                  // AI-powered comment suggestion
                  setNewComment(
                    'Based on the issue description, I suggest we...'
                  );
                }}
              >
                AI Suggest
              </Button>
              <Button
                variant='contained'
                startIcon={<Send />}
                disabled={!newComment.trim()}
                sx={{
                  background:
                    'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
                }}
              >
                Post Comment
              </Button>
            </Box>
          </MotionBox>

          {/* Comments List */}
          <motion.div
            variants={containerVariants}
            initial='hidden'
            animate='visible'
          >
            {comments.map(comment => (
              <MotionBox
                key={comment.id}
                variants={itemVariants}
                sx={{ mb: 3 }}
              >
                <Box
                  sx={{
                    p: 3,
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: 2,
                    background: 'rgba(255, 255, 255, 0.02)',
                    position: 'relative',
                    '&:hover': {
                      border: '1px solid rgba(102, 126, 234, 0.3)',
                      background: 'rgba(255, 255, 255, 0.05)',
                    },
                  }}
                >
                  {/* Comment Header */}
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar
                      src={comment.author.avatarUrls?.['24x24']}
                      sx={{ width: 32, height: 32, mr: 2 }}
                    >
                      {comment.author.displayName[0]}
                    </Avatar>

                    <Box sx={{ flex: 1 }}>
                      <Typography variant='subtitle2' sx={{ fontWeight: 600 }}>
                        {comment.author.displayName}
                      </Typography>
                      <Typography variant='caption' color='text.secondary'>
                        {formatDate(comment.created)}
                        {comment.created !== comment.updated && ' (edited)'}
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Tooltip title='Reply with AI'>
                        <IconButton
                          size='small'
                          onClick={() => handleReply(comment)}
                          sx={{ color: 'primary.main' }}
                        >
                          <Reply />
                        </IconButton>
                      </Tooltip>

                      <IconButton
                        size='small'
                        onClick={e => handleMenuOpen(e, comment)}
                        sx={{ color: 'text.secondary' }}
                      >
                        <MoreVert />
                      </IconButton>
                    </Box>
                  </Box>

                  {/* Comment Body */}
                  <Box sx={{ ml: 5 }}>
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        p: ({ children }) => (
                          <Typography
                            variant='body2'
                            sx={{ mb: 1, lineHeight: 1.6 }}
                          >
                            {children}
                          </Typography>
                        ),
                        code: ({ children }) => (
                          <Box
                            component='code'
                            sx={{
                              background: 'rgba(102, 126, 234, 0.1)',
                              px: 1,
                              py: 0.5,
                              borderRadius: 1,
                              fontSize: '0.85em',
                              fontFamily: 'monospace',
                            }}
                          >
                            {children}
                          </Box>
                        ),
                      }}
                    >
                      {comment.body}
                    </ReactMarkdown>

                    {/* Comment Actions */}
                    <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                      <IconButton size='small' color='success'>
                        <ThumbUp fontSize='small' />
                      </IconButton>
                      <IconButton size='small' color='error'>
                        <ThumbDown fontSize='small' />
                      </IconButton>
                      <Button
                        size='small'
                        startIcon={<Reply />}
                        onClick={() => handleReply(comment)}
                        sx={{ ml: 1 }}
                      >
                        Reply
                      </Button>
                    </Box>
                  </Box>
                </Box>

                {/* Reply Input */}
                <AnimatePresence>
                  {replyTo?.id === comment.id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Box
                        sx={{
                          mt: 2,
                          ml: 5,
                          p: 2,
                          border: '1px solid rgba(102, 126, 234, 0.3)',
                          borderRadius: 2,
                          background: 'rgba(102, 126, 234, 0.05)',
                        }}
                      >
                        <TextField
                          fullWidth
                          multiline
                          rows={2}
                          placeholder={`Reply to ${comment.author.displayName}...`}
                          value={replyText}
                          onChange={e => setReplyText(e.target.value)}
                          variant='outlined'
                          sx={{ mb: 2 }}
                        />
                        <Box
                          sx={{
                            display: 'flex',
                            gap: 1,
                            justifyContent: 'flex-end',
                          }}
                        >
                          <Button size='small' onClick={() => setReplyTo(null)}>
                            Cancel
                          </Button>
                          <Button
                            size='small'
                            variant='outlined'
                            startIcon={<AutoAwesome />}
                            onClick={() => handleAiAction('reply')}
                          >
                            AI Reply
                          </Button>
                          <Button
                            size='small'
                            variant='contained'
                            startIcon={<Send />}
                            disabled={!replyText.trim()}
                            sx={{
                              background:
                                'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
                            }}
                          >
                            Reply
                          </Button>
                        </Box>
                      </Box>
                    </motion.div>
                  )}
                </AnimatePresence>
              </MotionBox>
            ))}
          </motion.div>
        </Box>
      </MotionPaper>

      {/* Comment Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        PaperProps={{
          sx: {
            background: 'rgba(0, 0, 0, 0.9)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          },
        }}
      >
        <MenuItem onClick={() => handleAiAction('reply')}>
          <AutoAwesome sx={{ mr: 1 }} />
          Generate AI Reply
        </MenuItem>
        <MenuItem onClick={() => handleAiAction('format')}>
          <FormatQuote sx={{ mr: 1 }} />
          Format with AI
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleMenuClose}>
          <Edit sx={{ mr: 1 }} />
          Edit Comment
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <Delete sx={{ mr: 1 }} />
          Delete Comment
        </MenuItem>
      </Menu>

      {/* AI Action Dialog */}
      <Dialog
        open={aiDialogOpen}
        onClose={() => setAiDialogOpen(false)}
        maxWidth='md'
        fullWidth
        PaperProps={{
          sx: {
            background: 'rgba(0, 0, 0, 0.9)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          },
        }}
      >
        <DialogTitle
          sx={{
            background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            gap: 1,
          }}
        >
          <AutoAwesome />
          AI {aiAction === 'reply' ? 'Reply Suggestion' : 'Comment Formatting'}
        </DialogTitle>

        <DialogContent sx={{ mt: 2 }}>
          {isProcessing ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 4 }}>
              <CircularProgress size={24} />
              <Typography>Processing with AI...</Typography>
            </Box>
          ) : (
            <Box>
              <Typography
                variant='subtitle2'
                color='text.secondary'
                sx={{ mb: 2 }}
              >
                AI Generated{' '}
                {aiAction === 'reply' ? 'Reply' : 'Formatted Comment'}:
              </Typography>
              <Paper
                sx={{
                  p: 2,
                  backgroundColor: 'rgba(102, 126, 234, 0.05)',
                  border: '1px solid rgba(102, 126, 234, 0.3)',
                }}
              >
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {aiResult}
                </ReactMarkdown>
              </Paper>
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setAiDialogOpen(false)} variant='outlined'>
            Close
          </Button>
          {!isProcessing && (
            <Button
              onClick={() => {
                if (aiAction === 'reply') {
                  setReplyText(aiResult);
                }
                setAiDialogOpen(false);
              }}
              variant='contained'
              sx={{
                background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
              }}
            >
              Use This {aiAction === 'reply' ? 'Reply' : 'Format'}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </>
  );
};

export default JiraComments;
