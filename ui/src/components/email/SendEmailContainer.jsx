import React, { useState, useEffect } from 'react';
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
  Grid,
} from '@mui/material';
import { Download } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useSendEmailMutation } from '../../store/api/emailApi';
import { setEmailData, setLastSentVersion } from '../../store/slices/emailSlice';

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

  // Load email values from localStorage on component mount
  useEffect(() => {
    const lastEmailVersion = localStorage.getItem('lastEmailVersion');
    
    if (lastEmailVersion) {
      try {
        const lastVersionData = JSON.parse(lastEmailVersion);
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
          // Decode from base64 when retrieving from localStorage
          try {
            setWikiBasicAuth(atob(lastVersionData.wikiBasicAuth));
          } catch (decodeError) {
            console.error('Error decoding wikiBasicAuth from localStorage:', decodeError);
            // If decoding fails, treat as plain text (for backward compatibility)
            setWikiBasicAuth(lastVersionData.wikiBasicAuth);
          }
        }
      } catch (error) {
        console.error('Error parsing last email version data:', error);
      }
    }
  }, []);

  const saveEmailDataToLocalStorage = () => {
    const emailVersionData = {
      version,
      timestamp: new Date().toISOString(),
      toEmail,
      ccEmail,
      subject,
      wikiUrl,
      // Store wikiBasicAuth as base64 encoded
      wikiBasicAuth: wikiBasicAuth ? btoa(wikiBasicAuth) : '',
      dryRun
    };
    localStorage.setItem('lastEmailVersion', JSON.stringify(emailVersionData));
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
        wikiBasicAuth: wikiBasicAuth ? btoa(wikiBasicAuth) : ''
      };
      
      const result = await sendEmail(requestData).unwrap();
      
      setEmailPreview(result);
      dispatch(setEmailData(result));
      
      // Save last version to local storage when preview is successfully generated
      saveEmailDataToLocalStorage();
      
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

    // Update localStorage with current email data before download
    saveEmailDataToLocalStorage();

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
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Version"
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                placeholder="e.g., 1.0.0"
                helperText="Enter the version number for the release notes"
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Wiki URL"
                value={wikiUrl}
                onChange={(e) => setWikiUrl(e.target.value)}
                placeholder="https://your-company.atlassian.net/wiki"
                helperText="Your Atlassian Wiki URL for release notes"
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                type="password"
                label="Wiki Basic Auth"
                value={wikiBasicAuth}
                onChange={(e) => setWikiBasicAuth(e.target.value)}
                placeholder="username:password"
                helperText="Wiki basic authentication (username:password)"
              />
            </Grid>
            
            {dryRun && emailPreview && (
              <>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Email subject"
                    helperText="Email subject line"
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="To Email"
                    value={toEmail}
                    onChange={(e) => setToEmail(e.target.value)}
                    placeholder="recipient@example.com"
                    helperText="Primary recipient email address"
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="CC Email (Optional)"
                    value={ccEmail}
                    onChange={(e) => setCcEmail(e.target.value)}
                    placeholder="cc@example.com"
                    helperText="Carbon copy email address"
                  />
                </Grid>
              </>
            )}
          </Grid>

          <FormControlLabel
            control={
              <Switch
                checked={dryRun}
                onChange={(e) => setDryRun(e.target.checked)}
                color="primary"
              />
            }
            label={dryRun ? "Dry Run (Only preview and donwload template)" : "Send Actual Email"}
            sx={{ mt: 3, mb: 3 }}
          />

          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              size="large"
              onClick={handleSendEmail}
              disabled={isLoading || !version.trim() || !wikiUrl.trim() || !wikiBasicAuth.trim()}
              sx={{ minWidth: 200 }}
            >
              {isLoading ? (
                <>
                  <CircularProgress size={20} sx={{ mr: 1 }} />
                  {dryRun ? 'Generating Preview...' : 'Sending Email...'}
                </>
              ) : (
                dryRun ? (emailPreview ? 'Regenerate Preview' : 'Generate Preview') : 'Send Email'
              )}
            </Button>

            {dryRun && emailPreview && (
              <Button
                variant="outlined"
                size="large"
                onClick={handleDownloadTemplate}
                startIcon={<Download />}
                sx={{ minWidth: 200 }}
              >
                Download Template
              </Button>
            )}
          </Box>
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
