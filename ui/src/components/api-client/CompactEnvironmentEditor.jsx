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

// Compact table row for editing
const EditableTableRow = ({ 
  variable, 
  onUpdate, 
  onDelete, 
  isEditing, 
  onToggleEdit,
  isNew = false 
}) => {
  const theme = useTheme();
  const [key, setKey] = useState(variable?.key || '');
  const [value, setValue] = useState(variable?.value || '');
  const [description, setDescription] = useState(variable?.description || '');
  const [isSecret, setIsSecret] = useState(variable?.isSecret || false);
  const [showValue, setShowValue] = useState(!isSecret);

  const handleSave = () => {
    if (key.trim() && value.trim()) {
      onUpdate(variable?.id || `var_${Date.now()}`, { key, value, description, isSecret });
      onToggleEdit(null);
      if (isNew) {
        setKey('');
        setValue('');
        setDescription('');
        setIsSecret(false);
      }
    }
  };

  const handleCancel = () => {
    if (!isNew) {
      setKey(variable.key);
      setValue(variable.value);
      setDescription(variable.description || '');
      setIsSecret(variable.isSecret || false);
    } else {
      setKey('');
      setValue('');
      setDescription('');
      setIsSecret(false);
    }
    onToggleEdit(null);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(variable.value);
  };

  if (isEditing) {
    return (
      <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
        <TableCell sx={{ py: 0.5, px: 1 }}>
          <TextField
            fullWidth
            size="small"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="Variable name"
            variant="outlined"
            sx={{ '& .MuiOutlinedInput-root': { height: 36 } }}
          />
        </TableCell>
        <TableCell sx={{ py: 0.5, px: 1 }}>
          <TextField
            fullWidth
            size="small"
            type={isSecret && !showValue ? 'password' : 'text'}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Value"
            variant="outlined"
            sx={{ '& .MuiOutlinedInput-root': { height: 36 } }}
            InputProps={{
              endAdornment: isSecret && (
                <InputAdornment position="end">
                  <IconButton
                    size="small"
                    onClick={() => setShowValue(!showValue)}
                    sx={{ p: 0.5 }}
                  >
                    {showValue ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        </TableCell>
        <TableCell sx={{ py: 0.5, px: 1 }}>
          <TextField
            fullWidth
            size="small"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description"
            variant="outlined"
            sx={{ '& .MuiOutlinedInput-root': { height: 36 } }}
          />
        </TableCell>
        <TableCell sx={{ py: 0.5, px: 1, textAlign: 'center' }}>
          <Switch
            checked={isSecret}
            onChange={(e) => setIsSecret(e.target.checked)}
            size="small"
          />
        </TableCell>
        <TableCell sx={{ py: 0.5, px: 1 }}>
          <Box display="flex" gap={0.5}>
            <Tooltip title="Save">
              <IconButton 
                size="small" 
                onClick={handleSave}
                disabled={!key.trim() || !value.trim()}
                color="primary"
                sx={{ p: 0.5 }}
              >
                <SaveIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Cancel">
              <IconButton size="small" onClick={handleCancel} sx={{ p: 0.5 }}>
                <CloseIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </TableCell>
      </TableRow>
    );
  }

  if (!variable) return null;

  const displayValue = variable.isSecret && !showValue 
    ? '•'.repeat(8) 
    : value;

  return (
    <TableRow 
      hover
      sx={{ 
        '&:hover': {
          bgcolor: alpha(theme.palette.action.hover, 0.3),
        }
      }}
    >
      <TableCell sx={{ py: 1, px: 1 }}>
        <Box display="flex" alignItems="center" gap={1}>
          <Typography variant="body2" fontWeight={500} sx={{ fontSize: '0.875rem' }}>
            {variable.key}
          </Typography>
          {variable.isSecret && (
            <Chip 
              label="Secret" 
              size="small" 
              color="warning"
              sx={{ height: 16, fontSize: '0.6rem', '& .MuiChip-label': { px: 0.5 } }}
            />
          )}
        </Box>
      </TableCell>
      <TableCell sx={{ py: 1, px: 1 }}>
        <Box display="flex" alignItems="center" gap={0.5}>
          <Typography 
            variant="body2" 
            sx={{ 
              fontFamily: 'monospace',
              fontSize: '0.75rem',
              color: 'text.secondary',
              maxWidth: 150,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {displayValue}
          </Typography>
          {variable.isSecret && (
            <Tooltip title={showValue ? 'Hide value' : 'Show value'}>
              <IconButton
                size="small"
                onClick={() => setShowValue(!showValue)}
                sx={{ p: 0.25 }}
              >
                {showValue ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
              </IconButton>
            </Tooltip>
          )}
          <Tooltip title="Copy value">
            <IconButton
              size="small"
              onClick={handleCopy}
              sx={{ p: 0.25 }}
            >
              <CopyIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </TableCell>
      <TableCell sx={{ py: 1, px: 1 }}>
        <Typography 
          variant="body2" 
          color="text.secondary"
          sx={{ 
            fontSize: '0.75rem',
            maxWidth: 120,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {variable.description || '-'}
        </Typography>
      </TableCell>
      <TableCell sx={{ py: 1, px: 1, textAlign: 'center' }}>
        {variable.isSecret ? (
          <Chip label="Yes" size="small" color="warning" sx={{ height: 16, fontSize: '0.6rem' }} />
        ) : (
          <Chip label="No" size="small" color="default" sx={{ height: 16, fontSize: '0.6rem' }} />
        )}
      </TableCell>
      <TableCell sx={{ py: 1, px: 1 }}>
        <Box display="flex" gap={0.25}>
          <Tooltip title="Edit">
            <IconButton 
              size="small" 
              onClick={() => onToggleEdit(variable.id)}
              sx={{ p: 0.25 }}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton 
              size="small" 
              onClick={() => onDelete(variable.id)}
              color="error"
              sx={{ p: 0.25 }}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </TableCell>
    </TableRow>
  );
};

const CompactEnvironmentEditor = ({ 
  open, 
  onClose, 
  onSave, 
  environment = null 
}) => {
  const theme = useTheme();
  const [name, setName] = useState('');
  const [variables, setVariables] = useState([]);
  const [editingVariableId, setEditingVariableId] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showJsonView, setShowJsonView] = useState(false);
  const [errors, setErrors] = useState([]);

  useEffect(() => {
    if (environment) {
      setName(environment.name || '');
      
      const variablesArray = Object.entries(environment.variables || {}).map(([key, value]) => ({
        id: `var_${key}_${Date.now()}`,
        key,
        value,
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

  const handleUpdateVariable = (id, updatedVariable) => {
    setVariables(prev => {
      const existingIndex = prev.findIndex(v => v.id === id);
      if (existingIndex >= 0) {
        return prev.map(variable => 
          variable.id === id ? { ...variable, ...updatedVariable } : variable
        );
      } else {
        // Adding new variable
        return [...prev, { ...updatedVariable, id }];
      }
    });
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
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          height: '85vh',
          maxHeight: '800px',
        }
      }}
    >
      <DialogTitle 
        sx={{ 
          pb: 1,
          borderBottom: `1px solid ${theme.palette.divider}`,
          px: 2,
          py: 1.5,
        }}
      >
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="h6" component="div" sx={{ fontSize: '1.1rem' }}>
              {environment ? 'Edit Environment' : 'Create Environment'}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
              Manage environment variables for API requests
            </Typography>
          </Box>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent sx={{ p: 2, height: 'calc(100% - 120px)', overflow: 'auto' }}>
        {errors.length > 0 && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {errors.map((error, index) => (
              <div key={index}>{error}</div>
            ))}
          </Alert>
        )}
        
        {/* Environment Name - Compact */}
        <Box mb={2}>
          <TextField
            fullWidth
            label="Environment Name"
            size="small"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Development, Production, Testing..."
            sx={{ '& .MuiOutlinedInput-root': { height: 40 } }}
          />
        </Box>

        <Divider sx={{ mb: 2 }} />

        {/* Variables Section Header */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, fontSize: '1rem' }}>
            Variables ({variables.length})
          </Typography>
          <Box display="flex" gap={1}>
            <Button
              size="small"
              variant="outlined"
              startIcon={showJsonView ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
              onClick={() => setShowJsonView(!showJsonView)}
              sx={{ fontSize: '0.75rem', py: 0.5, px: 1 }}
            >
              JSON
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setShowAddForm(true)}
              size="small"
              sx={{ fontSize: '0.75rem', py: 0.5, px: 1.5 }}
            >
              Add
            </Button>
          </Box>
        </Box>

        {/* JSON Preview - Compact */}
        <Collapse in={showJsonView}>
          <Paper 
            variant="outlined" 
            sx={{ 
              mb: 2, 
              p: 1.5, 
              bgcolor: alpha(theme.palette.grey[500], 0.03),
              maxHeight: '150px',
              overflow: 'auto'
            }}
          >
            <Typography variant="caption" color="text.secondary" gutterBottom display="block">
              JSON Preview
            </Typography>
            <Box
              component="pre"
              sx={{
                fontFamily: 'Monaco, Consolas, "Courier New", monospace',
                fontSize: '0.75rem',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                color: 'text.secondary',
                m: 0,
                lineHeight: 1.4,
              }}
            >
              {getJsonPreview()}
            </Box>
          </Paper>
        </Collapse>

        {/* Variables Table */}
        <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: '400px' }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.8rem', py: 1 }}>Name</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.8rem', py: 1 }}>Value</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.8rem', py: 1 }}>Description</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.8rem', py: 1, textAlign: 'center' }}>Secret</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.8rem', py: 1 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {/* Add new variable row */}
              {showAddForm && (
                <EditableTableRow
                  isEditing={true}
                  isNew={true}
                  onUpdate={handleUpdateVariable}
                  onToggleEdit={(id) => {
                    if (id === null) setShowAddForm(false);
                  }}
                />
              )}
              
              {/* Existing variables */}
              {variables.map((variable) => (
                <EditableTableRow
                  key={variable.id}
                  variable={variable}
                  onUpdate={handleUpdateVariable}
                  onDelete={handleDeleteVariable}
                  isEditing={editingVariableId === variable.id}
                  onToggleEdit={setEditingVariableId}
                />
              ))}
              
              {/* Empty state */}
              {variables.length === 0 && !showAddForm && (
                <TableRow>
                  <TableCell colSpan={5} sx={{ textAlign: 'center', py: 4 }}>
                    <InfoIcon sx={{ fontSize: 32, color: 'text.disabled', mb: 1 }} />
                    <Typography variant="body2" color="text.secondary">
                      No variables added yet
                    </Typography>
                    <Button 
                      size="small" 
                      onClick={() => setShowAddForm(true)}
                      sx={{ mt: 1 }}
                    >
                      Add your first variable
                    </Button>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </DialogContent>

      <DialogActions 
        sx={{ 
          px: 2, 
          py: 1.5, 
          borderTop: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Button onClick={onClose}>
          Cancel
        </Button>
        <Button 
          variant="contained" 
          onClick={handleSave}
          startIcon={<SaveIcon />}
          disabled={!name.trim() || variables.length === 0}
        >
          {environment ? 'Update' : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CompactEnvironmentEditor;
