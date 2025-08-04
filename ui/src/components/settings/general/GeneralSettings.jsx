import React from 'react'
import {
  Box,
  Typography,
  Card,
  CardContent,
  FormControlLabel,
  Switch,
  TextField,
  MenuItem,
  Divider,
  Button,
  Chip
} from '@mui/material'
import { useAppTheme } from '../../../theme/useAppTheme'

const GeneralSettings = () => {
  const { themeMode, setThemeMode, effectiveThemeMode } = useAppTheme()

  const handleThemeChange = (event) => {
    setThemeMode(event.target.value)
  }

  return (
    <Box>
      <Typography variant="h6" component="h2" gutterBottom>
        General Settings
      </Typography>
      
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="subtitle1" gutterBottom>
            Appearance
          </Typography>
          <Box sx={{ mb: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              select
              label="Theme"
              value={themeMode}
              onChange={handleThemeChange}
              size="small"
              sx={{ minWidth: 200 }}
            >
              <MenuItem value="light">Light</MenuItem>
              <MenuItem value="dark">Dark</MenuItem>
              <MenuItem value="auto">Auto (System)</MenuItem>
            </TextField>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Current theme:
              </Typography>
              <Chip 
                label={effectiveThemeMode === 'dark' ? 'Dark' : 'Light'} 
                size="small" 
                color={effectiveThemeMode === 'dark' ? 'secondary' : 'primary'}
              />
              {themeMode === 'auto' && (
                <Chip label="Auto" size="small" variant="outlined" />
              )}
            </Box>
          </Box>
          
          <Divider sx={{ my: 2 }} />
          
          <Typography variant="subtitle1" gutterBottom>
            Notifications
          </Typography>
          <FormControlLabel
            control={<Switch defaultChecked />}
            label="Enable notifications"
            disabled
          />
          <FormControlLabel
            control={<Switch defaultChecked />}
            label="Show success messages"
            disabled
          />
          <FormControlLabel
            control={<Switch />}
            label="Show debug information"
            disabled
          />
          
          <Divider sx={{ my: 2 }} />
          
          <Typography variant="subtitle1" gutterBottom>
            Auto-save
          </Typography>
          <FormControlLabel
            control={<Switch defaultChecked />}
            label="Auto-save form data"
            disabled
          />
          <TextField
            label="Auto-save interval (seconds)"
            type="number"
            defaultValue={30}
            size="small"
            sx={{ ml: 2, width: 200 }}
          />
        </CardContent>
      </Card>
      
      <Button variant="contained" color="primary">
        Save Settings
      </Button>
    </Box>
  )
}

export default GeneralSettings
