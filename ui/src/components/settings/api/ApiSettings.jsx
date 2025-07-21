import React from 'react'
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Alert,
  Divider,
  FormControlLabel,
  Switch
} from '@mui/material'

const ApiSettings = () => {
  return (
    <Box>
      <Typography variant="h6" component="h2" gutterBottom>
        API Configuration
      </Typography>
      
      <Alert severity="info" sx={{ mb: 3 }}>
        API keys are stored in your home directory configuration file. Changes here will update your local settings.
      </Alert>
      
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="subtitle1" gutterBottom>
            AI Provider Settings
          </Typography>
          
          <Box sx={{ mb: 2 }}>
            <TextField
              fullWidth
              label="Default AI Provider"
              select
              defaultValue="openai"
              size="small"
              SelectProps={{ native: true }}
            >
              <option value="openai">OpenAI</option>
              <option value="anthropic">Anthropic Claude</option>
              <option value="google">Google Gemini</option>
              <option value="ollama">Ollama (Local)</option>
            </TextField>
          </Box>
          
          <TextField
            fullWidth
            label="Request Timeout (seconds)"
            type="number"
            defaultValue={60}
            size="small"
            sx={{ mb: 2 }}
          />
          
          <Divider sx={{ my: 2 }} />
          
          <Typography variant="subtitle1" gutterBottom>
            Template Processing
          </Typography>
          
          <FormControlLabel
            control={<Switch defaultChecked />}
            label="Enable template validation"
          />
          <FormControlLabel
            control={<Switch defaultChecked />}
            label="Auto-detect template variables"
          />
          <FormControlLabel
            control={<Switch />}
            label="Enable template caching"
          />
          
          <Divider sx={{ my: 2 }} />
          
          <Typography variant="subtitle1" gutterBottom>
            Advanced Settings
          </Typography>
          
          <TextField
            fullWidth
            label="Max Template Length"
            type="number"
            defaultValue={10000}
            size="small"
            sx={{ mb: 2 }}
          />
          
          <TextField
            fullWidth
            label="Template Backup Retention (days)"
            type="number"
            defaultValue={30}
            size="small"
          />
        </CardContent>
      </Card>
      
      <Button variant="contained" color="primary">
        Save API Settings
      </Button>
    </Box>
  )
}

export default ApiSettings
