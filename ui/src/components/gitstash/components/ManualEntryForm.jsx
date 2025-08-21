import React from 'react';
import { Box, Button, Grid, TextField } from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';

/**
 * Pure component for manual form entry
 */
const ManualEntryForm = ({
  formData,
  isLoading,
  onInputChange,
  onSubmit,
}) => (
  <Grid container spacing={3}>
    <Grid item xs={12}>
      <TextField
        fullWidth
        required
        disabled={isLoading}
        helperText="The project key from your GitStash URL"
        label="Project Key"
        placeholder="e.g., PROJ"
        value={formData.projectKey}
        onChange={onInputChange('projectKey')}
      />
    </Grid>

    <Grid item xs={12}>
      <TextField
        fullWidth
        required
        disabled={isLoading}
        helperText="The repository slug from your GitStash URL"
        label="Repository Slug"
        placeholder="e.g., my-repository"
        value={formData.repoSlug}
        onChange={onInputChange('repoSlug')}
      />
    </Grid>

    <Grid item xs={12}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          mt: 2,
        }}
      >
        <Button
          disabled={
            isLoading || !formData.projectKey.trim() || !formData.repoSlug.trim()
          }
          size="large"
          startIcon={<SearchIcon />}
          sx={{
            minWidth: 200,
            background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
            '&:hover': {
              background: 'linear-gradient(135deg, #0d7377 0%, #2dd4bf 100%)',
            },
          }}
          type="submit"
          variant="contained"
          onClick={onSubmit}
        >
          {isLoading ? 'Loading...' : 'Fetch Pull Requests'}
        </Button>
      </Box>
    </Grid>
  </Grid>
);

export default ManualEntryForm;
