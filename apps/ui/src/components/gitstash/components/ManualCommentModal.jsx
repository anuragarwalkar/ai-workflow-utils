import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  CircularProgress,
} from '@mui/material';
import { AddComment as AddCommentIcon } from '@mui/icons-material';
import { useAddPRCommentMutation } from '../../../store/api/prApi';
import NotificationSnackbar from '../../common/NotificationSnackbar';

const ManualCommentModal = ({ open, onClose, projectKey, repoSlug, pullRequestId }) => {
  const [addPRComment, { isLoading }] = useAddPRCommentMutation();
  const [filename, setFilename] = useState('');
  const [lineNumber, setLineNumber] = useState('');
  const [content, setContent] = useState('');
  
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleConfirmPost = async () => {
    if (isLoading || !content.trim()) return;

    try {
      let formattedComment = '';
      if (filename.trim()) {
        formattedComment += `📁 File: \`${filename.trim()}\``;
        if (lineNumber.trim()) {
          formattedComment += `, Line: \`${lineNumber.trim()}\``;
        }
        formattedComment += '\n\n';
      }
      formattedComment += content.trim();

      await addPRComment({
        projectKey,
        repoSlug,
        pullRequestId,
        commentText: formattedComment,
      }).unwrap();
      
      handleClose();
    } catch (err) {
      console.error('Failed to post comment:', err);
      setErrorMsg(err?.data?.message || err?.message || 'Failed to post comment');
      setSnackbarOpen(true);
    }
  };

  const handleClose = () => {
    setFilename('');
    setLineNumber('');
    setContent('');
    onClose();
  };

  return (
    <>
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>Add Manual Comment</DialogTitle>
        <DialogContent>
          <TextField
            margin="dense"
            label="Filename (Optional)"
            type="text"
            fullWidth
            variant="outlined"
            value={filename}
            onChange={(e) => setFilename(e.target.value)}
            sx={{ mt: 2 }}
          />
          <TextField
            margin="dense"
            label="Line Number (Optional)"
            type="text"
            fullWidth
            variant="outlined"
            value={lineNumber}
            onChange={(e) => setLineNumber(e.target.value)}
            sx={{ mt: 2 }}
          />
          <TextField
            margin="dense"
            label="Comment Content (Markdown Supported)"
            type="text"
            fullWidth
            multiline
            rows={6}
            variant="outlined"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            sx={{ mt: 2 }}
            required
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button 
            onClick={handleConfirmPost} 
            variant="contained" 
            disabled={isLoading || !content.trim()}
            startIcon={isLoading ? <CircularProgress size={16} color="inherit" /> : <AddCommentIcon />}
          >
            {isLoading ? 'Posting...' : 'Post Comment'}
          </Button>
        </DialogActions>
      </Dialog>

      <NotificationSnackbar
        open={snackbarOpen}
        message={errorMsg}
        severity="error"
        onClose={() => setSnackbarOpen(false)}
      />
    </>
  );
};

export default ManualCommentModal;
