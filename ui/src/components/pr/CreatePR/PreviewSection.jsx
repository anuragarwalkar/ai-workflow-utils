import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  CircularProgress,
  Paper,
  Typography,
} from '@mui/material';
import DescriptionEditor from './DescriptionEditor';
import TitleEditor from './TitleEditor';

// Preview Info Component
const PreviewInfo = ({ preview }) => (
  <Box sx={{ mt: 2 }}>
    <Typography color='text.secondary' variant='subtitle2'>
      Branch: {preview?.branchName}
    </Typography>
    {preview?.aiGenerated ? (
      <Typography color='primary' variant='subtitle2'>
        AI-Generated Content (Streamed)
      </Typography>
    ) : null}
  </Box>
);

// Preview Form Component
const PreviewForm = ({
  editableTitle,
  setEditableTitle,
  editableDescription,
  setEditableDescription,
  descriptionMode,
  setDescriptionMode,
  preview,
}) => (
  <Paper sx={{ p: 2, bgcolor: 'grey.100', mb: 2 }}>
    <TitleEditor title={editableTitle} onChange={setEditableTitle} />
    <DescriptionEditor
      description={editableDescription}
      mode={descriptionMode}
      onChange={setEditableDescription}
      onModeChange={setDescriptionMode}
    />
    <PreviewInfo preview={preview} />
  </Paper>
);

// Hook for managing preview state
const usePreviewState = preview => {
  const [editableTitle, setEditableTitle] = useState('');
  const [editableDescription, setEditableDescription] = useState('');
  const [descriptionMode, setDescriptionMode] = useState('view');

  useEffect(() => {
    if (preview) {
      setEditableTitle(preview.prTitle || '');
      setEditableDescription(preview.prDescription || '');
    }
  }, [preview]);

  return {
    editableTitle,
    setEditableTitle,
    editableDescription,
    setEditableDescription,
    descriptionMode,
    setDescriptionMode,
  };
};

// Render preview content
const renderPreviewContent = (formProps, preview) => (
  <>
    <Typography gutterBottom variant='h6'>
      Preview
    </Typography>
    <PreviewForm {...formProps} preview={preview} />
  </>
);

const PreviewSection = ({ preview, onConfirm, isLoading }) => {
  const previewState = usePreviewState(preview);

  const handleConfirm = () => {
    onConfirm({
      ...preview,
      prTitle: previewState.editableTitle,
      prDescription: previewState.editableDescription,
    });
  };

  const isDisabled =
    isLoading ||
    !previewState.editableTitle ||
    !previewState.editableDescription;

  return (
    <Box sx={{ mt: 4 }}>
      {renderPreviewContent(previewState, preview)}
      <Button
        color='primary'
        disabled={isDisabled}
        variant='contained'
        onClick={handleConfirm}
      >
        {isLoading ? <CircularProgress size={24} /> : 'Create Pull Request'}
      </Button>
    </Box>
  );
};

export default PreviewSection;
