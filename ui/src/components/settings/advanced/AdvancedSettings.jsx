import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Alert,
  Divider,
  FormControlLabel,
  Switch,
  TextField,
  Stack,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  CloudDownload as ImportIcon,
  Refresh as RefreshIcon,
  BugReport as DebugIcon,
} from '@mui/icons-material';
import LogsViewer from './LogsViewer';

const AdvancedSettings = () => {
  const handleClearCache = () => {
    if (window.confirm('Are you sure you want to clear all cached data?')) {
      // Implementation for clearing cache
      console.log('Clearing cache...');
    }
  };

  const handleExportData = () => {
    // Implementation for exporting all data
    console.log('Exporting data...');
  };

  const handleImportData = () => {
    // Implementation for importing data
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = e => {
      const file = e.target.files[0];
      if (file) {
        console.log('Importing data from:', file.name);
      }
    };
    input.click();
  };

  const handleResetAll = () => {
    if (
      window.confirm(
        'Are you sure you want to reset ALL settings and data? This action cannot be undone.'
      )
    ) {
      // Implementation for resetting everything
      console.log('Resetting all data...');
    }
  };

  return (
    <Box>
      <Typography variant='h6' component='h2' gutterBottom>
        Advanced Settings
      </Typography>

      <Alert severity='warning' sx={{ mb: 3 }}>
        These settings are for advanced users. Changing these settings may
        affect application performance or data integrity.
      </Alert>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant='subtitle1' gutterBottom>
            Debug & Development
          </Typography>

          <FormControlLabel control={<Switch />} label='Enable debug mode' />
          <FormControlLabel
            control={<Switch />}
            label='Show API request logs'
          />
          <FormControlLabel
            control={<Switch />}
            label='Enable verbose logging'
          />

          <TextField
            fullWidth
            label='Log Level'
            select
            defaultValue='info'
            size='small'
            sx={{ mt: 2 }}
            SelectProps={{ native: true }}
          >
            <option value='error'>Error</option>
            <option value='warn'>Warning</option>
            <option value='info'>Info</option>
            <option value='debug'>Debug</option>
          </TextField>

          <Divider sx={{ my: 2 }} />

          <Typography variant='subtitle1' gutterBottom>
            Data Management
          </Typography>

          <Stack direction='row' spacing={2} sx={{ mb: 2 }}>
            <Button
              variant='outlined'
              startIcon={<ImportIcon />}
              onClick={handleImportData}
            >
              Import Data
            </Button>
            <Button
              variant='outlined'
              startIcon={<ImportIcon />}
              onClick={handleExportData}
            >
              Export All Data
            </Button>
          </Stack>

          <Button
            variant='outlined'
            startIcon={<RefreshIcon />}
            onClick={handleClearCache}
            sx={{ mb: 2 }}
          >
            Clear Cache
          </Button>

          <Divider sx={{ my: 2 }} />

          <Typography variant='subtitle1' gutterBottom>
            Performance
          </Typography>

          <TextField
            fullWidth
            label='Template Cache Size (MB)'
            type='number'
            defaultValue={50}
            size='small'
            sx={{ mb: 2 }}
          />

          <TextField
            fullWidth
            label='API Request Timeout (ms)'
            type='number'
            defaultValue={30000}
            size='small'
            sx={{ mb: 2 }}
          />

          <FormControlLabel
            control={<Switch defaultChecked />}
            label='Enable request caching'
          />

          <Divider sx={{ my: 2 }} />

          <Typography variant='subtitle1' gutterBottom color='error'>
            Danger Zone
          </Typography>

          <Alert severity='error' sx={{ mb: 2 }}>
            These actions are irreversible. Please make sure you have backups
            before proceeding.
          </Alert>

          <Button
            variant='outlined'
            color='error'
            startIcon={<DeleteIcon />}
            onClick={handleResetAll}
          >
            Reset All Settings & Data
          </Button>
        </CardContent>
      </Card>
      <Button variant='contained' color='primary'>
        Save Advanced Settings
      </Button>
    </Box>
  );
};

export default AdvancedSettings;
