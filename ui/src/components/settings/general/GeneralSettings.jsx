import React from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  FormControlLabel,
  MenuItem,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import { useAppTheme } from '../../../theme/useAppTheme';

const GeneralSettings = () => {
  const { themeMode, setThemeMode, effectiveThemeMode } = useAppTheme();

  const handleThemeChange = event => {
    setThemeMode(event.target.value);
  };

  return (
    <Box>
      <Typography gutterBottom component='h2' variant='h6'>
        General Settings
      </Typography>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography gutterBottom variant='subtitle1'>
            Appearance
          </Typography>
          <Box sx={{ mb: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              select
              label='Theme'
              size='small'
              sx={{ minWidth: 200 }}
              value={themeMode}
              onChange={handleThemeChange}
            >
              <MenuItem value='light'>Light</MenuItem>
              <MenuItem value='dark'>Dark</MenuItem>
              <MenuItem value='auto'>Auto (System)</MenuItem>
            </TextField>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography color='text.secondary' variant='body2'>
                Current theme:
              </Typography>
              <Chip
                color={effectiveThemeMode === 'dark' ? 'secondary' : 'primary'}
                label={effectiveThemeMode === 'dark' ? 'Dark' : 'Light'}
                size='small'
              />
              {themeMode === 'auto' && <Chip label='Auto' size='small' variant='outlined' />}
            </Box>
          </Box>

          <Divider sx={{ my: 2 }} />

          <Typography gutterBottom variant='subtitle1'>
            Notifications
          </Typography>
          <FormControlLabel
            disabled
            control={<Switch defaultChecked />}
            label='Enable notifications'
          />
          <FormControlLabel
            disabled
            control={<Switch defaultChecked />}
            label='Show success messages'
          />
          <FormControlLabel disabled control={<Switch />} label='Show debug information' />

          <Divider sx={{ my: 2 }} />

          <Typography gutterBottom variant='subtitle1'>
            Auto-save
          </Typography>
          <FormControlLabel
            disabled
            control={<Switch defaultChecked />}
            label='Auto-save form data'
          />
          <TextField
            defaultValue={30}
            label='Auto-save interval (seconds)'
            size='small'
            sx={{ ml: 2, width: 200 }}
            type='number'
          />
        </CardContent>
      </Card>

      <Button color='primary' variant='contained'>
        Save Settings
      </Button>
    </Box>
  );
};

export default GeneralSettings;
