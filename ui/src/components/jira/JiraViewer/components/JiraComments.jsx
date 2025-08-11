import React, { useState } from 'react';
import {
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Menu,
  MenuItem,
  Paper,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  AutoAwesome,
  Comment,
  Delete,
  Edit,
  FormatQuote,
  MoreVert,
  Reply,
  Send,
  ThumbDown,
  ThumbUp,
} from '@mui/icons-material';
import { AnimatePresence, motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  useFormatCommentMutation,
  useGenerateCommentReplyMutation,
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
        animate={{ opacity: 1, y: 0 }}
        elevation={0}
        initial={{ opacity: 0, y: 20 }}
        sx={{
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: 3,
          overflow: 'hidden',
        }}
        transition={{ duration: 0.5, delay: 0.3 }}
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
          <Typography sx={{ fontWeight: 600 }} variant='h6'>
            Comments ({comments.length})
          </Typography>
          <Chip
            color='primary'
            icon={<AutoAwesome />}
            label='AI Enhanced'
            size='small'
            sx={{ ml: 'auto', fontSize: '0.75rem' }}
            variant='outlined'
          />
        </Box>

        <Box sx={{ p: 3 }}>
          {/* New Comment Input */}
          <MotionBox
            animate={{ opacity: 1, y: 0 }}
            initial={{ opacity: 0, y: 10 }}
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
              placeholder='Add a comment...'
              rows={3}
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
              value={newComment}
              variant='outlined'
              onChange={e => setNewComment(e.target.value)}
            />
            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
              <Button
                size='small'
                startIcon={<AutoAwesome />}
                variant='outlined'
                onClick={() => {
                  // AI-powered comment suggestion
                  setNewComment('Based on the issue description, I suggest we...');
                }}
              >
                AI Suggest
              </Button>
              <Button
                disabled={!newComment.trim()}
                startIcon={<Send />}
                sx={{
                  background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
                }}
                variant='contained'
              >
                Post Comment
              </Button>
            </Box>
          </MotionBox>

          {/* Comments List */}
          <motion.div animate='visible' initial='hidden' variants={containerVariants}>
            {comments.map(comment => (
              <MotionBox key={comment.id} sx={{ mb: 3 }} variants={itemVariants}>
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
                      <Typography sx={{ fontWeight: 600 }} variant='subtitle2'>
                        {comment.author.displayName}
                      </Typography>
                      <Typography color='text.secondary' variant='caption'>
                        {formatDate(comment.created)}
                        {comment.created !== comment.updated && ' (edited)'}
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Tooltip title='Reply with AI'>
                        <IconButton
                          size='small'
                          sx={{ color: 'primary.main' }}
                          onClick={() => handleReply(comment)}
                        >
                          <Reply />
                        </IconButton>
                      </Tooltip>

                      <IconButton
                        size='small'
                        sx={{ color: 'text.secondary' }}
                        onClick={e => handleMenuOpen(e, comment)}
                      >
                        <MoreVert />
                      </IconButton>
                    </Box>
                  </Box>

                  {/* Comment Body */}
                  <Box sx={{ ml: 5 }}>
                    <ReactMarkdown
                      components={{
                        p: ({ children }) => (
                          <Typography sx={{ mb: 1, lineHeight: 1.6 }} variant='body2'>
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
                      remarkPlugins={[remarkGfm]}
                    >
                      {comment.body}
                    </ReactMarkdown>

                    {/* Comment Actions */}
                    <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                      <IconButton color='success' size='small'>
                        <ThumbUp fontSize='small' />
                      </IconButton>
                      <IconButton color='error' size='small'>
                        <ThumbDown fontSize='small' />
                      </IconButton>
                      <Button
                        size='small'
                        startIcon={<Reply />}
                        sx={{ ml: 1 }}
                        onClick={() => handleReply(comment)}
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
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      initial={{ opacity: 0, height: 0 }}
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
                          placeholder={`Reply to ${comment.author.displayName}...`}
                          rows={2}
                          sx={{ mb: 2 }}
                          value={replyText}
                          variant='outlined'
                          onChange={e => setReplyText(e.target.value)}
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
                            startIcon={<AutoAwesome />}
                            variant='outlined'
                            onClick={() => handleAiAction('reply')}
                          >
                            AI Reply
                          </Button>
                          <Button
                            disabled={!replyText.trim()}
                            size='small'
                            startIcon={<Send />}
                            sx={{
                              background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
                            }}
                            variant='contained'
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
        PaperProps={{
          sx: {
            background: 'rgba(0, 0, 0, 0.9)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          },
        }}
        onClose={handleMenuClose}
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
        fullWidth
        maxWidth='md'
        open={aiDialogOpen}
        PaperProps={{
          sx: {
            background: 'rgba(0, 0, 0, 0.9)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          },
        }}
        onClose={() => setAiDialogOpen(false)}
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
              <Typography color='text.secondary' sx={{ mb: 2 }} variant='subtitle2'>
                AI Generated {aiAction === 'reply' ? 'Reply' : 'Formatted Comment'}:
              </Typography>
              <Paper
                sx={{
                  p: 2,
                  backgroundColor: 'rgba(102, 126, 234, 0.05)',
                  border: '1px solid rgba(102, 126, 234, 0.3)',
                }}
              >
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{aiResult}</ReactMarkdown>
              </Paper>
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 3 }}>
          <Button variant='outlined' onClick={() => setAiDialogOpen(false)}>
            Close
          </Button>
          {!isProcessing && (
            <Button
              sx={{
                background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
              }}
              variant='contained'
              onClick={() => {
                if (aiAction === 'reply') {
                  setReplyText(aiResult);
                }
                setAiDialogOpen(false);
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
