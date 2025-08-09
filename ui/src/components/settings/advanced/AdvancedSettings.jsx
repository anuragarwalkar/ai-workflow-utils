import React from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  FormControlLabel,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import {
  BugReport as DebugIcon,
  Delete as DeleteIcon,
  CloudDownload as ImportIcon,
  Refresh as RefreshIcon,
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
      <Typography gutterBottom component='h2' variant='h6'>
        Advanced Settings
      </Typography>

      <Alert severity='warning' sx={{ mb: 3 }}>
        These settings are for advanced users. Changing these settings may
        affect application performance or data integrity.
      </Alert>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography gutterBottom variant='subtitle1'>
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
            select
            defaultValue='info'
            label='Log Level'
            SelectProps={{ native: true }}
            size='small'
            sx={{ mt: 2 }}
          >
            <option value='error'>Error</option>
            <option value='warn'>Warning</option>
            <option value='info'>Info</option>
            <option value='debug'>Debug</option>
          </TextField>

          <Divider sx={{ my: 2 }} />

          <Typography gutterBottom variant='subtitle1'>
            Data Management
          </Typography>

          <Stack direction='row' spacing={2} sx={{ mb: 2 }}>
            <Button
              startIcon={<ImportIcon />}
              variant='outlined'
              onClick={handleImportData}
            >
              Import Data
            </Button>
            <Button
              startIcon={<ImportIcon />}
              variant='outlined'
              onClick={handleExportData}
            >
              Export All Data
            </Button>
          </Stack>

          <Button
            startIcon={<RefreshIcon />}
            sx={{ mb: 2 }}
            variant='outlined'
            onClick={handleClearCache}
          >
            Clear Cache
          </Button>

          <Divider sx={{ my: 2 }} />

          <Typography gutterBottom variant='subtitle1'>
            Performance
          </Typography>

          <TextField
            fullWidth
            defaultValue={50}
            label='Template Cache Size (MB)'
            size='small'
            sx={{ mb: 2 }}
            type='number'
          />

          <TextField
            fullWidth
            defaultValue={30000}
            label='API Request Timeout (ms)'
            size='small'
            sx={{ mb: 2 }}
            type='number'
          />

          <FormControlLabel
            control={<Switch defaultChecked />}
            label='Enable request caching'
          />

          <Divider sx={{ my: 2 }} />

          <Typography gutterBottom color='error' variant='subtitle1'>
            Danger Zone
          </Typography>

          <Alert severity='error' sx={{ mb: 2 }}>
            These actions are irreversible. Please make sure you have backups
            before proceeding.
          </Alert>

          <Button
            color='error'
            startIcon={<DeleteIcon />}
            variant='outlined'
            onClick={handleResetAll}
          >
            Reset All Settings & Data
          </Button>
        </CardContent>
      </Card>
      <Button color='primary' variant='contained'>
        Save Advanced Settings
      </Button>
    </Box>
  );
};

export default AdvancedSettings;
