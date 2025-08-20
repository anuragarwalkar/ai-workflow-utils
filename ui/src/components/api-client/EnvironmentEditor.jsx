import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  IconButton,
  Chip,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Divider,
  Alert,
  Collapse,
  alpha,
  useTheme,
  InputAdornment,
  Tooltip,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Visibility,
  VisibilityOff,
  ContentCopy as CopyIcon,
  Save as SaveIcon,
  Close as CloseIcon,
  KeyboardArrowDown,
  KeyboardArrowUp,
  Info as InfoIcon,
} from '@mui/icons-material';

// Individual variable row component
const VariableRow = ({ 
  variable, 
  onUpdate, 
  onDelete, 
  isEditing, 
  onToggleEdit 
}) => {
  const theme = useTheme();
  const [key, setKey] = useState(variable.key);
  const [value, setValue] = useState(variable.value);
  const [description, setDescription] = useState(variable.description || '');
  const [isSecret, setIsSecret] = useState(variable.isSecret || false);
  const [showValue, setShowValue] = useState(!variable.isSecret);

  const handleSave = () => {
    onUpdate(variable.id, { key, value, description, isSecret });
    onToggleEdit(null);
  };

  const handleCancel = () => {
    setKey(variable.key);
    setValue(variable.value);
    setDescription(variable.description || '');
    setIsSecret(variable.isSecret || false);
    onToggleEdit(null);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(variable.value);
  };

  if (isEditing) {
    return (
      <Card 
        sx={{ 
          mb: 2, 
          border: `2px solid ${theme.palette.primary.main}`,
          borderRadius: 2 
        }}
      >
        <CardContent sx={{ pb: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Variable Name"
                size="small"
                value={key}
                onChange={(e) => setKey(e.target.value)}
                placeholder="API_KEY"
              />
            </Grid>
            <Grid item xs={12} md={8}>
              <TextField
                fullWidth
                label="Value"
                size="small"
                type={isSecret && !showValue ? 'password' : 'text'}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="Enter variable value"
                InputProps={{
                  endAdornment: isSecret && (
                    <InputAdornment position="end">
                      <IconButton
                        size="small"
                        onClick={() => setShowValue(!showValue)}
                      >
                        {showValue ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description (Optional)"
                size="small"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What is this variable used for?"
              />
            </Grid>
            <Grid item xs={12}>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <FormControlLabel
                  control={
                    <Switch
                      checked={isSecret}
                      onChange={(e) => setIsSecret(e.target.checked)}
                      size="small"
                    />
                  }
                  label="Secret variable"
                />
                <Box>
                  <Button size="small" onClick={handleCancel} sx={{ mr: 1 }}>
                    Cancel
                  </Button>
                  <Button 
                    size="small" 
                    variant="contained" 
                    onClick={handleSave}
                    disabled={!key.trim() || !value.trim()}
                  >
                    Save
                  </Button>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card 
      sx={{ 
        mb: 1.5, 
        transition: 'all 0.2s ease',
        '&:hover': {
          boxShadow: theme.shadows[2],
          transform: 'translateY(-1px)',
        }
      }}
    >
      <CardContent sx={{ py: 2, px: 2.5 }}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
          <Box flex={1}>
            <Box display="flex" alignItems="center" mb={1}>
              <Typography 
                variant="subtitle2" 
                fontWeight={600}
                sx={{ mr: 1 }}
              >
                {variable.key}
              </Typography>
              {variable.isSecret && (
                <Chip 
                  label="Secret" 
                  size="small" 
                  color="warning"
                  sx={{ height: 20, fontSize: '0.7rem' }}
                />
              )}
            </Box>
            
            <Box display="flex" alignItems="center" mb={1}>
              <Typography 
                variant="body2" 
                sx={{ 
                  fontFamily: 'monospace',
                  fontSize: '0.875rem',
                  color: 'text.secondary',
                  wordBreak: 'break-all',
                  mr: 1,
                }}
              >
                {variable.isSecret && !showValue 
                  ? '••••••••••••••••' 
                  : variable.value
                }
              </Typography>
              {variable.isSecret && (
                <IconButton 
                  size="small" 
                  onClick={() => setShowValue(!showValue)}
                  sx={{ p: 0.5 }}
                >
                  {showValue ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              )}
              <Tooltip title="Copy value">
                <IconButton 
                  size="small" 
                  onClick={handleCopy}
                  sx={{ p: 0.5, ml: 0.5 }}
                >
                  <CopyIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
            
            {variable.description && (
              <Typography 
                variant="caption" 
                color="text.secondary"
                sx={{ fontStyle: 'italic' }}
              >
                {variable.description}
              </Typography>
            )}
          </Box>
          
          <Box display="flex" alignItems="flex-start" ml={2}>
            <IconButton 
              size="small" 
              onClick={() => onToggleEdit(variable.id)}
              sx={{ p: 0.5 }}
            >
              <EditIcon fontSize="small" />
            </IconButton>
            <IconButton 
              size="small" 
              onClick={() => onDelete(variable.id)}
              sx={{ p: 0.5, color: 'error.main' }}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

// Add new variable component
const AddVariableForm = ({ onAdd, onCancel }) => {
  const theme = useTheme();
  const [key, setKey] = useState('');
  const [value, setValue] = useState('');
  const [description, setDescription] = useState('');
  const [isSecret, setIsSecret] = useState(false);
  const [showValue, setShowValue] = useState(true);

  const handleAdd = () => {
    if (key.trim() && value.trim()) {
      onAdd({ key, value, description, isSecret });
      setKey('');
      setValue('');
      setDescription('');
      setIsSecret(false);
      setShowValue(true);
    }
  };

  return (
    <Card 
      sx={{ 
        mb: 2, 
        border: `2px dashed ${theme.palette.primary.main}`,
        borderRadius: 2,
        bgcolor: alpha(theme.palette.primary.main, 0.02)
      }}
    >
      <CardContent sx={{ pb: 2 }}>
        <Typography variant="subtitle2" gutterBottom color="primary">
          Add New Variable
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Variable Name"
              size="small"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="API_KEY"
            />
          </Grid>
          <Grid item xs={12} md={8}>
            <TextField
              fullWidth
              label="Value"
              size="small"
              type={isSecret && !showValue ? 'password' : 'text'}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Enter variable value"
              InputProps={{
                endAdornment: isSecret && (
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      onClick={() => setShowValue(!showValue)}
                    >
                      {showValue ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Description (Optional)"
              size="small"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this variable used for?"
            />
          </Grid>
          <Grid item xs={12}>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <FormControlLabel
                control={
                  <Switch
                    checked={isSecret}
                    onChange={(e) => setIsSecret(e.target.checked)}
                    size="small"
                  />
                }
                label="Secret variable"
              />
              <Box>
                <Button size="small" onClick={onCancel} sx={{ mr: 1 }}>
                  Cancel
                </Button>
                <Button 
                  size="small" 
                  variant="contained" 
                  onClick={handleAdd}
                  disabled={!key.trim() || !value.trim()}
                >
                  Add Variable
                </Button>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

// Main Environment Editor Dialog
const EnvironmentEditor = ({ 
  open, 
  environment, 
  onSave, 
  onClose 
}) => {
  const theme = useTheme();
  const [name, setName] = useState('');
  const [variables, setVariables] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingVariableId, setEditingVariableId] = useState(null);
  const [showJsonView, setShowJsonView] = useState(false);
  const [errors, setErrors] = useState([]);

  useEffect(() => {
    if (environment) {
      setName(environment.name || '');
      
      // Convert variables object to array format for easier editing
      const variablesArray = Object.entries(environment.variables || {}).map(([key, value], index) => ({
        id: `var_${index}`,
        key,
        value: typeof value === 'string' ? value : JSON.stringify(value),
        description: '',
        isSecret: false,
      }));
      
      setVariables(variablesArray);
    } else {
      setName('');
      setVariables([]);
    }
    setShowAddForm(false);
    setEditingVariableId(null);
    setShowJsonView(false);
    setErrors([]);
  }, [environment, open]);

  const validateEnvironment = () => {
    const newErrors = [];
    
    if (!name.trim()) {
      newErrors.push('Environment name is required');
    }
    
    if (variables.length === 0) {
      newErrors.push('At least one variable is required');
    }
    
    const duplicateKeys = variables
      .map(v => v.key)
      .filter((key, index, arr) => arr.indexOf(key) !== index);
    
    if (duplicateKeys.length > 0) {
      newErrors.push(`Duplicate variable names: ${duplicateKeys.join(', ')}`);
    }
    
    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleSave = () => {
    if (!validateEnvironment()) {
      return;
    }
    
    const variablesObject = variables.reduce((acc, variable) => {
      acc[variable.key] = variable.value;
      return acc;
    }, {});
    
    const environmentData = {
      id: environment?.id || `env_${Date.now()}`,
      name: name.trim(),
      variables: variablesObject,
    };
    
    onSave(environmentData);
  };

  const handleAddVariable = (newVariable) => {
    const variableWithId = {
      ...newVariable,
      id: `var_${Date.now()}`,
    };
    setVariables(prev => [...prev, variableWithId]);
    setShowAddForm(false);
  };

  const handleUpdateVariable = (id, updatedVariable) => {
    setVariables(prev => prev.map(variable => 
      variable.id === id ? { ...variable, ...updatedVariable } : variable
    ));
  };

  const handleDeleteVariable = (id) => {
    setVariables(prev => prev.filter(variable => variable.id !== id));
  };

  const getJsonPreview = () => {
    const variablesObject = variables.reduce((acc, variable) => {
      acc[variable.key] = variable.value;
      return acc;
    }, {});
    
    return JSON.stringify({ name, variables: variablesObject }, null, 2);
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          minHeight: '600px',
        }
      }}
    >
      <DialogTitle 
        sx={{ 
          pb: 1,
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="h6" component="div">
              {environment ? 'Edit Environment' : 'Create Environment'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Manage your environment variables for API requests
            </Typography>
          </Box>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent sx={{ pt: 3, pb: 2 }}>
        {errors.length > 0 && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {errors.map((error, index) => (
              <div key={index}>{error}</div>
            ))}
          </Alert>
        )}
        
        {/* Environment Name */}
        <Box mb={3}>
          <TextField
            fullWidth
            label="Environment Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Development, Production, Testing"
            sx={{ mb: 1 }}
          />
          <Typography variant="caption" color="text.secondary">
            Choose a descriptive name for this environment
          </Typography>
        </Box>

        <Divider sx={{ mb: 3 }} />

        {/* Variables Section */}
        <Box mb={3}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Box>
              <Typography variant="h6" gutterBottom>
                Environment Variables
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Add variables that can be used in your API requests
              </Typography>
            </Box>
            <Box>
              <Button
                size="small"
                variant="outlined"
                startIcon={showJsonView ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
                onClick={() => setShowJsonView(!showJsonView)}
                sx={{ mr: 1 }}
              >
                {showJsonView ? 'Hide' : 'Show'} JSON
              </Button>
              {!showAddForm && (
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setShowAddForm(true)}
                  size="small"
                >
                  Add Variable
                </Button>
              )}
            </Box>
          </Box>

          {/* JSON Preview */}
          <Collapse in={showJsonView}>
            <Card sx={{ mb: 2, bgcolor: alpha(theme.palette.grey[500], 0.05) }}>
              <CardContent>
                <Typography variant="subtitle2" gutterBottom>
                  JSON Preview
                </Typography>
                <Box
                  component="pre"
                  sx={{
                    fontFamily: 'Monaco, Consolas, "Courier New", monospace',
                    fontSize: '0.875rem',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    color: 'text.secondary',
                    maxHeight: '200px',
                    overflow: 'auto',
                    m: 0,
                  }}
                >
                  {getJsonPreview()}
                </Box>
              </CardContent>
            </Card>
          </Collapse>

          {/* Add Variable Form */}
          {showAddForm && (
            <AddVariableForm
              onAdd={handleAddVariable}
              onCancel={() => setShowAddForm(false)}
            />
          )}

          {/* Variables List */}
          {variables.length === 0 && !showAddForm ? (
            <Card 
              sx={{ 
                border: `2px dashed ${alpha(theme.palette.divider, 0.3)}`,
                borderRadius: 2,
                bgcolor: alpha(theme.palette.grey[500], 0.02)
              }}
            >
              <CardContent sx={{ textAlign: 'center', py: 4 }}>
                <InfoIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
                <Typography variant="body1" color="text.secondary" gutterBottom>
                  No variables added yet
                </Typography>
                <Typography variant="body2" color="text.disabled">
                  Click "Add Variable" to get started
                </Typography>
              </CardContent>
            </Card>
          ) : (
            variables.map((variable) => (
              <VariableRow
                key={variable.id}
                variable={variable}
                onUpdate={handleUpdateVariable}
                onDelete={handleDeleteVariable}
                isEditing={editingVariableId === variable.id}
                onToggleEdit={setEditingVariableId}
              />
            ))
          )}
        </Box>
      </DialogContent>

      <DialogActions 
        sx={{ 
          px: 3, 
          py: 2, 
          borderTop: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Button onClick={onClose} size="large">
          Cancel
        </Button>
        <Button 
          variant="contained" 
          onClick={handleSave}
          size="large"
          startIcon={<SaveIcon />}
          disabled={!name.trim() || variables.length === 0}
        >
          {environment ? 'Update Environment' : 'Create Environment'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EnvironmentEditor;
