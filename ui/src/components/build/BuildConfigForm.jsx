import React from 'react';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  FormControlLabel,
  FormGroup,
  Grid,
  Paper,
  TextField,
  Typography,
} from '@mui/material';

const BuildConfigForm = ({ config, onChange, onNext, onSaveConfig }) => {
  const handleTicketNumberChange = event => {
    onChange({
      ...config,
      ticketNumber: event.target.value,
    });
  };

  const handleRepoKeyChange = event => {
    onChange({
      ...config,
      repoKey: event.target.value,
    });
  };

  const handleRepoSlugChange = event => {
    onChange({
      ...config,
      repoSlug: event.target.value,
    });
  };

  const handleGitReposChange = event => {
    const gitReposValue = event.target.value;
    const availablePackages = gitReposValue.trim()
      ? gitReposValue
          .split(',')
          .map(repo => repo.trim())
          .filter(repo => repo)
      : [];

    onChange({
      ...config,
      gitRepos: gitReposValue,
      availablePackages,
      selectedPackages: config.selectedPackages.filter(pkg =>
        availablePackages.includes(pkg)
      ),
    });
  };

  const handlePackageToggle = packageName => {
    const isSelected = config.selectedPackages.includes(packageName);
    const newSelectedPackages = isSelected
      ? config.selectedPackages.filter(pkg => pkg !== packageName)
      : [...config.selectedPackages, packageName];

    onChange({
      ...config,
      selectedPackages: newSelectedPackages,
    });
  };

  const handleSelectAllPackages = () => {
    const allSelected =
      config.selectedPackages.length === config.availablePackages.length;
    onChange({
      ...config,
      selectedPackages: allSelected ? [] : [...config.availablePackages],
    });
  };

  const handlePullRequestToggle = event => {
    onChange({
      ...config,
      createPullRequest: event.target.checked,
    });
  };

  const isFormValid = () => {
    return (
      config.ticketNumber.trim() !== '' &&
      config.repoKey.trim() !== '' &&
      config.repoSlug.trim() !== '' &&
      config.gitRepos.trim() !== ''
    );
  };

  const getPackageDisplayName = packageName => {
    // Extract the last part after the last hyphen for display
    const parts = packageName.split('-');
    return parts[parts.length - 1];
  };

  return (
    <Box>
      <Typography gutterBottom variant='h6'>
        Configure Build Parameters
      </Typography>

      <Grid container spacing={3}>
        {/* Repository Configuration */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography gutterBottom variant='subtitle1'>
              Repository Configuration
            </Typography>
            <Grid container spacing={2}>
              <Grid item sm={6} xs={12}>
                <TextField
                  fullWidth
                  required
                  helperText='Enter the repository key for PR creation'
                  label='Repository Key'
                  placeholder='e.g., your-repo-key'
                  value={config.repoKey || ''}
                  onChange={handleRepoKeyChange}
                />
              </Grid>
              <Grid item sm={6} xs={12}>
                <TextField
                  fullWidth
                  required
                  helperText='Enter the repository slug for PR creation'
                  label='Repository Slug'
                  placeholder='e.g., your-repo-slug'
                  value={config.repoSlug || ''}
                  onChange={handleRepoSlugChange}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  required
                  helperText='Enter comma-separated list of git repositories'
                  label='Git Repositories'
                  placeholder='e.g., example-1,example-2,example-3'
                  value={config.gitRepos || ''}
                  onChange={handleGitReposChange}
                />
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Ticket Number */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography gutterBottom variant='subtitle1'>
              Ticket Information
            </Typography>
            <TextField
              fullWidth
              required
              helperText='Enter the Jira ticket number for this release'
              label='Ticket Number'
              placeholder='e.g., 12345'
              value={config.ticketNumber}
              onChange={handleTicketNumberChange}
            />
          </Paper>
        </Grid>

        {/* Package Selection */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 2,
              }}
            >
              <Typography variant='subtitle1'>Package Selection</Typography>
              {config.availablePackages &&
              config.availablePackages.length > 0 ? (
                <Button
                  size='small'
                  variant='outlined'
                  onClick={handleSelectAllPackages}
                >
                  {config.selectedPackages.length ===
                  config.availablePackages.length
                    ? 'Deselect All'
                    : 'Select All'}
                </Button>
              ) : null}
            </Box>

            <Typography color='text.secondary' sx={{ mb: 2 }} variant='body2'>
              Select which packages to update to their latest versions:
            </Typography>

            {config.availablePackages && config.availablePackages.length > 0 ? (
              <FormGroup>
                {config.availablePackages.map(packageName => (
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={config.selectedPackages.includes(packageName)}
                        onChange={() => handlePackageToggle(packageName)}
                      />
                    }
                    key={packageName}
                    label={
                      <Box
                        sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                      >
                        <Typography variant='body2'>{packageName}</Typography>
                        <Chip
                          color='primary'
                          label={getPackageDisplayName(packageName)}
                          size='small'
                          variant='outlined'
                        />
                      </Box>
                    }
                  />
                ))}
              </FormGroup>
            ) : (
              <Alert severity='info' sx={{ mt: 2 }}>
                Please enter git repositories above to see available packages
                for selection
              </Alert>
            )}

            {config.selectedPackages.length > 0 && (
              <Alert severity='info' sx={{ mt: 2 }}>
                {config.selectedPackages.length} package(s) selected for update
              </Alert>
            )}
          </Paper>
        </Grid>

        {/* Pull Request Options */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography gutterBottom variant='subtitle1'>
              Git Options
            </Typography>
            <FormControlLabel
              control={(
                <Checkbox
                  checked={config.createPullRequest}
                  onChange={handlePullRequestToggle}
                />
              )}
              label='Create Pull Request automatically'
            />
            <Typography color='text.secondary' sx={{ ml: 4 }} variant='body2'>
              If enabled, a pull request will be created automatically after the
              build completes
            </Typography>
          </Paper>
        </Grid>

        {/* Action Buttons */}
        <Grid item xs={12}>
          <Box
            sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}
          >
            <Button
              href='#'
              variant='outlined'
              onClick={e => {
                e.preventDefault();
                window.history.back();
              }}
            >
              Cancel
            </Button>
            <Button
              disabled={!isFormValid()}
              variant='contained'
              onClick={() => {
                // Save repository configuration before proceeding
                if (onSaveConfig) {
                  onSaveConfig({
                    repoKey: config.repoKey,
                    repoSlug: config.repoSlug,
                    gitRepos: config.gitRepos,
                  });
                }
                onNext();
              }}
            >
              Next: Review Configuration
            </Button>
          </Box>
        </Grid>
      </Grid>

      {!isFormValid() && (
        <Alert severity='warning' sx={{ mt: 2 }}>
          Please fill in all required fields: Repository Key, Repository Slug,
          Git Repositories, and Ticket Number
        </Alert>
      )}
    </Box>
  );
};

export default BuildConfigForm;
