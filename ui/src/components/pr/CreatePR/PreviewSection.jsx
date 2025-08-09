import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  CircularProgress,
  Paper,
  TextField,
  Typography,
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
      <Typography gutterBottom variant='h6'>
        Preview
      </Typography>

      <Paper sx={{ p: 2, bgcolor: 'grey.100', mb: 2 }}>
        <Typography gutterBottom variant='subtitle1'>
          Title
        </Typography>
        <TextField
          fullWidth
          multiline
          InputProps={{
            endAdornment: !editableTitle && (
              <CircularProgress size={16} sx={{ mr: 1 }} />
            ),
          }}
          placeholder={!editableTitle ? 'Generating title...' : ''}
          size='small'
          sx={{ mb: 2 }}
          value={editableTitle}
          variant='outlined'
          onChange={e => setEditableTitle(e.target.value)}
        />

        <Typography gutterBottom variant='subtitle1'>
          Description
        </Typography>
        <TextField
          fullWidth
          multiline
          InputProps={{
            endAdornment: !editableDescription && (
              <CircularProgress size={16} sx={{ mr: 1 }} />
            ),
          }}
          placeholder={!editableDescription ? 'Generating description...' : ''}
          rows={8}
          size='small'
          sx={{
            mb: 2,
            '& .MuiInputBase-input': {
              fontFamily: 'monospace',
              fontSize: '0.875rem',
            },
          }}
          value={editableDescription}
          variant='outlined'
          onChange={e => setEditableDescription(e.target.value)}
        />

        <Box sx={{ mt: 2 }}>
          <Typography color='text.secondary' variant='subtitle2'>
            Branch: {preview.branchName}
          </Typography>
          {preview.aiGenerated ? (
            <Typography color='primary' variant='subtitle2'>
              AI-Generated Content (Streamed)
            </Typography>
          ) : null}
        </Box>
      </Paper>

      <Button
        color='primary'
        disabled={isLoading || !editableTitle || !editableDescription}
        variant='contained'
        onClick={handleConfirm}
      >
        {isLoading ? <CircularProgress size={24} /> : 'Create Pull Request'}
      </Button>
    </Box>
  );
};

export default PreviewSection;
