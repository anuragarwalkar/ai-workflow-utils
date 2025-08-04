import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
  Paper,
  CircularProgress,
  TextField,
} from '@mui/material';

const PreviewSection = ({ preview, onConfirm, isLoading }) => {
  const [editableTitle, setEditableTitle] = useState('');
  const [editableDescription, setEditableDescription] = useState('');

  // Initialize editable fields when preview changes
  useEffect(() => {
    if (preview) {
      setEditableTitle(preview.prTitle || '');
      setEditableDescription(preview.prDescription || '');
    }
  }, [preview]);

  const handleConfirm = () => {
    // Pass the edited values to the parent component
    onConfirm({
      ...preview,
      prTitle: editableTitle,
      prDescription: editableDescription,
    });
  };

  return (
    <Box sx={{ mt: 4 }}>
      <Typography variant='h6' gutterBottom>
        Preview
      </Typography>

      <Paper sx={{ p: 2, bgcolor: 'grey.100', mb: 2 }}>
        <Typography variant='subtitle1' gutterBottom>
          Title
        </Typography>
        <TextField
          fullWidth
          multiline
          value={editableTitle}
          onChange={e => setEditableTitle(e.target.value)}
          variant='outlined'
          size='small'
          sx={{ mb: 2 }}
          placeholder={!editableTitle ? 'Generating title...' : ''}
          InputProps={{
            endAdornment: !editableTitle && (
              <CircularProgress size={16} sx={{ mr: 1 }} />
            ),
          }}
        />

        <Typography variant='subtitle1' gutterBottom>
          Description
        </Typography>
        <TextField
          fullWidth
          multiline
          rows={8}
          value={editableDescription}
          onChange={e => setEditableDescription(e.target.value)}
          variant='outlined'
          size='small'
          sx={{
            mb: 2,
            '& .MuiInputBase-input': {
              fontFamily: 'monospace',
              fontSize: '0.875rem',
            },
          }}
          placeholder={!editableDescription ? 'Generating description...' : ''}
          InputProps={{
            endAdornment: !editableDescription && (
              <CircularProgress size={16} sx={{ mr: 1 }} />
            ),
          }}
        />

        <Box sx={{ mt: 2 }}>
          <Typography variant='subtitle2' color='text.secondary'>
            Branch: {preview.branchName}
          </Typography>
          {preview.aiGenerated && (
            <Typography variant='subtitle2' color='primary'>
              AI-Generated Content (Streamed)
            </Typography>
          )}
        </Box>
      </Paper>

      <Button
        variant='contained'
        color='primary'
        onClick={handleConfirm}
        disabled={isLoading || !editableTitle || !editableDescription}
      >
        {isLoading ? <CircularProgress size={24} /> : 'Create Pull Request'}
      </Button>
    </Box>
  );
};

export default PreviewSection;
