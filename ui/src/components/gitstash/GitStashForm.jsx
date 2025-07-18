import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Grid,
  Card,
  CardContent,
  Alert,
} from '@mui/material';
import { useDispatch } from 'react-redux';
import { Search as SearchIcon } from '@mui/icons-material';
import { setSelectedProject, setError } from '../../store/slices/prSlice';

const STORAGE_KEY = 'gitstash_project_config';

const GitStashForm = ({ onNext }) => {
  const dispatch = useDispatch();
  const [formData, setFormData] = useState({
    projectKey: '',
    repoSlug: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  // Load saved values from localStorage on component mount
  useEffect(() => {
    try {
      const savedConfig = localStorage.getItem(STORAGE_KEY);
      if (savedConfig) {
        const parsedConfig = JSON.parse(savedConfig);
        setFormData({
          projectKey: parsedConfig.projectKey || '',
          repoSlug: parsedConfig.repoSlug || '',
        });
      }
    } catch (error) {
      console.warn('Failed to load saved project configuration:', error);
    }
  }, []);

  // Save to localStorage whenever form data changes
  const saveToLocalStorage = (data) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to save project configuration:', error);
    }
  };

  const handleInputChange = (field) => (event) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    
    if (!formData.projectKey.trim() || !formData.repoSlug.trim()) {
      dispatch(setError('Please enter both Project Key and Repository Slug'));
      return;
    }

    setIsLoading(true);
    dispatch(setError(null));

    try {
      const projectData = {
        projectKey: formData.projectKey.trim(),
        repoSlug: formData.repoSlug.trim(),
      };

      // Save to localStorage for future use
      saveToLocalStorage(projectData);

      // Set the selected project in Redux store
      dispatch(setSelectedProject(projectData));

      // Move to next step
      onNext();
    } catch {
      dispatch(setError('Failed to set project details'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto' }}>
      <Typography variant="h5" component="h2" sx={{ mb: 3, textAlign: 'center' }}>
        Select GitStash Repository
      </Typography>
      
      <Card elevation={1} sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Enter the project key and repository slug to fetch pull requests from GitStash.
          </Typography>
          
          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="body2" component="div">
              <strong>Example:</strong><br />
              Project Key: <code>MYPROJ</code><br />
              Repository Slug: <code>my-repository</code><br />
              <em>Note: Your settings will be saved for next time.</em>
            </Typography>
          </Alert>
        </CardContent>
      </Card>

      <form onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Project Key"
              value={formData.projectKey}
              onChange={handleInputChange('projectKey')}
              placeholder="e.g., MYPROJ"
              required
              helperText="The project key from your GitStash URL"
              disabled={isLoading}
            />
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Repository Slug"
              value={formData.repoSlug}
              onChange={handleInputChange('repoSlug')}
              placeholder="e.g., my-repository"
              required
              helperText="The repository slug from your GitStash URL"
              disabled={isLoading}
            />
          </Grid>
          
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
              <Button
                type="submit"
                variant="contained"
                size="large"
                startIcon={<SearchIcon />}
                disabled={isLoading || !formData.projectKey.trim() || !formData.repoSlug.trim()}
                sx={{
                  minWidth: 200,
                  background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #0d7377 0%, #2dd4bf 100%)',
                  },
                }}
              >
                {isLoading ? 'Loading...' : 'Fetch Pull Requests'}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </form>
    </Box>
  );
};

export default GitStashForm;
