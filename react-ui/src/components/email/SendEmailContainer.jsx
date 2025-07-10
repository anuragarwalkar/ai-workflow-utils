import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  FormControlLabel,
  Switch,
  Alert,
  CircularProgress,
  Divider,
} from '@mui/material';
import { useDispatch } from 'react-redux';
import { useSendEmailMutation } from '../../store/api/emailApi';
import { setCurrentView } from '../../store/slices/appSlice';
import { setEmailData, setLastSentVersion } from '../../store/slices/emailSlice';

const SendEmailContainer = () => {
  const dispatch = useDispatch();
  const [sendEmail, { isLoading, error }] = useSendEmailMutation();
  
  const [version, setVersion] = useState('2.0.9');
  const [dryRun, setDryRun] = useState(true);
  const [emailPreview, setEmailPreview] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleBackToHome = () => {
    dispatch(setCurrentView('home'));
    setEmailPreview(null);
    setSuccess(false);
  };

  const handleSendEmail = async () => {
    try {
      setSuccess(false);
      const result = await sendEmail({ version, dryRun }).unwrap();
      
      setEmailPreview(result);
      dispatch(setEmailData(result));
      
      if (!dryRun) {
        dispatch(setLastSentVersion(version));
        setSuccess(true);
      }
    } catch (err) {
      console.error('Failed to send email:', err);
    }
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Send Email
          </Typography>
          <Button
            variant="outlined"
            onClick={handleBackToHome}
            sx={{ minWidth: 120 }}
          >
            Back to Home
          </Button>
        </Box>

        <Box sx={{ mb: 4 }}>
          <TextField
            fullWidth
            label="Version"
            value={version}
            onChange={(e) => setVersion(e.target.value)}
            placeholder="e.g., 2.0.9"
            sx={{ mb: 3 }}
            helperText="Enter the version number for the release notes"
          />

          <FormControlLabel
            control={
              <Switch
                checked={dryRun}
                onChange={(e) => setDryRun(e.target.checked)}
                color="primary"
              />
            }
            label={dryRun ? "Dry Run (Preview Only)" : "Send Actual Email"}
            sx={{ mb: 3 }}
          />

          <Button
            variant="contained"
            size="large"
            onClick={handleSendEmail}
            disabled={isLoading || !version.trim()}
            sx={{ minWidth: 200 }}
          >
            {isLoading ? (
              <>
                <CircularProgress size={20} sx={{ mr: 1 }} />
                {dryRun ? 'Generating Preview...' : 'Sending Email...'}
              </>
            ) : (
              dryRun ? 'Generate Preview' : 'Send Email'
            )}
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            Error: {error.data?.message || error.message || 'Failed to process email request'}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 3 }}>
            Email sent successfully for version {version}!
          </Alert>
        )}

        {emailPreview && (
          <Box sx={{ mt: 4 }}>
            <Divider sx={{ mb: 3 }} />
            <Typography variant="h6" gutterBottom>
              {dryRun ? 'Email Preview' : 'Email Content'}
            </Typography>
            <Paper 
              variant="outlined" 
              sx={{ 
                p: 0, 
                height: 500,
                overflow: 'hidden',
                backgroundColor: '#ffffff'
              }}
            >
              <iframe
                srcDoc={emailPreview}
                style={{
                  width: '100%',
                  height: '100%',
                  border: 'none',
                  backgroundColor: 'white'
                }}
                title="Email Preview"
              />
            </Paper>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default SendEmailContainer;
