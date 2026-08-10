import React, { useState } from 'react';
import { CircularProgress, Tooltip } from '@mui/material';
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

  const formatComment = () => {
    return `**[${issue.severity}] ${issue.title}**\n📁 File: \`${issue.file}\`\n\n${issue.description}`;
  };

  const handlePostComment = async () => {
    if (status === 'success' || isLoading) return;

    try {
      setStatus('loading');
      await addPRComment({
        projectKey,
        repoSlug,
        pullRequestId,
        commentText: formatComment(),
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
              onClick={handlePostComment}
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
    </>
  );
};

export default IssueCommentButton;
