import React from 'react';
import {
  Box,
  Typography,
  TextField,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Button,
  Paper,
  Grid,
  Chip,
  Alert,
} from '@mui/material';

// Available packages from the shell script
const AVAILABLE_PACKAGES = [
 // here
];

// Add list of pacages

const BuildConfigForm = ({ config, onChange, onNext }) => {
  const handleTicketNumberChange = (event) => {
    onChange({
      ...config,
      ticketNumber: event.target.value,
    });
  };

  const handlePackageToggle = (packageName) => {
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
    const allSelected = config.selectedPackages.length === AVAILABLE_PACKAGES.length;
    onChange({
      ...config,
      selectedPackages: allSelected ? [] : [...AVAILABLE_PACKAGES],
    });
  };

  const handlePullRequestToggle = (event) => {
    onChange({
      ...config,
      createPullRequest: event.target.checked,
    });
  };

  const isFormValid = () => {
    return config.ticketNumber.trim() !== '';
  };

  const getPackageDisplayName = (packageName) => {
    // Extract the last part after the last hyphen for display
    const parts = packageName.split('-');
    return parts[parts.length - 1];
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Configure Build Parameters
      </Typography>
      
      <Grid container spacing={3}>
        {/* Ticket Number */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              Ticket Information
            </Typography>
            <TextField
              fullWidth
              label="Ticket Number"
              placeholder="e.g., 12345"
              value={config.ticketNumber}
              onChange={handleTicketNumberChange}
              helperText="Enter the CUDI ticket number for this release"
              required
            />
          </Paper>
        </Grid>

        {/* Package Selection */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="subtitle1">
                Package Selection
              </Typography>
              <Button
                size="small"
                onClick={handleSelectAllPackages}
                variant="outlined"
              >
                {config.selectedPackages.length === AVAILABLE_PACKAGES.length ? 'Deselect All' : 'Select All'}
              </Button>
            </Box>
            
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Select which packages to update to their latest versions:
            </Typography>

            <FormGroup>
              {AVAILABLE_PACKAGES.map((packageName) => (
                <FormControlLabel
                  key={packageName}
                  control={
                    <Checkbox
                      checked={config.selectedPackages.includes(packageName)}
                      onChange={() => handlePackageToggle(packageName)}
                    />
                  }
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2">
                        {packageName}
                      </Typography>
                      <Chip
                        label={getPackageDisplayName(packageName)}
                        size="small"
                        variant="outlined"
                        color="primary"
                      />
                    </Box>
                  }
                />
              ))}
            </FormGroup>

            {config.selectedPackages.length > 0 && (
              <Alert severity="info" sx={{ mt: 2 }}>
                {config.selectedPackages.length} package(s) selected for update
              </Alert>
            )}
          </Paper>
        </Grid>

        {/* Pull Request Options */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              Git Options
            </Typography>
            <FormControlLabel
              control={
                <Checkbox
                  checked={config.createPullRequest}
                  onChange={handlePullRequestToggle}
                />
              }
              label="Create Pull Request automatically"
            />
            <Typography variant="body2" color="text.secondary" sx={{ ml: 4 }}>
              If enabled, a pull request will be created automatically after the build completes
            </Typography>
          </Paper>
        </Grid>

        {/* Action Buttons */}
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Button variant="outlined" href="#" onClick={(e) => { e.preventDefault(); window.history.back(); }}>
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={onNext}
              disabled={!isFormValid()}
            >
              Next: Review Configuration
            </Button>
          </Box>
        </Grid>
      </Grid>

      {!isFormValid() && (
        <Alert severity="warning" sx={{ mt: 2 }}>
          Please enter a ticket number to continue
        </Alert>
      )}
    </Box>
  );
};

export default BuildConfigForm;
