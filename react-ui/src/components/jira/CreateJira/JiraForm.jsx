import React, { useEffect } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Stack,
  CircularProgress,
  styled,
} from '@mui/material';
import { CloudUpload } from '@mui/icons-material';
import { useSelector, useDispatch } from 'react-redux';
import { setPrompt, setImageFile } from '../../../store/slices/jiraSlice';
import { usePreviewJiraMutation } from '../../../store/api/jiraApi';
import { showNotification } from '../../../store/slices/uiSlice';
import { setPreviewData } from '../../../store/slices/jiraSlice';

const VisuallyHiddenInput = styled('input')({
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(50%)',
  height: 1,
  overflow: 'hidden',
  position: 'absolute',
  bottom: 0,
  left: 0,
  whiteSpace: 'nowrap',
  width: 1,
});

const JiraForm = () => {
  const dispatch = useDispatch();
  const { prompt, imageFile, isPreviewLoading } = useSelector(
    (state) => state.jira.createJira
  );
  
  const [previewJira, { isLoading: isPreviewMutationLoading }] = usePreviewJiraMutation();

  // Check URL params for prompt on component mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const promptParam = urlParams.get('prompt');
    if (promptParam) {
      dispatch(setPrompt(decodeURIComponent(promptParam)));
    }
  }, [dispatch]);

  const handlePromptChange = (event) => {
    dispatch(setPrompt(event.target.value));
  };

  const handleImageChange = (event) => {
    const file = event.target.files[0];
    dispatch(setImageFile(file));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!imageFile) {
      dispatch(showNotification({
        message: 'Please upload an image.',
        severity: 'error'
      }));
      return;
    }

    // Convert file to base64
    const reader = new FileReader();
    reader.onload = async () => {
      const base64Image = reader.result.split(',')[1];

      // Update URL with prompt
      const url = new URL(window.location.href);
      url.searchParams.set('prompt', encodeURIComponent(prompt));
      window.history.replaceState({}, '', url);

      try {
        const result = await previewJira({
          prompt,
          images: [base64Image]
        }).unwrap();

        dispatch(setPreviewData(result));
        dispatch(showNotification({
          message: 'Preview generated successfully!',
          severity: 'success'
        }));
      } catch (error) {
        console.error('Preview error:', error);
        dispatch(showNotification({
          message: `Error: ${error.data || error.message}`,
          severity: 'error'
        }));
      }
    };

    reader.onerror = () => {
      dispatch(showNotification({
        message: 'Failed to read the file. Please try again.',
        severity: 'error'
      }));
    };

    reader.readAsDataURL(imageFile);
  };

  const isLoading = isPreviewLoading || isPreviewMutationLoading;

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
      <Stack spacing={3}>
        <Typography variant="h2" component="h2">
          Create Jira Issue
        </Typography>

        <TextField
          label="Prompt"
          multiline
          rows={4}
          value={prompt}
          onChange={handlePromptChange}
          required
          fullWidth
          variant="outlined"
        />

        <Box>
          <Button
            component="label"
            variant="outlined"
            startIcon={<CloudUpload />}
            sx={{ mb: 1 }}
          >
            Upload Image
            <VisuallyHiddenInput
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              required
            />
          </Button>
          {imageFile && (
            <Typography variant="body2" color="text.secondary">
              Selected: {imageFile.name}
            </Typography>
          )}
        </Box>

        <Button
          type="submit"
          variant="contained"
          size="large"
          disabled={isLoading}
          sx={{ position: 'relative' }}
        >
          {isLoading && (
            <CircularProgress
              size={24}
              sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                marginTop: '-12px',
                marginLeft: '-12px',
              }}
            />
          )}
          {isLoading ? 'Generating Preview...' : 'Preview'}
        </Button>
      </Stack>
    </Box>
  );
};

export default JiraForm;
