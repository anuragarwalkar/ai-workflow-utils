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
  Button
} from '@mui/material'

const GeneralSettings = () => {
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
          <Box sx={{ mb: 2 }}>
            <TextField
              select
              label="Theme"
              defaultValue="light"
              size="small"
              sx={{ minWidth: 200 }}
            >
              <MenuItem value="light">Light</MenuItem>
              <MenuItem value="dark">Dark</MenuItem>
              <MenuItem value="auto">Auto</MenuItem>
            </TextField>
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
