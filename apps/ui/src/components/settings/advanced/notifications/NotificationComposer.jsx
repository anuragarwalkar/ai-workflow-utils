import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  TextField,
  Typography,
} from '@mui/material';
import { Send as SendIcon } from '@mui/icons-material';

const NotificationComposer = ({ onSendNotification }) => {
  const [customTitle, setCustomTitle] = useState('AI Workflow Notification');
  const [customSeverity, setCustomSeverity] = useState('success');
  const [notificationTarget, setNotificationTarget] = useState('both');
  const [customMessage, setCustomMessage] = useState(
    'This is a test notification from AI Workflow Utils!'
  );

  const handleSubmit = e => {
    if (e) e.preventDefault();
    onSendNotification({
      message: customMessage,
      severity: customSeverity,
      target: notificationTarget,
      title: customTitle,
    });
  };

  return (
    <Paper sx={{ borderRadius: 2, p: 3 }} variant='outlined'>
      <Typography sx={{ fontWeight: 600, mb: 2.5 }} variant='subtitle2'>
        Custom Notification Composer
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
          <TextField
            helperText='Used for browser desktop notifications'
            label='Notification Title'
            size='medium'
            sx={{ flex: '1 1 240px' }}
            value={customTitle}
            onChange={e => setCustomTitle(e.target.value)}
          />

          <FormControl size='medium' sx={{ flex: '1 1 150px' }}>
            <InputLabel id='test-severity-label'>Toast Severity</InputLabel>
            <Select
              id='test-severity'
              label='Toast Severity'
              labelId='test-severity-label'
              value={customSeverity}
              onChange={e => setCustomSeverity(e.target.value)}
            >
              <MenuItem value='success'>Success</MenuItem>
              <MenuItem value='info'>Info</MenuItem>
              <MenuItem value='warning'>Warning</MenuItem>
              <MenuItem value='error'>Error</MenuItem>
            </Select>
          </FormControl>

          <FormControl size='medium' sx={{ flex: '1 1 170px' }}>
            <InputLabel id='test-target-label'>Target Destination</InputLabel>
            <Select
              id='test-target'
              label='Target Destination'
              labelId='test-target-label'
              value={notificationTarget}
              onChange={e => setNotificationTarget(e.target.value)}
            >
              <MenuItem value='both'>In-App &amp; Desktop</MenuItem>
              <MenuItem value='toast'>In-App Toast Only</MenuItem>
              <MenuItem value='browser'>Browser Desktop Only</MenuItem>
            </Select>
          </FormControl>
        </Box>

        <TextField
          fullWidth
          multiline
          label='Notification Message'
          rows={3}
          value={customMessage}
          onChange={e => setCustomMessage(e.target.value)}
        />

        <Box sx={{ pt: 0.5 }}>
          <Button
            color='primary'
            size='large'
            startIcon={<SendIcon />}
            sx={{ px: 3, py: 1 }}
            variant='contained'
            onClick={handleSubmit}
          >
            Trigger Test Notification
          </Button>
        </Box>
      </Box>
    </Paper>
  );
};

NotificationComposer.propTypes = {
  onSendNotification: PropTypes.func.isRequired,
};

export default NotificationComposer;
