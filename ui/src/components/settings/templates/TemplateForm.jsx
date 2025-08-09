import { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
} from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import {
  closeForm,
  selectEditingTemplate,
  selectFormMode,
  selectIsFormOpen,
  selectIsSaving,
  setError,
} from '../../../store/slices/templateSlice';
import {
  useCreateTemplateMutation,
  useUpdateTemplateMutation,
} from '../../../store/api/templateApi';

const TemplateForm = () => {
  const dispatch = useDispatch();
  const isOpen = useSelector(selectIsFormOpen);
  const mode = useSelector(selectFormMode);
  const editingTemplate = useSelector(selectEditingTemplate);
  const isSaving = useSelector(selectIsSaving);

  const [createTemplate] = useCreateTemplateMutation();
  const [updateTemplate] = useUpdateTemplateMutation();

  const [formData, setFormData] = useState({
    name: '',
    templateFor: '',
    content: '',
  });
  const [variables, setVariables] = useState([]);

  // Load template data when editing
  useEffect(() => {
    if (editingTemplate && (mode === 'edit' || mode === 'duplicate')) {
      setFormData({
        name: editingTemplate.name,
        templateFor: editingTemplate.templateFor || '',
        content: editingTemplate.content,
      });
      setVariables(editingTemplate.variables || []);
    } else {
      setFormData({
        name: '',
        templateFor: '',
        content: '',
      });
      setVariables([]);
    }
  }, [editingTemplate, mode]);

  // Extract variables from template content
  useEffect(() => {
    const variableRegex = /\{([^}]+)\}/g;
    const foundVariables = [];
    let match;

    while ((match = variableRegex.exec(formData.content)) !== null) {
      if (!foundVariables.includes(match[1])) {
        foundVariables.push(match[1]);
      }
    }

    setVariables(foundVariables);
  }, [formData.content]);

  const handleInputChange = field => event => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value,
    }));
  };

  const handleSubmit = async () => {
    try {
      // Clear any previous errors
      dispatch(setError(null));

      // Validation
      if (!formData.name.trim()) {
        dispatch(setError('Template name is required'));
        return;
      }

      if (!formData.templateFor.trim()) {
        dispatch(setError('Template for field is required'));
        return;
      }

      if (!formData.content.trim()) {
        dispatch(setError('Template content is required'));
        return;
      }

      const templateData = {
        name: formData.name.trim(),
        templateFor: formData.templateFor.trim(),
        content: formData.content.trim(),
      };

      if (mode === 'edit' && editingTemplate) {
        await updateTemplate({
          id: editingTemplate.id,
          ...templateData,
        }).unwrap();
      } else {
        await createTemplate(templateData).unwrap();
      }

      dispatch(closeForm());
    } catch (error) {
      // Toast notifications are now handled in Redux API layer
      // Keep local error for form validation display
      console.error('Template save error:', error);
      const errorMessage =
        error?.data?.error || error?.message || 'Failed to save template';
      dispatch(setError(errorMessage));
    }
  };

  const handleClose = () => {
    dispatch(closeForm());
  };

  const getDialogTitle = () => {
    switch (mode) {
      case 'edit':
        return 'Edit Template';
      case 'duplicate':
        return 'Duplicate Template';
      default:
        return 'Create New Template';
    }
  };

  const insertVariable = variable => {
    const textarea = document.getElementById('template-content');
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newContent = `${formData.content.substring(
        0,
        start
      )}{${variable}}${formData.content.substring(end)}`;
      setFormData(prev => ({ ...prev, content: newContent }));

      // Set cursor position after the inserted variable
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(
          start + variable.length + 2,
          start + variable.length + 2
        );
      }, 0);
    }
  };

  return (
    <Dialog
      fullWidth
      maxWidth='md'
      open={isOpen}
      PaperProps={{
        sx: { minHeight: '600px' },
      }}
      onClose={handleClose}
    >
      <DialogTitle>{getDialogTitle()}</DialogTitle>

      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 1 }}>
          {/* Template Name */}
          <TextField
            fullWidth
            required
            label='Template Name'
            placeholder='e.g., Bug Report Template, PR Review Template'
            value={formData.name}
            onChange={handleInputChange('name')}
          />

          {/* Template For */}
          <Box>
            <TextField
              disabled
              fullWidth
              helperText='This field shows what the template is designed for. Editing capability will be available in a future update'
              label='Template For'
              placeholder='e.g., JIRA_BUG, JIRA_TASK, PR_REVIEW'
              value={formData.templateFor}
              onChange={handleInputChange('templateFor')}
            />
          </Box>

          {/* Variable Helper */}
          <Box>
            <Typography gutterBottom variant='subtitle2'>
              Common Variables (click to insert):
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
              {['prompt', 'imageReference', 'imageContext'].map(variable => (
                <Chip
                  clickable
                  key={variable}
                  label={`{${variable}}`}
                  size='small'
                  sx={{ cursor: 'pointer' }}
                  variant='outlined'
                  onClick={() => insertVariable(variable)}
                />
              ))}
            </Box>
          </Box>

          {/* Template Content */}
          <TextField
            fullWidth
            multiline
            required
            helperText='Use curly braces {} to define variables that will be replaced when the template is used'
            id='template-content'
            label='Template Content'
            placeholder='Enter your template content here. Use {prompt} for user input, {imageReference} for image context, etc.'
            rows={12}
            value={formData.content}
            onChange={handleInputChange('content')}
          />

          {/* Detected Variables */}
          {variables.length > 0 && (
            <Box>
              <Typography gutterBottom variant='subtitle2'>
                Detected Variables:
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {variables.map(variable => (
                  <Chip
                    color='primary'
                    key={variable}
                    label={`{${variable}}`}
                    size='small'
                    variant='outlined'
                  />
                ))}
              </Box>
            </Box>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3 }}>
        <Button disabled={isSaving} onClick={handleClose}>
          Cancel
        </Button>
        <Button disabled={isSaving} variant='contained' onClick={handleSubmit}>
          {isSaving ? 'Saving...' : mode === 'edit' ? 'Update' : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TemplateForm;
