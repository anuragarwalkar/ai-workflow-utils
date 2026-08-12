import React from 'react';
import { Alert, Box, Button, Typography } from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { useGitStashNavigation } from '../../hooks/useGitStashNavigation';

const GitStashHeader = ({ error }) => {
  const { handleBack } = useGitStashNavigation();

  return (
    <Box sx={{ mb: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, position: 'relative', justifyContent: 'center' }}>
        <Box sx={{ position: 'absolute', left: 0 }}>
          <Button startIcon={<ArrowBackIcon />} onClick={handleBack}>
            Back to Home
          </Button>
        </Box>
        <Typography component='h1' sx={{ fontWeight: 600, m: 0 }} variant='h5'>
          GitStash PR Review
        </Typography>
      </Box>

      {error ? (
        <Alert severity='error' sx={{ mb: 3 }}>
          {error}
        </Alert>
      ) : null}
    </Box>
  );
};

export default GitStashHeader;
