import React, { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  TextField,
  Typography,
  alpha,
} from '@mui/material';
import { 
  AutoAwesome as AutoAwesomeIcon,
} from '@mui/icons-material';
import { API_BASE_URL } from '../../config/environment.js';

const NaturalLanguageApiGenerator = ({ isDark, onApiRequestGenerated }) => {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const examplePrompts = [
    "Create a new user with name John and email john@example.com",
    "Get all users from the API",
    "Update user ID 123 with new email",
    "Delete user with ID 456",
    "Get user profile from GitHub API"
  ];

  const makeApiRequest = async () => {
    const response = await fetch(`${API_BASE_URL}/api/api-client/convert-nl`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt: prompt.trim() }),
    });
    
    return response.json();
  };

  const processApiResponse = async (result) => {
    if (result.success && result.apiRequest) {
      setSuccess(`API request generated using ${result.provider}`);
      setPrompt('');
      
      if (onApiRequestGenerated) {
        onApiRequestGenerated(result.apiRequest);
      }
    } else {
      setError(result.message || 'Failed to generate API request');
    }
  };

  const handleGenerateApiRequest = async () => {
    if (!prompt.trim()) {
      setError('Please enter a description of the API request you want to create');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await makeApiRequest();
      await processApiResponse(result);
    } catch (err) {
      setError(`Network error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleGenerateApiRequest();
    }
  };

  const handleExampleClick = (example) => {
    setPrompt(example);
    setError(null);
    setSuccess(null);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {/* Error Alert */}
      {error ? (
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      ) : null}

      {/* Success Alert */}
      {success ? (
        <Alert severity="success" onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      ) : null}

      {/* Input Section */}
      <Box>
        <Typography 
          color={isDark ? '#E0E0E0' : 'text.primary'} 
          sx={{ mb: 1 }}
          variant="subtitle2"
        >
          Describe your API request:
        </Typography>
        
        <TextField
          fullWidth
          multiline
          placeholder="e.g., Send a POST request to create a new user with name Anurag and email test@test.com"
          rows={3}
          size="small"
          sx={{
            mb: 2,
            '& .MuiOutlinedInput-root': {
              backgroundColor: alpha(isDark ? '#ffffff' : '#000000', 0.05),
            }
          }}
          value={prompt}
          variant="outlined"
          onChange={(e) => setPrompt(e.target.value)}
          onKeyPress={handleKeyPress}
        />

        <Button
          fullWidth
          disabled={loading || !prompt.trim()}
          startIcon={loading ? <CircularProgress size={20} /> : <AutoAwesomeIcon />}
          sx={{
            background: 'linear-gradient(45deg, #ff9a9e 30%, #fecfef 90%)',
            color: 'white',
            '&:hover': {
              background: 'linear-gradient(45deg, #ff8a8e 30%, #fdbfdf 90%)',
            },
            '&:disabled': {
              background: alpha(isDark ? '#ffffff' : '#000000', 0.12),
              color: alpha(isDark ? '#ffffff' : '#000000', 0.26),
            }
          }}
          variant="contained"
          onClick={handleGenerateApiRequest}
        >
          {loading ? 'Generating...' : 'Generate API Request'}
        </Button>
      </Box>

      {/* Example Prompts */}
      <Box>
        <Typography 
          color={isDark ? '#E0E0E0' : 'text.primary'} 
          sx={{ mb: 1 }}
          variant="subtitle2"
        >
          Quick examples:
        </Typography>
        
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {examplePrompts.map((example) => (
            <Chip
              clickable
              key={example}
              label={example}
              size="small"
              sx={{
                justifyContent: 'flex-start',
                height: 'auto',
                py: 0.5,
                px: 1,
                '& .MuiChip-label': {
                  whiteSpace: 'normal',
                  textAlign: 'left',
                  fontSize: '0.75rem',
                  lineHeight: 1.2,
                },
                borderColor: alpha('#ff9a9e', 0.3),
                color: isDark ? '#E0E0E0' : 'text.primary',
                '&:hover': {
                  borderColor: '#ff9a9e',
                  backgroundColor: alpha('#ff9a9e', 0.08),
                }
              }}
              variant="outlined"
              onClick={() => handleExampleClick(example)}
            />
          ))}
        </Box>
      </Box>
    </Box>
  );
};

export default NaturalLanguageApiGenerator;
