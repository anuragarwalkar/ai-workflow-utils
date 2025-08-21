/* eslint-disable max-statements */
/* eslint-disable max-lines */
import { useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Menu,
  MenuItem,
  TextField,
  Typography,
  alpha,
  useTheme,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Download as DownloadIcon,
  Edit as EditIcon,
  Public as GlobalIcon,
  FileUpload as ImportIcon,
  MoreVert as MoreVertIcon,
} from '@mui/icons-material';
import EnvironmentEditor from './CompactEnvironmentEditor';
import ToastService from '../../services/toastService';

// Header component with create and import buttons
const EnvironmentHeader = ({ onCreateEnvironment, onFileImport }) => (
  <Box alignItems="center" display="flex" justifyContent="flex-end" mb={1} px={0.5}>
    <Box>
      <input
        hidden
        accept=".json"
        id="import-file"
        type="file"
        onChange={onFileImport}
      />
      <label htmlFor="import-file">
        <IconButton component="span" size="small" title="Import Environment">
          <ImportIcon fontSize="small" />
        </IconButton>
      </label>
      <IconButton size="small" title="Create Environment" onClick={onCreateEnvironment}>
        <AddIcon fontSize="small" />
      </IconButton>
    </Box>
  </Box>
);

// Empty state component
const EmptyEnvironmentState = () => {
  const theme = useTheme();
  return (
    <Box
      sx={{
        border: `2px dashed ${alpha(theme.palette.divider, 0.3)}`,
        borderRadius: '8px',
        p: 2.5,
        textAlign: 'center',
        color: 'text.secondary',
      }}
    >
      <GlobalIcon sx={{ fontSize: 40, mb: 1, opacity: 0.5 }} />
      <Typography variant="body2" fontSize="0.875rem">No environments yet</Typography>
      <Typography display="block" sx={{ mt: 0.5 }} variant="caption" fontSize="0.75rem">
        Create environments to manage variables across requests
      </Typography>
    </Box>
  );
};

// Environment list component
const EnvironmentList = ({ 
  environments, 
  activeEnvironment, 
  onEnvironmentChange, 
  onMenuOpen 
}) => {
  const theme = useTheme();
  
  // Ensure environments is an array
  const envArray = Array.isArray(environments) ? environments : [];
  
  return (
    <List dense disablePadding>
      {envArray.map((env) => (
        <ListItem
          button
          key={env.id}
          selected={activeEnvironment?.id === env.id}
          disableGutters
          sx={{
            borderRadius: '6px',
            mb: 0.25,
            py: 0.5,
            px: 1,
            minHeight: 32,
            '&:hover': {
              background: alpha(theme.palette.primary.main, 0.04),
            },
            '&.Mui-selected': {
              background: alpha(theme.palette.primary.main, 0.12),
            },
            '&.Mui-selected:hover': {
              background: alpha(theme.palette.primary.main, 0.16),
            },
          }}
          onClick={() => onEnvironmentChange(env)}
        >
          <GlobalIcon sx={{ mr: 1, fontSize: 16, color: activeEnvironment?.id === env.id ? 'primary.main' : 'text.secondary' }} />
          <ListItemText 
            primary={env.name}
            primaryTypographyProps={{ 
              variant: 'body2', 
              fontWeight: 500,
              fontSize: '0.875rem',
              noWrap: true 
            }}
            secondary={`${Object.keys(env.variables || {}).length} variables`}
            secondaryTypographyProps={{ 
              variant: 'caption',
              fontSize: '0.75rem' 
            }}
            sx={{ my: 0 }}
          />
          <IconButton
            size="small"
            sx={{
              p: 0.25,
              '&:hover': {
                backgroundColor: alpha(theme.palette.action.hover, 0.5),
              },
            }}
            onClick={(e) => onMenuOpen(e, env)}
          >
            <MoreVertIcon sx={{ fontSize: 14 }} />
          </IconButton>
        </ListItem>
      ))}
    </List>
  );
};

// Environment menu component
const EnvironmentMenu = ({ 
  anchorEl, 
  environment, 
  onClose, 
  onEdit, 
  onDelete, 
  onExport 
}) => (
  <Menu
    anchorEl={anchorEl}
    open={Boolean(anchorEl)}
    onClose={onClose}
  >
    <MenuItem onClick={() => onEdit(environment)}>
      <EditIcon fontSize="small" sx={{ mr: 1 }} />
      Edit
    </MenuItem>
    <MenuItem onClick={() => onExport(environment)}>
      <DownloadIcon fontSize="small" sx={{ mr: 1 }} />
      Export
    </MenuItem>
    <Divider />
    <MenuItem sx={{ color: 'error.main' }} onClick={() => onDelete(environment)}>
      <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
      Delete
    </MenuItem>
  </Menu>
);

// Main environment manager component
const EnvironmentManager = ({ 
  environments = [], 
  activeEnvironment, 
  onEnvironmentChange, 
  onEnvironmentUpdate,
  onEnvironmentDelete,
  onEnvironmentImport,
  onEnvironmentExport,
  onEnvironmentSave,
}) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEnv, setEditingEnv] = useState(null);
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [selectedEnv, setSelectedEnv] = useState(null);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importData, setImportData] = useState('');

  const handleCreateEnvironment = () => {
    setEditingEnv(null);
    setDialogOpen(true);
  };

  const handleEditEnvironment = (env) => {
    setEditingEnv(env);
    setDialogOpen(true);
    setMenuAnchor(null);
  };

  const handleSaveEnvironment = async (envData) => {
    try {
      if (onEnvironmentSave) {
        const result = await onEnvironmentSave(envData);
        ToastService.success(
          editingEnv ? 'Environment updated successfully' : 'Environment created successfully'
        );
      } else if (onEnvironmentUpdate) {
        const result = onEnvironmentUpdate(envData);
        ToastService.success('Environment saved');
      } else {
        console.warn('[EnvironmentManager] [handleSaveEnvironment] No save or update handler provided');
        ToastService.error('No save handler available');
        return;
      }
      
      console.log('[EnvironmentManager] [handleSaveEnvironment] Closing dialog');
      setDialogOpen(false);
    } catch (error) {
      console.error('[EnvironmentManager] [handleSaveEnvironment] Error caught:', error);
      ToastService.error(`Failed to save environment: ${error.message || 'Unknown error'}`);
    }
  };

  const handleDeleteEnvironment = async (env) => {
    const isConfirmed = window.confirm(`Are you sure you want to delete "${env.name}"?`);
    if (isConfirmed) {
      try {
        if (onEnvironmentDelete) {
          await onEnvironmentDelete(env.id);
          ToastService.success('Environment deleted successfully');
        }
      } catch {
        ToastService.error('Failed to delete environment');
      }
    }
    setMenuAnchor(null);
  };

  const handleExportEnvironment = async (env) => {
    try {
      if (onEnvironmentExport) {
        const exportData = await onEnvironmentExport(env.id);
        
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
          type: 'application/json' 
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${env.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_environment.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        ToastService.success('Environment exported successfully');
      }
    } catch {
      ToastService.error('Failed to export environment');
    }
    setMenuAnchor(null);
  };

  const handleImportEnvironment = async () => {    
    try {
      if (!importData.trim()) {
        ToastService.error('No import data provided');
        return;
      }

      const parsedData = JSON.parse(importData);
      
      if (onEnvironmentImport) {
        await onEnvironmentImport(parsedData);
        ToastService.success('Environment imported successfully');
      } else {
        ToastService.error('Import function not available');
      }
      
      setImportDialogOpen(false);
      setImportData('');
    } catch (error) {
      console.error('[EnvironmentManager] [handleImportEnvironment] Import error:', error);
      ToastService.error('Invalid import data format');
    }
  };

  const handleFileImport = (event) => {
    console.log('[EnvironmentManager] [handleFileImport] File import triggered', event);
    
    // Prevent default propagation and handle file reading.
    event.preventDefault();
    const input = event.target;
    const file = input.files && input.files[0];
    
    console.log('[EnvironmentManager] [handleFileImport] Selected file:', file);
    
    if (!file) {
      console.log('[EnvironmentManager] [handleFileImport] No file selected');
      return;
    }

    // Validate file type
    if (!file.type.includes('json') && !file.name.toLowerCase().endsWith('.json')) {
      ToastService.error('Please select a JSON file');
      return;
    }

    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const result = e.target.result;
        console.log('[EnvironmentManager] [handleFileImport] File content loaded:', result?.length, 'characters');
        
        if (!result) {
          ToastService.error('File is empty or could not be read');
          return;
        }

        // Validate JSON format before setting import data
        JSON.parse(result);
        
        setImportData(result);
        setImportDialogOpen(true);
        
        console.log('[EnvironmentManager] [handleFileImport] Import dialog opened');

        // Reset the file input so the same file can be re-selected later
        setTimeout(() => {
          try {
            input.value = '';
          } catch (err) {
            console.log('[EnvironmentManager] [handleFileImport] Could not reset input value:', err);
          }
        }, 0);
      } catch (error) {
        console.error('[EnvironmentManager] [handleFileImport] Error parsing JSON:', error);
        ToastService.error('Invalid JSON file format');
      }
    };

    reader.onerror = (error) => {
      console.error('[EnvironmentManager] [handleFileImport] FileReader error:', error);
      ToastService.error('Error reading file');
    };

    reader.readAsText(file);
  };

  const handleMenuOpen = (event, env) => {
    event.stopPropagation();
    setMenuAnchor(event.currentTarget);
    setSelectedEnv(env);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setSelectedEnv(null);
  };

  if (!environments || environments.length === 0) {
    return (
      <>
        <Box sx={{ p: 1.5 }}>
          <EnvironmentHeader onFileImport={handleFileImport} onCreateEnvironment={handleCreateEnvironment} />
          <EmptyEnvironmentState />
        </Box>
        
        <EnvironmentEditor
          open={dialogOpen}
          environment={editingEnv}
          onSave={handleSaveEnvironment}
          onClose={() => setDialogOpen(false)}
        />

        <ImportDialog
          importData={importData}
          open={importDialogOpen}
          onClose={() => setImportDialogOpen(false)}
          onImport={handleImportEnvironment}
          onImportDataChange={setImportData}
        />
      </>
    );
  }

  return (
    <>
      <Box sx={{ p: 1.5 }}>
        <EnvironmentHeader 
          onCreateEnvironment={handleCreateEnvironment}
          onFileImport={handleFileImport}
        />
        
        <EnvironmentList
          activeEnvironment={activeEnvironment}
          environments={environments}
          onEnvironmentChange={onEnvironmentChange}
          onMenuOpen={handleMenuOpen}
        />
      </Box>

        <EnvironmentEditor
          open={dialogOpen}
          environment={editingEnv}
          onSave={handleSaveEnvironment}
          onClose={() => setDialogOpen(false)}
        />

      <ImportDialog
        importData={importData}
        open={importDialogOpen}
        onClose={() => setImportDialogOpen(false)}
        onImport={handleImportEnvironment}
        onImportDataChange={setImportData}
      />

      <EnvironmentMenu
        anchorEl={menuAnchor}
        environment={selectedEnv}
        onClose={handleMenuClose}
        onDelete={handleDeleteEnvironment}
        onEdit={handleEditEnvironment}
        onExport={handleExportEnvironment}
      />
    </>
  );
};

// Import dialog component
const ImportDialog = ({ open, importData, onClose, onImportDataChange, onImport }) => (
  <Dialog fullWidth maxWidth="md" open={open} onClose={onClose}>
    <DialogTitle>Import Environment</DialogTitle>
    <DialogContent>
      <TextField
        fullWidth
        multiline
        label="Environment JSON Data"
        margin="normal"
        placeholder="Paste your environment JSON data here..."
        rows={12}
        sx={{
          '& .MuiOutlinedInput-root': {
            fontFamily: 'Monaco, Consolas, "Courier New", monospace',
          },
        }}
        value={importData}
        onChange={(e) => onImportDataChange(e.target.value)}
      />
    </DialogContent>
    <DialogActions>
      <Button onClick={onClose}>Cancel</Button>
      <Button variant="contained" onClick={onImport}>Import</Button>
    </DialogActions>
  </Dialog>
);

export default EnvironmentManager;
