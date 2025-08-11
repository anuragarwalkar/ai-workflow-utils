import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Tooltip,
  Typography,
  styled,
} from '@mui/material';
import {
  Add as AddIcon,
  CloudUpload,
  Delete as DeleteIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import {
  addCustomField,
  removeCustomField,
  setCustomFields,
  setImageFile,
  setIssueType,
  setPreviewData,
  setPriority,
  setProjectType,
  setPrompt,
  setStreaming,
  setStreamingContent,
  setStreamingStatus,
  updateCustomField,
} from '../../../store/slices/jiraSlice';
import { usePreviewJiraStreamingMutation } from '../../../store/api/jiraApi';
import { showNotification } from '../../../store/slices/uiSlice';
import { saveToLocalStorage } from './utils';
import CustomFieldGuide from '../CustomFieldGuide/CustomFieldGuide';

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

// CustomFieldsSection component
const CustomFieldsSection = ({
  customFields,
  onAddCustomField,
  onRemoveCustomField,
  onUpdateCustomField,
  onOpenGuide,
}) => (
  <Box>
    <Stack direction="row" alignItems="center" spacing={1} mb={1}>
      <Typography variant="h6">Custom Fields</Typography>
      <Tooltip title="Learn more about custom fields">
        <IconButton size="small" onClick={onOpenGuide}>
          <InfoIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    </Stack>
    {customFields.map((field, idx) => (
      <Stack direction="row" spacing={1} alignItems="center" key={field.id} mb={1}>
        <TextField
          label="Field Name"
          value={field.name}
          onChange={e => onUpdateCustomField(field.id, { name: e.target.value })}
          size="small"
        />
        <TextField
          label="Field Value"
          value={field.value}
          onChange={e => onUpdateCustomField(field.id, { value: e.target.value })}
          size="small"
        />
        <IconButton
          aria-label="Remove custom field"
          onClick={() => onRemoveCustomField(field.id)}
          size="small"
        >
          <DeleteIcon fontSize="small" />
        </IconButton>
      </Stack>
    ))}
    <Button
      startIcon={<AddIcon />}
      onClick={onAddCustomField}
      size="small"
      variant="outlined"
    >
      Add Custom Field
    </Button>
  </Box>
);

// UploadSection component
const UploadSection = ({
  imageFile,
  onImageChange,
  onRemoveImage,
}) => (
  <Box>
    <Stack direction="row" alignItems="center" spacing={2} mb={2}>
      <Button
        component="label"
        variant="outlined"
        startIcon={<CloudUpload />}
      >
        Upload Image
        <VisuallyHiddenInput
          type="file"
          accept="image/*"
          onChange={onImageChange}
        />
      </Button>
      {imageFile && (
        <Stack direction="row" alignItems="center" spacing={1}>
          <Typography variant="body2">{imageFile.name}</Typography>
          <IconButton aria-label="Remove image" onClick={onRemoveImage} size="small">
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Stack>
      )}
    </Stack>
  </Box>
);

// ConfigurationSection component
const ConfigurationSection = ({
  issueType,
  onIssueTypeChange,
  priority,
  onPriorityChange,
  projectType,
  onProjectTypeChange,
}) => (
  <Box mb={2}>
    <Stack direction="row" spacing={2}>
      <FormControl fullWidth>
        <InputLabel id="project-type-label">Project Type</InputLabel>
        <Select
          labelId="project-type-label"
          value={projectType}
          label="Project Type"
          onChange={onProjectTypeChange}
        >
          <MenuItem value="software">Software</MenuItem>
          <MenuItem value="business">Business</MenuItem>
          <MenuItem value="service_desk">Service Desk</MenuItem>
        </Select>
      </FormControl>
      <FormControl fullWidth>
        <InputLabel id="issue-type-label">Issue Type</InputLabel>
        <Select
          labelId="issue-type-label"
          value={issueType}
          label="Issue Type"
          onChange={onIssueTypeChange}
        >
          <MenuItem value="bug">Bug</MenuItem>
          <MenuItem value="task">Task</MenuItem>
          <MenuItem value="story">Story</MenuItem>
        </Select>
      </FormControl>
      <FormControl fullWidth>
        <InputLabel id="priority-label">Priority</InputLabel>
        <Select
          labelId="priority-label"
          value={priority}
          label="Priority"
          onChange={onPriorityChange}
        >
          <MenuItem value="highest">Highest</MenuItem>
          <MenuItem value="high">High</MenuItem>
          <MenuItem value="medium">Medium</MenuItem>
          <MenuItem value="low">Low</MenuItem>
          <MenuItem value="lowest">Lowest</MenuItem>
        </Select>
      </FormControl>
    </Stack>
  </Box>
);
const JiraForm = () => {
  const dispatch = useDispatch();
  const {
    prompt,
    imageFile,
    issueType,
    priority,
    projectType,
    customFields,
    isPreviewLoading,
    isStreaming,
  } = useSelector(state => state.jira.createJira);

  const [isCustomFieldGuideOpen, setIsCustomFieldGuideOpen] = useState(false);
  const [previewJiraStreaming] = usePreviewJiraStreamingMutation();

  const loadFromLocalStorage = useCallback(() => {
    try {
      const saved = localStorage.getItem('jira_form_data');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (error) {
      console.error('Failed to load from localStorage:', error);
    }
    return null;
  }, []);

  // Check URL params for prompt on component mount and load localStorage data
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const promptParam = urlParams.get('prompt');
    if (promptParam) {
      dispatch(setPrompt(decodeURIComponent(promptParam)));
    }

    // Load saved data from localStorage
    const savedData = loadFromLocalStorage();
    if (savedData) {
      if (savedData.projectType) {
        dispatch(setProjectType(savedData.projectType));
      }
      // Load custom fields for the current issue type
      if (
        savedData.customFieldsByType &&
        savedData.customFieldsByType[issueType]
      ) {
        dispatch(setCustomFields(savedData.customFieldsByType[issueType]));
      } else {
        dispatch(setCustomFields([]));
      }
    }
  }, [dispatch, loadFromLocalStorage, issueType]);

  // Handle issue type changes - load custom fields for the selected issue type
  useEffect(() => {
    const savedData = loadFromLocalStorage();
    if (
      savedData &&
      savedData.customFieldsByType &&
      savedData.customFieldsByType[issueType]
    ) {
      dispatch(setCustomFields(savedData.customFieldsByType[issueType]));
    }
    // Don't clear custom fields if no saved data - let user keep working with current fields
  }, [issueType, dispatch, loadFromLocalStorage]);

  const handlePromptChange = event => {
    dispatch(setPrompt(event.target.value));
  };

  const handleImageChange = event => {
    const file = event.target.files[0];
    dispatch(setImageFile(file));
  };

  const handleIssueTypeChange = event => {
    dispatch(setIssueType(event.target.value));
  };

  const handlePriorityChange = event => {
    dispatch(setPriority(event.target.value));
  };

  const handleProjectTypeChange = event => {
    dispatch(setProjectType(event.target.value));
  };

  const handleAddCustomField = () => {
    dispatch(addCustomField());
  };

  const handleRemoveCustomField = index => {
    dispatch(removeCustomField(index));
  };

  const handleUpdateCustomField = (index, field, value) => {
    dispatch(updateCustomField({ index, field, value }));
  };

  const handleSubmit = async event => {
    event.preventDefault();

    // save details to storage
    saveToLocalStorage(projectType, issueType, customFields);

    // Update URL with prompt
    const url = new URL(window.location.href);
    url.searchParams.set('prompt', encodeURIComponent(prompt));
    window.history.replaceState({}, '', url);

    // Reset streaming content
    dispatch(setStreamingContent(''));
    dispatch(setStreamingStatus(''));
    dispatch(setStreaming(true));

    const handleStreamingRequest = async images => {
      try {
        const result = await previewJiraStreaming({
          prompt,
          images,
          issueType,
          onChunk: (chunk, fullContent) => {
            dispatch(setStreamingContent(fullContent));
          },
          onStatus: (status, provider) => {
            dispatch(setStreamingStatus(`${status} (${provider})`));
          },
        }).unwrap();

        dispatch(setStreaming(false));
        // The streaming result has the data directly, not nested under .data
        dispatch(setPreviewData(result));
        dispatch(
          showNotification({
            message: 'Preview generated successfully!',
            severity: 'success',
          })
        );
      } catch (error) {
        dispatch(setStreaming(false));
        console.error('Preview error:', error);
        dispatch(
          showNotification({
            message: `Error: ${error.error || error.message}`,
            severity: 'error',
          })
        );
      }
    };

    if (imageFile) {
      // Convert file to base64 if image is provided
      const reader = new FileReader();
      reader.onload = async () => {
        const base64Image = reader.result.split(',')[1];
        await handleStreamingRequest([base64Image]);
      };

      reader.onerror = () => {
        dispatch(setStreaming(false));
        dispatch(
          showNotification({
            message: 'Failed to read the file. Please try again.',
            severity: 'error',
          })
        );
      };

      reader.readAsDataURL(imageFile);
    } else {
      // Generate preview without image
      await handleStreamingRequest([]);
    }
  };

  const isLoading = isPreviewLoading || isStreaming;

  return (
    <Box component='form' sx={{ width: '100%' }} onSubmit={handleSubmit}>
      <Stack spacing={3}>
        <Typography component='h2' variant='h2'>
          Create Jira Issue
        </Typography>

        <TextField
          fullWidth
          multiline
          required
          label='Prompt'
          rows={4}
          value={prompt}
          variant='outlined'
          onChange={handlePromptChange}
        />

        <FormControl fullWidth>
          <InputLabel id='issue-type-label'>Issue Type</InputLabel>
          <Select
            id='issue-type-select'
            label='Issue Type'
            labelId='issue-type-label'
            value={issueType}
            onChange={handleIssueTypeChange}
          >
            <MenuItem value='Task'>Task</MenuItem>
            <MenuItem value='Bug'>Bug</MenuItem>
            <MenuItem value='Story'>Story</MenuItem>
          </Select>
        </FormControl>

        <FormControl fullWidth>
          <InputLabel id='priority-label'>Priority</InputLabel>
          <Select
            id='priority-select'
            label='Priority'
            labelId='priority-label'
            value={priority}
            onChange={handlePriorityChange}
          >
            <MenuItem value='Critical'>Critical</MenuItem>
            <MenuItem value='High'>High</MenuItem>
            <MenuItem value='Medium'>Medium</MenuItem>
            <MenuItem value='Low'>Low</MenuItem>
          </Select>
        </FormControl>

        <TextField
          fullWidth
          required
          label='Project Key'
          placeholder='e.g., AIWUT, PROJ, etc.'
          value={projectType}
          variant='outlined'
          onChange={handleProjectTypeChange}
        />

        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <Typography gutterBottom variant='h6'>
              Custom Fields ({issueType})
            </Typography>
            <Tooltip
              arrow
              placement='right-start'
              title={
                <Box sx={{ maxWidth: 400 }}>
                  <Typography
                    sx={{ mb: 1, fontWeight: 'bold' }}
                    variant='body2'
                  >
                    Why Custom Fields Are Important:
                  </Typography>
                  <Typography sx={{ mb: 1 }} variant='body2'>
                    • <strong>Compliance:</strong> Many organizations require
                    specific custom fields to be populated for tracking,
                    reporting, and workflow automation
                  </Typography>
                  <Typography sx={{ mb: 1 }} variant='body2'>
                    • <strong>Workflow Triggers:</strong> Custom fields often
                    trigger automated actions like notifications, approvals, or
                    status transitions
                  </Typography>
                  <Typography sx={{ mb: 1 }} variant='body2'>
                    • <strong>Data Integrity:</strong> Ensures all required
                    project-specific information is captured consistently
                  </Typography>
                  <Typography sx={{ mb: 1 }} variant='body2'>
                    • <strong>Reporting:</strong> Custom fields enable accurate
                    filtering, grouping, and reporting across your organization
                  </Typography>
                  <Typography variant='body2'>
                    <strong>Note:</strong> Required custom fields vary by
                    project, issue type, and your organization's Jira
                    configuration.
                  </Typography>
                </Box>
              }
            >
              <IconButton size='small' sx={{ color: 'primary.main' }}>
                <InfoIcon fontSize='small' />
              </IconButton>
            </Tooltip>
          </Box>

          <Typography color='text.secondary' sx={{ mb: 1 }} variant='body2'>
            <strong>What are Custom Fields?</strong> Organization-specific
            fields required for {issueType.toLowerCase()} issues that ensure
            proper tracking, compliance, and workflow automation.
          </Typography>

          <Typography color='text.secondary' sx={{ mb: 2 }} variant='body2'>
            These custom fields are specific to {issueType} issues and will be
            saved separately for each issue type.
            <br />
            <strong>Value formats:</strong> Simple text: &quot;11222&quot; |
            Object: {`{"id": "21304"}`} | Array: {`["value1", "value2"]`}
            {projectType?.trim() ? (
              <>
                <br />
                <br />
                💡 Need help finding custom field IDs?{' '}
                <Button
                  size='small'
                  sx={{ textTransform: 'none', minWidth: 'auto', p: 0 }}
                  variant='text'
                  onClick={() => {
                    if (projectType?.trim()) {
                      setIsCustomFieldGuideOpen(true);
                    } else {
                      dispatch(
                        showNotification({
                          message: 'Please enter a Project Key first',
                          severity: 'warning',
                        })
                      );
                    }
                  }}
                >
                  View available fields for &quot;{projectType}&quot;
                </Button>
              </>
            ) : null}
          </Typography>
          {customFields.map((field, index) => (
            <Box
              key={index}
              sx={{
                display: 'flex',
                gap: 2,
                mb: 2,
                alignItems: 'center',
                marginBottom: '16px',
              }}
            >
              <TextField
                label='Field Key'
                placeholder='e.g., customfield_1234'
                size='small'
                style={{ marginBottom: 0 }}
                sx={{ flex: 1 }}
                value={field.key}
                onChange={e =>
                  handleUpdateCustomField(index, 'key', e.target.value)
                }
              />
              <TextField
                label='Field Value'
                placeholder='e.g., 11222 or {"id": "007"}'
                size='small'
                style={{ marginBottom: 0 }}
                sx={{ flex: 1 }}
                value={field.value}
                onChange={e =>
                  handleUpdateCustomField(index, 'value', e.target.value)
                }
              />
              <IconButton
                color='error'
                size='small'
                onClick={() => handleRemoveCustomField(index)}
              >
                <DeleteIcon />
              </IconButton>
            </Box>
          ))}
          <Button
            size='small'
            startIcon={<AddIcon />}
            variant='outlined'
            onClick={handleAddCustomField}
          >
            Add Custom Field
          </Button>
        </Box>

        <Box>
          <Button
            component='label'
            startIcon={<CloudUpload />}
            sx={{ mb: 1 }}
            variant='outlined'
          >
            Upload Image
            <VisuallyHiddenInput
              accept='image/*'
              type='file'
              onChange={handleImageChange}
            />
          </Button>
          {imageFile ? (
            <Typography color='text.secondary' component='div' variant='body2'>
              Selected: {imageFile.name}
            </Typography>
          ) : null}
        </Box>

        <Button
          disabled={isLoading}
          size='large'
          sx={{ position: 'relative' }}
          type='submit'
          variant='contained'
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
          {isLoading ? 'Generating Preview...' : 'Preview'}
        </Button>
      </Stack>

      {/* Custom Field Guide Dialog */}
      <Dialog
        fullWidth
        maxWidth='lg'
        open={isCustomFieldGuideOpen}
        onClose={() => setIsCustomFieldGuideOpen(false)}
      >
        <DialogTitle>
          Custom Fields Guide for {projectType || 'Project'}
        </DialogTitle>
        <DialogContent>
          {projectType?.trim() ? (
            <CustomFieldGuide issueType={issueType} projectKey={projectType} />
          ) : (
            <Alert severity='warning'>
              <Typography>
                Please enter a Project Key first to view custom fields for that
                project.
              </Typography>
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsCustomFieldGuideOpen(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default JiraForm;
