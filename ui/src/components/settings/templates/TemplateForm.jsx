import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  Chip,
  Alert,
  FormHelperText
} from '@mui/material'
import { useSelector, useDispatch } from 'react-redux'
import {
  selectIsFormOpen,
  selectFormMode,
  selectEditingTemplate,
  selectIsSaving,
  closeForm,
  setError,
} from '../../../store/slices/templateSlice'
import {
  useCreateTemplateMutation,
  useUpdateTemplateMutation
} from '../../../store/api/templateApi'

const TemplateForm = () => {
  const dispatch = useDispatch()
  const isOpen = useSelector(selectIsFormOpen)
  const mode = useSelector(selectFormMode)
  const editingTemplate = useSelector(selectEditingTemplate)
  const isSaving = useSelector(selectIsSaving)

  const [createTemplate] = useCreateTemplateMutation()
  const [updateTemplate] = useUpdateTemplateMutation()

  const [formData, setFormData] = useState({
    name: '',
    issueType: '',
    content: ''
  })
  const [variables, setVariables] = useState([])

  // Load template data when editing
  useEffect(() => {
    if (editingTemplate && (mode === 'edit' || mode === 'duplicate')) {
      setFormData({
        name: editingTemplate.name,
        issueType: editingTemplate.issueType,
        content: editingTemplate.content
      })
      setVariables(editingTemplate.variables || [])
    } else {
      setFormData({
        name: '',
        issueType: '',
        content: ''
      })
      setVariables([])
    }
  }, [editingTemplate, mode])

  // Extract variables from template content
  useEffect(() => {
    const variableRegex = /\{([^}]+)\}/g
    const foundVariables = []
    let match
    
    while ((match = variableRegex.exec(formData.content)) !== null) {
      if (!foundVariables.includes(match[1])) {
        foundVariables.push(match[1])
      }
    }
    
    setVariables(foundVariables)
  }, [formData.content])

  const handleInputChange = (field) => (event) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value
    }))
  }

  const handleSubmit = async () => {
    try {
      // Clear any previous errors
      dispatch(setError(null))
      
      // Validation
      if (!formData.name.trim()) {
        dispatch(setError('Template name is required'))
        return
      }
      
      if (!formData.issueType.trim()) {
        dispatch(setError('Template type is required'))
        return
      }
      
      if (!formData.content.trim()) {
        dispatch(setError('Template content is required'))
        return
      }

      const templateData = {
        name: formData.name.trim(),
        issueType: formData.issueType.trim(),
        content: formData.content.trim()
      }

      console.log('Submitting template data:', templateData)

      if (mode === 'edit' && editingTemplate) {
        console.log('Updating template:', editingTemplate.id)
        const result = await updateTemplate({
          id: editingTemplate.id,
          ...templateData
        }).unwrap()
        console.log('Update result:', result)
      } else {
        console.log('Creating new template')
        const result = await createTemplate(templateData).unwrap()
        console.log('Create result:', result)
      }

      dispatch(closeForm())
    } catch (error) {
      console.error('Template save error:', error)
      const errorMessage = error?.data?.error || error?.message || 'Failed to save template'
      dispatch(setError(errorMessage))
    }
  }

  const handleClose = () => {
    dispatch(closeForm())
  }

  const getDialogTitle = () => {
    switch (mode) {
      case 'edit':
        return 'Edit Template'
      case 'duplicate':
        return 'Duplicate Template'
      default:
        return 'Create New Template'
    }
  }

  const insertVariable = (variable) => {
    const textarea = document.getElementById('template-content')
    if (textarea) {
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const newContent = formData.content.substring(0, start) + `{${variable}}` + formData.content.substring(end)
      setFormData(prev => ({ ...prev, content: newContent }))
      
      // Set cursor position after the inserted variable
      setTimeout(() => {
        textarea.focus()
        textarea.setSelectionRange(start + variable.length + 2, start + variable.length + 2)
      }, 0)
    }
  }

  return (
    <Dialog
      open={isOpen}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { minHeight: '600px' }
      }}
    >
      <DialogTitle>{getDialogTitle()}</DialogTitle>
      
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 1 }}>
          {/* Template Name */}
          <TextField
            label="Template Name"
            value={formData.name}
            onChange={handleInputChange('name')}
            fullWidth
            required
            placeholder="e.g., Bug Report Template, PR Review Template"
          />

          {/* Template Type */}
          <Box>
            <TextField
              label="Template Type"
              value={formData.issueType}
              onChange={handleInputChange('issueType')}
              fullWidth
              required
              placeholder="e.g., Bug, Task, Story, PR, Review, Email, etc."
              helperText="You can use any type - Bug, Task, Story, PR, Review, Email, or create your own custom types"
            />
          </Box>

          {/* Variable Helper */}
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Common Variables (click to insert):
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
              {['prompt', 'imageReference', 'imageContext'].map((variable) => (
                <Chip
                  key={variable}
                  label={`{${variable}}`}
                  size="small"
                  variant="outlined"
                  clickable
                  onClick={() => insertVariable(variable)}
                  sx={{ cursor: 'pointer' }}
                />
              ))}
            </Box>
          </Box>

          {/* Template Content */}
          <TextField
            id="template-content"
            label="Template Content"
            value={formData.content}
            onChange={handleInputChange('content')}
            multiline
            rows={12}
            fullWidth
            required
            placeholder="Enter your template content here. Use {prompt} for user input, {imageReference} for image context, etc."
            helperText="Use curly braces {} to define variables that will be replaced when the template is used"
          />

          {/* Detected Variables */}
          {variables.length > 0 && (
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Detected Variables:
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {variables.map((variable) => (
                  <Chip
                    key={variable}
                    label={`{${variable}}`}
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                ))}
              </Box>
            </Box>
          )}

          {/* Template Examples */}
          <Alert severity="info">
            <Typography variant="body2">
              <strong>Template Examples:</strong><br/>
              • <strong>Bug:</strong> Generate bug reports with steps to reproduce<br/>
              • <strong>PR:</strong> Create pull request descriptions<br/>
              • <strong>Review:</strong> Code review templates<br/>
              • <strong>Email:</strong> Email templates for notifications<br/>
              • <strong>Custom:</strong> Any workflow-specific template you need
            </Typography>
          </Alert>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3 }}>
        <Button onClick={handleClose} disabled={isSaving}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={isSaving}
        >
          {isSaving ? 'Saving...' : (mode === 'edit' ? 'Update' : 'Create')}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default TemplateForm
