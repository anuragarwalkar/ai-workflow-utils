import React, { useState } from 'react';
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

const GitStashForm = ({ onNext }) => {
  const dispatch = useDispatch();
  const [formData, setFormData] = useState({
    projectKey: '',
    repoSlug: '',
  });
  const [isLoading, setIsLoading] = useState(false);

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
      // Set the selected project in Redux store
      dispatch(setSelectedProject({
        projectKey: formData.projectKey.trim(),
        repoSlug: formData.repoSlug.trim(),
      }));

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
            <Typography variant="body2">
              <strong>Example:</strong><br />
              Project Key: <code>MYPROJ</code><br />
              Repository Slug: <code>my-repository</code>
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
