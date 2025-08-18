import { useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  List,
  ListItem,
  ListItemText,
  TextField,
  Typography,
  alpha,
  useTheme,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Public as GlobalIcon,
} from '@mui/icons-material';

const EnvironmentManager = ({ 
  environments, 
  activeEnvironment, 
  onEnvironmentChange, 
  onEnvironmentUpdate 
}) => {
  const theme = useTheme();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEnv, setEditingEnv] = useState(null);
  const [envName, setEnvName] = useState('');
  const [envVariables, setEnvVariables] = useState('');

  const handleCreateEnvironment = () => {
    setEditingEnv(null);
    setEnvName('');
    setEnvVariables('{}');
    setDialogOpen(true);
  };

  const handleEditEnvironment = (env) => {
    setEditingEnv(env);
    setEnvName(env.name);
    setEnvVariables(JSON.stringify(env.variables, null, 2));
    setDialogOpen(true);
  };

  const handleSaveEnvironment = () => {
    try {
      const variables = JSON.parse(envVariables);
      const envData = {
        id: editingEnv?.id || Date.now(),
        name: envName,
        variables,
      };
      
      onEnvironmentUpdate(envData);
      setDialogOpen(false);
    } catch (error) {
      // TODO: Show validation error
      console.error('Invalid JSON:', error);
    }
  };

  const handleDeleteEnvironment = (env) => {
    // TODO: Implement delete functionality
    console.log('Delete environment:', env);
  };

  if (!environments || environments.length === 0) {
    return (
      <Box sx={{ p: 2 }}>
        <Box 
          alignItems="center" 
          display="flex" 
          justifyContent="space-between" 
          mb={2}
        >
          <Typography variant="h6">Environments</Typography>
          <IconButton size="small" onClick={handleCreateEnvironment}>
            <AddIcon />
          </IconButton>
        </Box>
        
        <Box
          sx={{
            border: `2px dashed ${alpha(theme.palette.divider, 0.3)}`,
            borderRadius: '12px',
            p: 3,
            textAlign: 'center',
            color: 'text.secondary',
          }}
        >
          <GlobalIcon sx={{ fontSize: 48, mb: 1, opacity: 0.5 }} />
          <Typography variant="body2">
            No environments yet
          </Typography>
          <Typography display="block" sx={{ mt: 1 }} variant="caption">
            Create environments to manage variables across requests
          </Typography>
        </Box>

        <EnvironmentDialog
          dialogOpen={dialogOpen}
          editingEnv={editingEnv}
          envName={envName}
          envVariables={envVariables}
          onClose={() => setDialogOpen(false)}
          onEnvNameChange={setEnvName}
          onEnvVariablesChange={setEnvVariables}
          onSave={handleSaveEnvironment}
        />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      <Box 
        alignItems="center" 
        display="flex" 
        justifyContent="space-between" 
        mb={2}
      >
        <Typography variant="h6">Environments</Typography>
        <IconButton size="small" onClick={handleCreateEnvironment}>
          <AddIcon />
        </IconButton>
      </Box>
      
      <List dense>
        {environments.map((env) => (
          <ListItem
            button
            key={env.id}
            selected={activeEnvironment?.id === env.id}
            sx={{
              borderRadius: '8px',
              mb: 0.5,
              '&:hover': {
                background: alpha(theme.palette.primary.main, 0.1),
              },
              '&.Mui-selected': {
                background: alpha(theme.palette.primary.main, 0.2),
              },
            }}
            onClick={() => onEnvironmentChange(env)}
          >
            <GlobalIcon sx={{ mr: 1, fontSize: 20 }} />
            <ListItemText 
              primary={env.name}
              primaryTypographyProps={{
                variant: 'body2',
                fontWeight: 600,
              }}
              secondary={`${Object.keys(env.variables || {}).length} variables`}
              secondaryTypographyProps={{
                variant: 'caption',
              }}
            />
            <Box>
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  handleEditEnvironment(env);
                }}
              >
                <EditIcon fontSize="small" />
              </IconButton>
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteEnvironment(env);
                }}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Box>
          </ListItem>
        ))}
      </List>

      <EnvironmentDialog
        dialogOpen={dialogOpen}
        editingEnv={editingEnv}
        envName={envName}
        envVariables={envVariables}
        onClose={() => setDialogOpen(false)}
        onEnvNameChange={setEnvName}
        onEnvVariablesChange={setEnvVariables}
        onSave={handleSaveEnvironment}
      />
    </Box>
  );
};

const EnvironmentDialog = ({
  dialogOpen,
  editingEnv,
  envName,
  envVariables,
  onClose,
  onEnvNameChange,
  onEnvVariablesChange,
  onSave,
}) => (
  <Dialog fullWidth maxWidth="md" open={dialogOpen} onClose={onClose}>
    <DialogTitle>
      {editingEnv ? 'Edit Environment' : 'Create Environment'}
    </DialogTitle>
    <DialogContent>
      <TextField
        autoFocus
        fullWidth
        label="Environment Name"
        margin="normal"
        value={envName}
        onChange={(e) => onEnvNameChange(e.target.value)}
      />
      <TextField
        fullWidth
        multiline
        label="Variables (JSON)"
        margin="normal"
        placeholder='{\n  "API_URL": "https://api.example.com",\n  "API_KEY": "your-api-key"\n}'
        rows={8}
        sx={{
          '& .MuiOutlinedInput-root': {
            fontFamily: 'Monaco, Consolas, "Courier New", monospace',
          },
        }}
        value={envVariables}
        onChange={(e) => onEnvVariablesChange(e.target.value)}
      />
    </DialogContent>
    <DialogActions>
      <Button onClick={onClose}>Cancel</Button>
      <Button variant="contained" onClick={onSave}>
        {editingEnv ? 'Update' : 'Create'}
      </Button>
    </DialogActions>
  </Dialog>
);

export default EnvironmentManager;
