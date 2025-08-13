import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Switch,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Cable as TestIcon,
} from '@mui/icons-material';
import {
  useGetMCPClientsQuery,
  useCreateMCPClientMutation,
  useUpdateMCPClientMutation,
  useDeleteMCPClientMutation,
  useTestMCPConnectionMutation,
} from '../../store/api/mcpApi';

const MCPClientsTab = () => {
  const [openDialog, setOpenDialog] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    command: '',
    args: '',
    token: '',
    description: '',
    enabled: true,
  });
  const [errors, setErrors] = useState({});

  const { data: clientsResponse, isLoading, error } = useGetMCPClientsQuery();
  const [createClient, { isLoading: isCreating }] = useCreateMCPClientMutation();
  const [updateClient, { isLoading: isUpdating }] = useUpdateMCPClientMutation();
  const [deleteClient] = useDeleteMCPClientMutation();
  const [testConnection, { isLoading: isTesting }] = useTestMCPConnectionMutation();

  const clients = clientsResponse?.data || [];

  const handleOpenDialog = (client = null) => {
    setEditingClient(client);
    setFormData(
      client || {
        name: '',
        url: '',
        command: '',
        args: '',
        token: '',
        description: '',
        enabled: true,
      }
    );
    setErrors({});
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingClient(null);
    setFormData({
      name: '',
      url: '',
      token: '',
      description: '',
      enabled: true,
    });
    setErrors({});
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name?.trim()) {
      newErrors.name = 'Name is required';
    }
    
    // Either URL (for remote) or command (for local) must be provided
    const hasUrl = formData.url?.trim();
    const hasCommand = formData.command?.trim();
    
    if (!hasUrl && !hasCommand) {
      newErrors.url = 'Either URL (for remote server) or Command (for local server) is required';
    }
    
    if (hasUrl) {
      try {
        new URL(formData.url);
      } catch {
        newErrors.url = 'Invalid URL format';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      if (editingClient) {
        await updateClient({ id: editingClient.id, ...formData }).unwrap();
      } else {
        await createClient(formData).unwrap();
      }
      handleCloseDialog();
    } catch (error) {
      setErrors({ submit: error.data?.error || 'Failed to save client' });
    }
  };

  const handleDelete = async (client) => {
    if (window.confirm(`Are you sure you want to delete "${client.name}"?`)) {
      try {
        await deleteClient(client.id).unwrap();
      } catch (error) {
        console.error('Failed to delete client:', error);
      }
    }
  };

  const handleTestConnection = async (client) => {
    try {
      const result = await testConnection(client.id).unwrap();
      alert(`Connection test successful: ${result.data.message}`);
    } catch (error) {
      alert(`Connection test failed: ${error.data?.error || 'Unknown error'}`);
    }
  };

  const handleToggleEnabled = async (client) => {
    try {
      await updateClient({
        id: client.id,
        ...client,
        enabled: !client.enabled,
      }).unwrap();
    } catch (error) {
      console.error('Failed to toggle client:', error);
    }
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" p={3}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        Failed to load MCP clients: {error.data?.error || 'Unknown error'}
      </Alert>
    );
  }

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5">MCP Clients</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add Client
        </Button>
      </Box>

      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>URL</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {clients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    No MCP clients configured
                  </TableCell>
                </TableRow>
              ) : (
                clients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell>{client.name}</TableCell>
                    <TableCell>{client.url}</TableCell>
                    <TableCell>{client.description || '-'}</TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Switch
                          checked={client.enabled}
                          onChange={() => handleToggleEnabled(client)}
                          size="small"
                        />
                        <Chip
                          size="small"
                          label={client.enabled ? 'Enabled' : 'Disabled'}
                          color={client.enabled ? 'success' : 'default'}
                        />
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" gap={1}>
                        <Tooltip title="Test Connection">
                          <IconButton
                            size="small"
                            onClick={() => handleTestConnection(client)}
                            disabled={isTesting}
                          >
                            <TestIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit">
                          <IconButton
                            size="small"
                            onClick={() => handleOpenDialog(client)}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton
                            size="small"
                            onClick={() => handleDelete(client)}
                            color="error"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Add/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingClient ? 'Edit MCP Client' : 'Add MCP Client'}
        </DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            {errors.submit && (
              <Alert severity="error">{errors.submit}</Alert>
            )}
            
            <TextField
              label="Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              error={!!errors.name}
              helperText={errors.name}
              fullWidth
            />
            
            <TextField
              label="URL (for remote servers)"
              value={formData.url}
              onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              error={!!errors.url}
              helperText={errors.url || "URL for remote MCP servers"}
              placeholder="https://example.com/mcp"
              fullWidth
            />
            
            <TextField
              label="Command (for local servers)"
              value={formData.command}
              onChange={(e) => setFormData({ ...formData, command: e.target.value })}
              placeholder="node, python, etc."
              helperText="Command to run local MCP server"
              fullWidth
            />
            
            <TextField
              label="Arguments (for local servers)"
              value={formData.args}
              onChange={(e) => setFormData({ ...formData, args: e.target.value })}
              placeholder="server.js --port 3000"
              helperText="Space-separated arguments for the command"
              fullWidth
            />
            
            <TextField
              label="Token (Optional)"
              type="password"
              value={formData.token}
              onChange={(e) => setFormData({ ...formData, token: e.target.value })}
              helperText="Authentication token if required"
              fullWidth
            />
            
            <TextField
              label="Description (Optional)"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              multiline
              rows={2}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={isCreating || isUpdating}
          >
            {isCreating || isUpdating ? (
              <CircularProgress size={20} />
            ) : (
              editingClient ? 'Update' : 'Create'
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MCPClientsTab;
