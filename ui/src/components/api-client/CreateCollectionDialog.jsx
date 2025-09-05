/* eslint-disable max-statements */
/* eslint-disable max-lines */
import React, { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import {
  Add as AddIcon,
  Close as CloseIcon,
  Upload as UploadIcon,
} from '@mui/icons-material';
import { useCreateCollectionMutation, useImportCollectionMutation } from '../../store/api/apiClientApi';

const CreateCollectionDialog = ({ open, onClose, onCollectionCreated }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [error, setError] = useState('');
  const [newCollectionData, setNewCollectionData] = useState({ name: '', description: '' });
  const [importFile, setImportFile] = useState(null);
  const [importData, setImportData] = useState('');

  // RTK Query mutations
  const [createCollection, { isLoading: isCreating }] = useCreateCollectionMutation();
  const [importCollection, { isLoading: isImporting }] = useImportCollectionMutation();
  
  const loading = isCreating || isImporting;

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    setError('');
  };

  const resetForm = () => {
    setNewCollectionData({ name: '', description: '' });
    setImportFile(null);
    setImportData('');
    setError('');
    setActiveTab(0);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleCreateCollection = async () => {
    if (!newCollectionData.name.trim()) {
      setError('Collection name is required');
      return;
    }

    setError('');

    try {
      const result = await createCollection({
        name: newCollectionData.name.trim(),
        description: newCollectionData.description.trim(),
        requests: [],
      }).unwrap();

      onCollectionCreated(result);
      handleClose();
    } catch (err) {
      setError(err.data?.error || err.message || 'Failed to create collection');
    }
  };

  const handleImportCollection = async () => {
    const collectionData = await getCollectionData();
    if (!collectionData) return;
    await importCollectionData(collectionData);
  };

  const getCollectionData = async () => {
    try {
      if (importFile) {
        const fileContent = await readFileAsText(importFile);
        return JSON.parse(fileContent);
      }
      if (importData) {
        return JSON.parse(importData);
      }
      setError('Please provide collection data or select a file');
      return null;
    } catch (err) {
      setError(err instanceof SyntaxError ? 'Invalid JSON format' : `Failed to parse collection: ${err.message}`);
      return null;
    }
  };

  const importCollectionData = async (collectionData) => {
    setError('');

    try {
      const result = await importCollection({ collection: collectionData }).unwrap();
      onCollectionCreated(result);
      handleClose();
    } catch (err) {
      setError(err.data?.error || err.message || 'Failed to import collection');
    }
  };

  const readFileAsText = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = (e) => reject(e);
      reader.readAsText(file);
    });
  };

  const handleFileChange = (event) => {
    const [file] = event.target.files;
    if (file) {
      if (file.type === 'application/json' || file.name.endsWith('.json')) {
        setImportFile(file);
        setImportData('');
        setError('');
      } else {
        setError('Please select a JSON file');
        event.target.value = '';
      }
    }
  };

  return (
    <Dialog fullWidth maxWidth="md" open={open} onClose={handleClose}>
      <DialogTitle>
        <Box alignItems="center" display="flex" justifyContent="space-between">
          <Typography variant="h6">Collections</Typography>
          <IconButton size="small" onClick={handleClose}>
            <CloseIcon />
          </IconButton>
        </Box>
        <Tabs sx={{ mt: 2 }} value={activeTab} onChange={handleTabChange}>
          <Tab icon={<AddIcon />} iconPosition="start" label="Create New" />
          <Tab icon={<UploadIcon />} iconPosition="start" label="Import" />
        </Tabs>
      </DialogTitle>

      <DialogContent>
        {!!(error) && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {activeTab === 0 && (
          <Box sx={{ pt: 1 }}>
            <Typography color="text.secondary" sx={{ mb: 3 }} variant="body2">
              Create a new collection to organize your API requests
            </Typography>
            
            <TextField
              autoFocus
              fullWidth
              required
              disabled={loading}
              label="Collection Name"
              margin="normal"
              value={newCollectionData.name}
              onChange={(e) => setNewCollectionData(prev => ({ ...prev, name: e.target.value }))}
            />
            
            <TextField
              fullWidth
              multiline
              disabled={loading}
              label="Description (Optional)"
              margin="normal"
              rows={3}
              value={newCollectionData.description}
              onChange={(e) => setNewCollectionData(prev => ({ ...prev, description: e.target.value }))}
            />
          </Box>
        )}

        {activeTab === 1 && (
          <Box sx={{ pt: 1 }}>
            <Typography color="text.secondary" sx={{ mb: 3 }} variant="body2">
              Import a collection from API Client (v2.0 or v2.1 format)
            </Typography>

            <Paper sx={{ p: 2, mb: 2, border: '2px dashed', borderColor: 'divider', textAlign: 'center' }} variant="outlined">
              <input
                accept=".json"
                disabled={loading}
                id="collection-file-input"
                style={{ display: 'none' }}
                type="file"
                onChange={handleFileChange}
              />
              <label htmlFor="collection-file-input">
                <Button component="span" disabled={loading} startIcon={<UploadIcon />} variant="outlined">
                  Choose Collection File
                </Button>
              </label>
              {importFile ? <Typography sx={{ mt: 1, color: 'text.secondary' }} variant="body2">
                  Selected: {importFile.name}
                </Typography> : null}
            </Paper>

            <Typography sx={{ mb: 1, textAlign: 'center' }} variant="body2">
              OR
            </Typography>

            <TextField
              fullWidth
              multiline
              disabled={loading}
              label="Paste Collection JSON"
              placeholder="Paste your API Client collection JSON here..."
              rows={8}
              sx={{ fontFamily: 'monospace' }}
              value={importData}
              onChange={(e) => { setImportData(e.target.value); if (e.target.value) setImportFile(null); }}
            />
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button disabled={loading} onClick={handleClose}>
          Cancel
        </Button>
        
        {activeTab === 0 ? (
          <Button
            disabled={!newCollectionData.name.trim() || loading}
            startIcon={loading ? <CircularProgress size={16} /> : <AddIcon />}
            variant="contained"
            onClick={handleCreateCollection}
          >
            {loading ? 'Creating...' : 'Create Collection'}
          </Button>
        ) : (
          <Button
            disabled={(!importFile && !importData.trim()) || loading}
            startIcon={loading ? <CircularProgress size={16} /> : <UploadIcon />}
            variant="contained"
            onClick={handleImportCollection}
          >
            {loading ? 'Importing...' : 'Import Collection'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default CreateCollectionDialog;
