import React, { useState, useEffect } from 'react';
import { CircularProgress, Tooltip, Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField } from '@mui/material';
import {
  AddComment as AddCommentIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon
} from '@mui/icons-material';
import { useAddPRCommentMutation } from '../../../store/api/prApi';
import { ButtonContainer, ActionButton } from './IssueCommentButton.style';
import NotificationSnackbar from '../../common/NotificationSnackbar';

const IssueCommentButton = ({ issue, projectKey, repoSlug, pullRequestId, onPosted }) => {
  const [addPRComment, { isLoading }] = useAddPRCommentMutation();
  const [status, setStatus] = useState(issue.posted ? 'success' : 'idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editableComment, setEditableComment] = useState('');

  const formatComment = () => {
    return `**[${issue.severity}] ${issue.title}**\n📁 File: \`${issue.file}\`\n\n${issue.description}`;
  };

  const handleOpenModal = () => {
    setEditableComment(formatComment());
    setModalOpen(true);
  };

  const handleConfirmPost = async () => {
    if (status === 'success' || isLoading) return;

    try {
      setStatus('loading');
      setModalOpen(false);
      await addPRComment({
        projectKey,
        repoSlug,
        pullRequestId,
        commentText: editableComment,
      }).unwrap();
      
      setStatus('success');
      if (onPosted) onPosted(issue.id);
    } catch (err) {
      console.error('Failed to post comment:', err);
      setStatus('error');
      setErrorMsg(err?.data?.message || err?.message || 'Failed to post comment');
      setSnackbarOpen(true);
    }
  };

  const renderIcon = () => {
    if (isLoading || status === 'loading') {
      return <CircularProgress size={20} color="inherit" />;
    }
    if (status === 'success') {
      return <CheckCircleIcon fontSize="small" />;
    }
    if (status === 'error') {
      return <ErrorIcon fontSize="small" color="error" />;
    }
    return <AddCommentIcon fontSize="small" />;
  };

  const getTooltipTitle = () => {
    if (status === 'success') return 'Comment Posted';
    if (status === 'error') return 'Failed to Post (Click to Retry)';
    return 'Add as PR Comment';
  };

  return (
    <>
      <ButtonContainer>
        <Tooltip title={getTooltipTitle()}>
          <span>
            <ActionButton
              onClick={handleOpenModal}
              disabled={status === 'success' || isLoading}
              success={status === 'success'}
              size="small"
            >
              {renderIcon()}
            </ActionButton>
          </span>
        </Tooltip>
      </ButtonContainer>

      <NotificationSnackbar
        open={snackbarOpen}
        message={errorMsg}
        severity="error"
        onClose={() => setSnackbarOpen(false)}
      />

      <Dialog open={modalOpen} onClose={() => setModalOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Edit PR Comment</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Comment Content (Markdown Supported)"
            type="text"
            fullWidth
            multiline
            rows={10}
            variant="outlined"
            value={editableComment}
            onChange={(e) => setEditableComment(e.target.value)}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setModalOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleConfirmPost} 
            variant="contained" 
            disabled={isLoading || !editableComment.trim()}
            startIcon={isLoading ? <CircularProgress size={16} color="inherit" /> : <AddCommentIcon />}
          >
            {isLoading ? 'Posting...' : 'Post Comment'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default IssueCommentButton;
