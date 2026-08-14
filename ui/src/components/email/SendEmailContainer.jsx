import React, { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Divider,
  FormControlLabel,
  Grid,
  Paper,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import { Download } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useSendEmailMutation } from '../../store/api/emailApi';
import { setEmailData, setLastSentVersion } from '../../store/slices/emailSlice';
import { API_BASE_URL } from '../../config/environment.js';

const SendEmailContainer = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [sendEmail, { isLoading, error }] = useSendEmailMutation();

  const [version, setVersion] = useState('');
  const [dryRun, setDryRun] = useState(true);
  const [emailPreview, setEmailPreview] = useState(null);
  const [success, setSuccess] = useState(false);
  const [toEmail, setToEmail] = useState('');
  const [ccEmail, setCcEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [wikiUrl, setWikiUrl] = useState('');
  const [wikiBasicAuth, setWikiBasicAuth] = useState('');

  // Load email values from API on component mount
  useEffect(() => {
    const loadLastEmailVersion = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/app-state/lastEmailVersion`);
        if (!response.ok) return;
        
        const json = await response.json();
        const lastVersionData = json.data;

        if (lastVersionData) {
          if (lastVersionData.version) {
            setVersion(lastVersionData.version);
          }
          if (lastVersionData.toEmail) {
            setToEmail(lastVersionData.toEmail);
          }
          if (lastVersionData.ccEmail) {
            setCcEmail(lastVersionData.ccEmail);
          }
          if (lastVersionData.subject) {
            setSubject(lastVersionData.subject);
          }
          if (lastVersionData.wikiUrl) {
            setWikiUrl(lastVersionData.wikiUrl);
          }
          if (lastVersionData.wikiBasicAuth) {
            // Decode from base64 when retrieving from API
            try {
              setWikiBasicAuth(atob(lastVersionData.wikiBasicAuth));
            } catch (decodeError) {
              console.error('Error decoding wikiBasicAuth from API:', decodeError);
              // If decoding fails, treat as plain text (for backward compatibility)
              setWikiBasicAuth(lastVersionData.wikiBasicAuth);
            }
          }
        }
      } catch (error) {
        console.error('Error parsing last email version data:', error);
      }
    };
    
    loadLastEmailVersion();
  }, []);

  const saveEmailDataToApi = async () => {
    const emailVersionData = {
      version,
      timestamp: new Date().toISOString(),
      toEmail,
      ccEmail,
      subject,
      wikiUrl,
      // Store wikiBasicAuth as base64 encoded
      wikiBasicAuth: wikiBasicAuth ? btoa(wikiBasicAuth) : '',
      dryRun,
    };
    try {
      await fetch(`${API_BASE_URL}/api/app-state/lastEmailVersion`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(emailVersionData),
      });
    } catch (error) {
      console.error('Error saving email data to API:', error);
    }
  };

  const handleBackToHome = () => {
    navigate('/');
    setEmailPreview(null);
    setSuccess(false);
  };

  const handleSendEmail = async () => {
    try {
      setSuccess(false);

      // Prepare the request data
      const requestData = {
        version,
        dryRun,
        wikiUrl,
        // wikiBasicAuth is already encoded when sent to server
        wikiBasicAuth: wikiBasicAuth ? btoa(wikiBasicAuth) : '',
      };

      const result = await sendEmail(requestData).unwrap();

      setEmailPreview(result);
      dispatch(setEmailData(result));

      // Save last version to API when preview is successfully generated
      await saveEmailDataToApi();

      if (!dryRun) {
        dispatch(setLastSentVersion(version));
        setSuccess(true);
      }
    } catch (err) {
      console.error('Failed to send email:', err);
    }
  };

  const handleDownloadTemplate = () => {
    if (!emailPreview) return;

    // Update API with current email data before download
    saveEmailDataToApi();

    // Create the .eml file content
    const emlContent = `To: ${toEmail}
${ccEmail ? `Cc: ${ccEmail}\n` : ''}Subject: ${subject} : ${version}
Content-Type: text/html; charset=UTF-8

${emailPreview}`;

    // Create blob and download
    const blob = new Blob([emlContent], { type: 'message/rfc822' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `email-template-v${version}.eml`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          mb: 4,
          position: 'relative',
          justifyContent: 'center',
        }}
      >
        <Box sx={{ position: 'absolute', left: 0 }}>
          <Button sx={{ minWidth: 120 }} variant='outlined' onClick={handleBackToHome}>
            Back to Home
          </Button>
        </Box>
        <Typography component='h1' sx={{ fontWeight: 600, m: 0 }} variant='h5'>
          Send Email
        </Typography>
      </Box>

      <Box sx={{ mb: 4 }}>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              helperText='Enter the version number for the release notes'
              label='Version'
              placeholder='e.g., 1.0.0'
              value={version}
              onChange={e => setVersion(e.target.value)}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              helperText='Your Atlassian Wiki URL for release notes'
              label='Wiki URL'
              placeholder='https://your-company.atlassian.net/wiki'
              value={wikiUrl}
              onChange={e => setWikiUrl(e.target.value)}
            />
          </Grid>

          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              helperText='Wiki basic authentication (username:password)'
              label='Wiki Basic Auth'
              placeholder='username:password'
              type='password'
              value={wikiBasicAuth}
              onChange={e => setWikiBasicAuth(e.target.value)}
            />
          </Grid>

          {dryRun && emailPreview ? (
            <>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  helperText='Email subject line'
                  label='Subject'
                  placeholder='Email subject'
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                />
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  helperText='Primary recipient email address'
                  label='To Email'
                  placeholder='recipient@example.com'
                  value={toEmail}
                  onChange={e => setToEmail(e.target.value)}
                />
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  helperText='Carbon copy email address'
                  label='CC Email (Optional)'
                  placeholder='cc@example.com'
                  value={ccEmail}
                  onChange={e => setCcEmail(e.target.value)}
                />
              </Grid>
            </>
          ) : null}
        </Grid>

        <FormControlLabel
          control={
            <Switch
              checked={dryRun}
              color='primary'
              onChange={e => setDryRun(e.target.checked)}
            />
          }
          label={dryRun ? 'Dry Run (Only preview and download template)' : 'Send Actual Email'}
          sx={{ mt: 3, mb: 3, display: 'block' }}
        />

        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Button
            disabled={isLoading || !version.trim() || !wikiUrl.trim() || !wikiBasicAuth.trim()}
            size='large'
            sx={{ minWidth: 200 }}
            variant='contained'
            onClick={handleSendEmail}
          >
            {isLoading ? (
              <>
                <CircularProgress size={20} sx={{ mr: 1 }} />
                {dryRun ? 'Generating Preview...' : 'Sending Email...'}
              </>
            ) : dryRun ? (
              emailPreview ? (
                'Regenerate Preview'
              ) : (
                'Generate Preview'
              )
            ) : (
              'Send Email'
            )}
          </Button>

          {dryRun && emailPreview ? (
            <Button
              size='large'
              startIcon={<Download />}
              sx={{ minWidth: 200 }}
              variant='outlined'
              onClick={handleDownloadTemplate}
            >
              Download Template
            </Button>
          ) : null}
        </Box>
      </Box>

      {error ? (
        <Alert severity='error' sx={{ mb: 3 }}>
          Error: {error.data?.message || error.message || 'Failed to process email request'}
        </Alert>
      ) : null}

      {success ? (
        <Alert severity='success' sx={{ mb: 3 }}>
          Email sent successfully for version {version}!
        </Alert>
      ) : null}

      {emailPreview ? (
        <Box sx={{ mt: 4 }}>
          <Divider sx={{ mb: 3 }} />
          <Typography variant='h6' gutterBottom>
            {dryRun ? 'Email Preview' : 'Email Content'}
          </Typography>
          <Paper
            variant='outlined'
            sx={{
              p: 0,
              height: 500,
              overflow: 'hidden',
              backgroundColor: '#ffffff',
            }}
          >
            <iframe
              srcDoc={emailPreview}
              style={{
                width: '100%',
                height: '100%',
                border: 'none',
                backgroundColor: 'white',
              }}
              title='Email Preview'
            />
          </Paper>
        </Box>
      ) : null}
    </Box>
  );
};

export default SendEmailContainer;
