import React from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  FormControlLabel,
  Switch,
  TextField,
  Typography,
} from '@mui/material';

const ApiSettings = () => {
  return (
    <Box>
      <Typography gutterBottom component='h2' variant='h6'>
        API Configuration
      </Typography>

      <Alert severity='info' sx={{ mb: 3 }}>
        API keys are stored in your home directory configuration file. Changes
        here will update your local settings.
      </Alert>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography gutterBottom variant='subtitle1'>
            AI Provider Settings
          </Typography>

          <Box sx={{ mb: 2 }}>
            <TextField
              fullWidth
              select
              defaultValue='openai'
              label='Default AI Provider'
              SelectProps={{ native: true }}
              size='small'
            >
              <option value='openai'>OpenAI</option>
              <option value='anthropic'>Anthropic Claude</option>
              <option value='google'>Google Gemini</option>
              <option value='ollama'>Ollama (Local)</option>
            </TextField>
          </Box>

          <TextField
            fullWidth
            defaultValue={60}
            label='Request Timeout (seconds)'
            size='small'
            sx={{ mb: 2 }}
            type='number'
          />

          <Divider sx={{ my: 2 }} />

          <Typography gutterBottom variant='subtitle1'>
            Template Processing
          </Typography>

          <FormControlLabel
            control={<Switch defaultChecked />}
            label='Enable template validation'
          />
          <FormControlLabel
            control={<Switch defaultChecked />}
            label='Auto-detect template variables'
          />
          <FormControlLabel
            control={<Switch />}
            label='Enable template caching'
          />

          <Divider sx={{ my: 2 }} />

          <Typography gutterBottom variant='subtitle1'>
            Advanced Settings
          </Typography>

          <TextField
            fullWidth
            defaultValue={10000}
            label='Max Template Length'
            size='small'
            sx={{ mb: 2 }}
            type='number'
          />

          <TextField
            fullWidth
            defaultValue={30}
            label='Template Backup Retention (days)'
            size='small'
            type='number'
          />
        </CardContent>
      </Card>

      <Button color='primary' variant='contained'>
        Save API Settings
      </Button>
    </Box>
  );
};

export default ApiSettings;
