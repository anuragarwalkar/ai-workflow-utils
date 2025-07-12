import React from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Stack,
  CircularProgress,
  Paper,
} from '@mui/material';
import { useSelector, useDispatch } from 'react-redux';
import { setSummary, setDescription } from '../../../store/slices/jiraSlice';
import { useCreateJiraMutation, useUploadAttachmentMutation } from '../../../store/api/jiraApi';
import { showNotification } from '../../../store/slices/uiSlice';

const PreviewSection = () => {
  const dispatch = useDispatch();
  const { summary, description, imageFile, previewData, isCreating, streamingContent, streamingStatus, isStreaming } = useSelector(
    (state) => state.jira.createJira
  );

  const [createJira, { isLoading: isCreateLoading }] = useCreateJiraMutation();
  const [uploadAttachment, { isLoading: isUploadLoading }] = useUploadAttachmentMutation();

  const handleSummaryChange = (event) => {
    dispatch(setSummary(event.target.value));
  };

  const handleDescriptionChange = (event) => {
    dispatch(setDescription(event.target.value));
  };

  const handleCreateJira = async () => {
    if (!previewData) {
      dispatch(showNotification({
        message: 'No preview data available.',
        severity: 'error'
      }));
      return;
    }

    try {
      // Create Jira issue
      const jiraResult = await createJira({
        summary,
        description
      }).unwrap();

      const issueKey = jiraResult.jiraIssue.key;

      // Upload attachment if image exists
      if (imageFile && issueKey) {
        const formData = new FormData();
        formData.append('file', imageFile);
        formData.append('issueKey', issueKey);

        await uploadAttachment({ formData }).unwrap();
      }

      dispatch(showNotification({
        message: `Jira issue created successfully: ${issueKey}`,
        severity: 'success'
      }));

    } catch (error) {
      console.error('Create Jira error:', error);
      dispatch(showNotification({
        message: `Error creating Jira issue: ${error.data || error.message}`,
        severity: 'error'
      }));
    }
  };

  const isLoading = isCreating || isCreateLoading || isUploadLoading;

  // Show streaming content if streaming is active
  if (isStreaming || (streamingContent && !previewData)) {
    return (
      <Paper elevation={1} sx={{ p: 3, mt: 3, backgroundColor: 'grey.50' }}>
        <Stack spacing={3}>
          <Typography variant="h2" component="h2">
            Generating Preview...
          </Typography>
          
          {streamingStatus && (
            <Typography variant="body2" color="primary">
              Status: {streamingStatus}
            </Typography>
          )}
          
          <Paper 
            elevation={0} 
            sx={{ 
              p: 2, 
              backgroundColor: 'background.paper',
              border: '1px solid',
              borderColor: 'divider',
              minHeight: '200px',
              fontFamily: 'monospace',
              whiteSpace: 'pre-wrap',
              overflow: 'auto'
            }}
          >
            {streamingContent || 'Waiting for response...'}
            {isStreaming && (
              <Box component="span" sx={{ animation: 'blink 1s infinite' }}>
                ▋
              </Box>
            )}
          </Paper>
        </Stack>
      </Paper>
    );
  }

  if (!previewData) {
    return null;
  }

  return (
    <Paper elevation={1} sx={{ p: 3, mt: 3, backgroundColor: 'grey.50' }}>
      <Stack spacing={3}>
        <Typography variant="h2" component="h2">
          Bug Report Preview
        </Typography>

        <TextField
          label="Summary"
          value={summary}
          onChange={handleSummaryChange}
          fullWidth
          variant="outlined"
          sx={{
            '& .MuiInputBase-root': {
              backgroundColor: 'background.paper',
            },
          }}
        />

        <TextField
          label="Description"
          multiline
          rows={10}
          value={description}
          onChange={handleDescriptionChange}
          fullWidth
          variant="outlined"
          sx={{
            '& .MuiInputBase-root': {
              backgroundColor: 'background.paper',
            },
          }}
        />

        <Button
          variant="contained"
          size="large"
          onClick={handleCreateJira}
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
          {isLoading ? 'Creating Jira Issue...' : 'Create Jira Issue'}
        </Button>
      </Stack>
    </Paper>
  );
};

export default PreviewSection;
