import React, { useState } from 'react';
import {
  Box,
  Button,
  CircularProgress,
  IconButton,
  Paper,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import {
  Code as CodeIcon,
  Edit as EditIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { setDescription, setSummary } from '../../../store/slices/jiraSlice';
import {
  useCreateJiraMutation,
  useUploadAttachmentMutation,
} from '../../../store/api/jiraApi';
import { showNotification } from '../../../store/slices/uiSlice';
import { saveToLocalStorage } from './utils';
import RichTextViewer from '../../common/RichTextViewer';
import Editor from '@monaco-editor/react';
import { useAppTheme } from '../../../theme/useAppTheme';

const PreviewSection = () => {
  const dispatch = useDispatch();
  const { isDark } = useAppTheme();
  const [descriptionMode, setDescriptionMode] = useState('view'); // 'view', 'edit', 'source'
  const {
    summary,
    description,
    imageFile,
    previewData,
    isCreating,
    streamingContent,
    streamingStatus,
    isStreaming,
    issueType,
    priority,
    projectType,
    customFields,
  } = useSelector(state => state.jira.createJira);

  const [createJira, { isLoading: isCreateLoading }] = useCreateJiraMutation();
  const [uploadAttachment, { isLoading: isUploadLoading }] =
    useUploadAttachmentMutation();

  const handleSummaryChange = event => {
    dispatch(setSummary(event.target.value));
  };

  const handleDescriptionChange = event => {
    dispatch(setDescription(event.target.value));
  };

  const handleCreateJira = async () => {
    if (!previewData) {
      dispatch(
        showNotification({
          message: 'No preview data available.',
          severity: 'error',
        })
      );
      return;
    }

    if (!projectType || projectType.trim() === '') {
      dispatch(
        showNotification({
          message: 'Project Type is required to create a Jira issue.',
          severity: 'error',
        })
      );
      return;
    }

    try {
      // Save to localStorage before creating Jira issue
      saveToLocalStorage(projectType, issueType, customFields);

      // Create Jira issue
      const response = await createJira({
        summary,
        description,
        issueType,
        priority,
        projectType,
        customFields,
      }).unwrap();

      const generatedIssueKey = response.jiraIssue.key;

      // Upload attachment if image exists
      if (imageFile && generatedIssueKey) {
        const formData = new FormData();
        formData.append('file', imageFile);
        formData.append('issueKey', generatedIssueKey);

        await uploadAttachment({ formData }).unwrap();
      }

      dispatch(
        showNotification({
          message: `Jira issue created successfully: ${generatedIssueKey}`,
          severity: 'success',
        })
      );
    } catch (error) {
      console.error('Create Jira error:', error);
      dispatch(
        showNotification({
          message: `Error creating Jira issue: ${error.data || error.message}`,
          severity: 'error',
        })
      );
    }
  };

  const isLoading = isCreating || isCreateLoading || isUploadLoading;

  // Show streaming content if streaming is active
  if (isStreaming || (streamingContent && !previewData)) {
    return (
      <Paper elevation={1} sx={{ p: 3, mt: 3, backgroundColor: 'grey.50' }}>
        <Stack spacing={3}>
          <Typography component='h2' variant='h2'>
            Generating Preview...
          </Typography>

          {streamingStatus ? (
            <Typography color='primary' variant='body2'>
              Status: {streamingStatus}
            </Typography>
          ) : null}

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
              overflow: 'auto',
            }}
          >
            {streamingContent || 'Waiting for response...'}
            {isStreaming ? (
              <Box component='span' sx={{ animation: 'blink 1s infinite' }}>
                ▋
              </Box>
            ) : null}
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
        <Typography component='h2' variant='h2'>
          Bug Report Preview
        </Typography>

        <TextField
          fullWidth
          label='Summary'
          sx={{
            '& .MuiInputBase-root': {
              backgroundColor: 'background.paper',
            },
          }}
          value={summary}
          variant='outlined'
          onChange={handleSummaryChange}
        />

        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Typography sx={{ flexGrow: 1 }} variant='h6'>
              Description
            </Typography>
            <ToggleButtonGroup
              exclusive
              size='small'
              value={descriptionMode}
              onChange={(event, newMode) => {
                if (newMode !== null) {
                  setDescriptionMode(newMode);
                }
              }}
            >
              <ToggleButton value='view'>
                <VisibilityIcon fontSize='small' />
              </ToggleButton>
              <ToggleButton value='edit'>
                <CodeIcon fontSize='small' />
              </ToggleButton>
              <ToggleButton value='source'>
                <EditIcon fontSize='small' />
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>

          {descriptionMode === 'view' && (
            <Box
              sx={{
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1,
                backgroundColor: 'background.paper',
                minHeight: '240px',
                p: 2,
              }}
            >
              <RichTextViewer
                content={description || 'No description available'}
                sx={{ minHeight: '200px' }}
                variant='inline'
              />
            </Box>
          )}

          {descriptionMode === 'edit' && (
            <Box
              sx={{
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1,
              }}
            >
              <Editor
                defaultLanguage='markdown'
                height='300px'
                options={{
                  minimap: { enabled: false },
                  wordWrap: 'on',
                  lineNumbers: 'on',
                  folding: false,
                  fontSize: 14,
                  padding: { top: 16, bottom: 16 },
                  scrollBeyondLastLine: false,
                }}
                theme={isDark ? 'vs-dark' : 'light'}
                value={description}
                onChange={value => dispatch(setDescription(value || ''))}
              />
            </Box>
          )}

          {descriptionMode === 'source' && (
            <TextField
              fullWidth
              multiline
              label='Description'
              rows={10}
              sx={{
                '& .MuiInputBase-root': {
                  backgroundColor: 'background.paper',
                },
              }}
              value={description}
              variant='outlined'
              onChange={handleDescriptionChange}
            />
          )}
        </Box>

        <Button
          disabled={isLoading || !projectType || projectType.trim() === ''}
          size='large'
          sx={{ position: 'relative' }}
          variant='contained'
          onClick={handleCreateJira}
        >
          {isLoading ? (
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
          ) : null}
          {isLoading ? 'Creating Jira Issue...' : 'Create Jira Issue'}
        </Button>

        {(!projectType || projectType.trim() === '') && (
          <Typography
            color='warning.main'
            sx={{ textAlign: 'center' }}
            variant='body2'
          >
            ⚠️ Please enter a Project Type in the form above to enable Jira
            issue creation
          </Typography>
        )}
      </Stack>
    </Paper>
  );
};

export default PreviewSection;
