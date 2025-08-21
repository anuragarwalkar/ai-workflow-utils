import React, { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Grid,
  Typography,
} from '@mui/material';
import { Settings as SettingsIcon } from '@mui/icons-material';
import EnvironmentEditor from '../components/api-client/CompactEnvironmentEditor';

const EnvironmentEditorDemo = () => {
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingEnvironment, setEditingEnvironment] = useState(null);
  const [environments, setEnvironments] = useState([
    {
      id: 'env_1',
      name: 'Development',
      variables: {
        API_BASE_URL: 'https://api-dev.example.com',
        API_KEY: 'dev_api_key_12345',
        DATABASE_URL: 'postgres://localhost:5432/myapp_dev',
        DEBUG_MODE: 'true',
      },
    },
    {
      id: 'env_2',
      name: 'Production',
      variables: {
        API_BASE_URL: 'https://api.example.com',
        API_KEY: 'prod_api_key_67890',
        DATABASE_URL: 'postgres://prod-db.example.com:5432/myapp',
        DEBUG_MODE: 'false',
      },
    },
  ]);

  const handleSaveEnvironment = (environmentData) => {
    if (editingEnvironment) {
      // Update existing environment
      setEnvironments(prev => 
        prev.map(env => 
          env.id === environmentData.id ? environmentData : env
        )
      );
    } else {
      // Add new environment
      setEnvironments(prev => [...prev, environmentData]);
    }
    
    setEditorOpen(false);
    setEditingEnvironment(null);
  };

  const handleCreateNew = () => {
    setEditingEnvironment(null);
    setEditorOpen(true);
  };

  const handleEditEnvironment = (environment) => {
    setEditingEnvironment(environment);
    setEditorOpen(true);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box mb={4}>
        <Typography gutterBottom variant="h4">
          Environment Editor Demo
        </Typography>
        <Typography gutterBottom color="text.secondary" variant="body1">
          This demo showcases the improved environment editor with individual field management,
          better validation, and a more intuitive user experience.
        </Typography>
        
        <Alert severity="info" sx={{ mt: 2 }}>
          <strong>Key Improvements:</strong>
          <ul style={{ margin: '8px 0 0 20px' }}>
            <li>Individual field editing instead of raw JSON</li>
            <li>Secret variable masking with toggle visibility</li>
            <li>Variable descriptions and metadata</li>
            <li>Validation and error handling</li>
            <li>Copy-to-clipboard functionality</li>
            <li>Better visual design and interactions</li>
          </ul>
        </Alert>
      </Box>

      <Box mb={4}>
        <Button
          size="large"
          startIcon={<SettingsIcon />}
          variant="contained"
          onClick={handleCreateNew}
        >
          Create New Environment
        </Button>
      </Box>

      <Grid container spacing={3}>
        {environments.map((environment) => (
          <Grid item key={environment.id} md={6} xs={12}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box alignItems="flex-start" display="flex" justifyContent="space-between" mb={2}>
                  <Typography gutterBottom variant="h6">
                    {environment.name}
                  </Typography>
                  <Chip 
                    color="primary"
                    label={`${Object.keys(environment.variables || {}).length} vars`}
                    size="small"
                    variant="outlined"
                  />
                </Box>
                
                <Typography gutterBottom color="text.secondary" variant="body2">
                  Variables:
                </Typography>
                
                <Box mb={2}>
                  {Object.entries(environment.variables || {}).map(([key, value]) => (
                    <Chip
                      key={key}
                      label={`${key}: ${String(value).substring(0, 15)}${String(value).length > 15 ? '...' : ''}`}
                      size="small"
                      sx={{ mr: 1, mb: 1, fontSize: '0.75rem' }}
                      variant="outlined"
                    />
                  ))}
                </Box>
                
                <Button
                  fullWidth
                  startIcon={<SettingsIcon />}
                  variant="outlined"
                  onClick={() => handleEditEnvironment(environment)}
                >
                  Edit Environment
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <EnvironmentEditor
        environment={editingEnvironment}
        open={editorOpen}
        onClose={() => {
          setEditorOpen(false);
          setEditingEnvironment(null);
        }}
        onSave={handleSaveEnvironment}
      />
    </Container>
  );
};

export default EnvironmentEditorDemo;
