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
      const payload = {
        projectKey,
        repoSlug,
        pullRequestId,
        commentText: content.trim(),
      };

      if (filename.trim()) {
        const parsedLine = parseInt(lineNumber.trim(), 10);
        if (!isNaN(parsedLine) && parsedLine > 0) {
          payload.anchor = {
            path: filename.trim(),
            line: parsedLine,
            lineType: 'CONTEXT',
            fileType: 'TO',
          };
        }
      }

      await addPRComment(payload).unwrap();
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
        <DialogTitle>Add Pull Request Comment</DialogTitle>
        <DialogContent>
          <TextField
            margin="dense"
            label="File Path (Optional - will post inline to this file if provided)"
            type="text"
            fullWidth
            variant="outlined"
            value={filename}
            placeholder="e.g. src/features/myFile.tsx"
            onChange={(e) => setFilename(e.target.value)}
            sx={{ mt: 2 }}
          />
          <TextField
            margin="dense"
            label="Line Number (Optional - will anchor to line if provided)"
            type="number"
            fullWidth
            variant="outlined"
            value={lineNumber}
            placeholder="e.g. 45"
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
