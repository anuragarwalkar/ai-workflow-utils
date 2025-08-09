import React, { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  FormControlLabel,
  Grid,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  Switch,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import { useDispatch } from 'react-redux';
import {
  AutoAwesome as AutoAwesomeIcon,
  Code as CodeIcon,
  Info as InfoIcon,
  Link as LinkIcon,
  Search as SearchIcon,
  Storage as StorageIcon,
} from '@mui/icons-material';
import {
  setDirectPRId,
  setError,
  setSelectedProject,
} from '../../store/slices/prSlice';

const STORAGE_KEY = 'gitstash_project_config';

const GitStashForm = ({ onNext, onDirectNext }) => {
  const dispatch = useDispatch();
  const [tabValue, setTabValue] = useState(0);
  const [formData, setFormData] = useState({
    projectKey: '',
    repoSlug: '',
  });
  const [urlData, setUrlData] = useState({
    url: '',
    parsedData: null,
    directToPR: false,
  });
  const [isLoading, setIsLoading] = useState(false);

  // Load saved values from localStorage on component mount
  useEffect(() => {
    try {
      const savedConfig = localStorage.getItem(STORAGE_KEY);
      if (savedConfig) {
        const parsedConfig = JSON.parse(savedConfig);
        setFormData({
          projectKey: parsedConfig.projectKey || '',
          repoSlug: parsedConfig.repoSlug || '',
        });
      }
    } catch (error) {
      console.warn('Failed to load saved project configuration:', error);
    }
  }, []);

  // Save to localStorage whenever form data changes
  const saveToLocalStorage = data => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to save project configuration:', error);
    }
  };

  const handleInputChange = field => event => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value,
    }));
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    dispatch(setError(null));
  };

  const parseGitStashUrl = url => {
    try {
      // Remove any trailing slashes and whitespace
      const cleanUrl = url.trim().replace(/\/$/, '');

      // Pattern for GitStash URLs
      // Format: https://domain/projects/PROJECT_KEY/repos/REPO_SLUG/pull-requests/PR_NUMBER[/overview|/diff|/commits]
      // Or: https://domain/projects/PROJECT_KEY/repos/REPO_SLUG
      const urlPattern =
        /\/projects\/([^/]+)\/repos\/([^/]+)(?:\/pull-requests\/(\d+)(?:\/(?:overview|diff|commits))?)?/;
      const match = cleanUrl.match(urlPattern);

      if (match) {
        const [, projectKey, repoSlug, prNumber] = match;
        return {
          projectKey: projectKey.toUpperCase(),
          repoSlug,
          prNumber: prNumber ? parseInt(prNumber, 10) : null,
          isValid: true,
        };
      }

      return { isValid: false };
    } catch {
      return { isValid: false };
    }
  };

  const handleUrlChange = event => {
    const url = event.target.value;
    setUrlData(prev => ({ ...prev, url }));

    if (url.trim()) {
      const parsed = parseGitStashUrl(url);
      setUrlData(prev => ({
        ...prev,
        parsedData: parsed,
        // Automatically enable direct PR navigation if PR number is found
        directToPR: parsed.isValid && parsed.prNumber ? true : prev.directToPR,
      }));

      if (parsed.isValid) {
        dispatch(setError(null));
      }
    } else {
      setUrlData(prev => ({ ...prev, parsedData: null, directToPR: false }));
    }
  };

  const handleDirectToPRChange = event => {
    setUrlData(prev => ({ ...prev, directToPR: event.target.checked }));
  };

  const handleSubmit = async event => {
    event.preventDefault();

    let projectData;
    let prNumber = null;

    if (tabValue === 0) {
      // Manual form submission
      if (!formData.projectKey.trim() || !formData.repoSlug.trim()) {
        dispatch(setError('Please enter both Project Key and Repository Slug'));
        return;
      }

      projectData = {
        projectKey: formData.projectKey.trim(),
        repoSlug: formData.repoSlug.trim(),
      };
    } else {
      // URL-based submission
      if (!urlData.url.trim()) {
        dispatch(setError('Please enter a GitStash URL'));
        return;
      }

      const parsed = parseGitStashUrl(urlData.url);
      if (!parsed.isValid) {
        dispatch(
          setError(
            'Invalid GitStash URL format. Please check the URL and try again.'
          )
        );
        return;
      }

      projectData = {
        projectKey: parsed.projectKey,
        repoSlug: parsed.repoSlug,
      };

      prNumber = parsed.prNumber;
    }

    setIsLoading(true);
    dispatch(setError(null));

    try {
      // Save to localStorage for future use
      saveToLocalStorage(projectData);

      // If we have a PR number and user wants to go directly to it, set it first
      if (prNumber && urlData.directToPR) {
        dispatch(setDirectPRId(prNumber));
      }

      // Set the selected project in Redux store
      dispatch(setSelectedProject(projectData));

      // Re-set the direct PR ID after setting project (since setSelectedProject clears it)
      if (prNumber && urlData.directToPR) {
        dispatch(setDirectPRId(prNumber));
      }

      // If we have direct PR navigation, use onDirectNext to skip PR list
      if (prNumber && urlData.directToPR) {
        // Use setTimeout to ensure Redux state is updated before calling onDirectNext
        setTimeout(() => {
          onDirectNext();
        }, 50);
      } else {
        // Normal flow - call onNext immediately
        onNext();
      }
    } catch {
      dispatch(setError('Failed to set project details'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto' }}>
      <Typography
        component='h2'
        sx={{ mb: 3, textAlign: 'center' }}
        variant='h5'
      >
        Select GitStash Repository
      </Typography>

      <Grid container spacing={4}>
        {/* Form Section */}
        <Grid item md={6} xs={12}>
          <Card elevation={2} sx={{ height: 'fit-content' }}>
            <CardContent>
              <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                <Tabs
                  aria-label='repository selection tabs'
                  value={tabValue}
                  onChange={handleTabChange}
                >
                  <Tab
                    icon={<StorageIcon />}
                    iconPosition='start'
                    label='Manual Entry'
                    sx={{ minHeight: 48 }}
                  />
                  <Tab
                    icon={<AutoAwesomeIcon />}
                    iconPosition='start'
                    label='From URL'
                    sx={{ minHeight: 48 }}
                  />
                </Tabs>
              </Box>

              <form onSubmit={handleSubmit}>
                {tabValue === 0 ? (
                  // Manual Entry Tab
                  <Grid container spacing={3}>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        required
                        disabled={isLoading}
                        helperText='The project key from your GitStash URL'
                        label='Project Key'
                        placeholder='e.g., PROJ'
                        value={formData.projectKey}
                        onChange={handleInputChange('projectKey')}
                      />
                    </Grid>

                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        required
                        disabled={isLoading}
                        helperText='The repository slug from your GitStash URL'
                        label='Repository Slug'
                        placeholder='e.g., my-repository'
                        value={formData.repoSlug}
                        onChange={handleInputChange('repoSlug')}
                      />
                    </Grid>

                    <Grid item xs={12}>
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'center',
                          mt: 2,
                        }}
                      >
                        <Button
                          disabled={
                            isLoading ||
                            !formData.projectKey.trim() ||
                            !formData.repoSlug.trim()
                          }
                          size='large'
                          startIcon={<SearchIcon />}
                          sx={{
                            minWidth: 200,
                            background:
                              'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
                            '&:hover': {
                              background:
                                'linear-gradient(135deg, #0d7377 0%, #2dd4bf 100%)',
                            },
                          }}
                          type='submit'
                          variant='contained'
                        >
                          {isLoading ? 'Loading...' : 'Fetch Pull Requests'}
                        </Button>
                      </Box>
                    </Grid>
                  </Grid>
                ) : (
                  // URL Entry Tab
                  <Grid container spacing={3}>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        multiline
                        required
                        disabled={isLoading}
                        helperText='Paste the full GitStash URL (repository or pull request)'
                        label='GitStash URL'
                        placeholder='https://gitstash.company.com/projects/PROJ/repos/my-repository/pull-requests/123'
                        rows={2}
                        value={urlData.url}
                        onChange={handleUrlChange}
                      />
                    </Grid>

                    {urlData.parsedData?.isValid ? (
                      <Grid item xs={12}>
                        <Alert severity='success' sx={{ mb: 2 }}>
                          <Typography sx={{ mb: 1 }} variant='subtitle2'>
                            ✅ URL Parsed Successfully
                          </Typography>
                          <Box
                            sx={{
                              display: 'flex',
                              gap: 1,
                              flexWrap: 'wrap',
                              mb: 1,
                            }}
                          >
                            <Chip
                              color='primary'
                              label={`Project: ${urlData.parsedData.projectKey}`}
                              size='small'
                            />
                            <Chip
                              color='secondary'
                              label={`Repo: ${urlData.parsedData.repoSlug}`}
                              size='small'
                            />
                            {urlData.parsedData.prNumber ? <Chip
                                label={`PR: #${urlData.parsedData.prNumber}`}
                                size='small'
                                color='success'
                              /> : null}
                          </Box>
                          {urlData.parsedData.prNumber ? <FormControlLabel
                              control={
                                <Switch
                                  checked={urlData.directToPR}
                                  onChange={handleDirectToPRChange}
                                  size='small'
                                />
                              }
                              label='Go directly to this PR review'
                              sx={{ mt: 1 }}
                            /> : null}
                        </Alert>
                      </Grid>
                    ) : null}

                    {urlData.url && !urlData.parsedData?.isValid ? (
                      <Grid item xs={12}>
                        <Alert severity='warning'>
                          Invalid URL format. Please ensure the URL follows the
                          GitStash format:
                          <br />
                          <code>
                            https://domain/projects/PROJECT_KEY/repos/REPO_SLUG
                          </code>
                          <br />
                          or
                          <br />
                          <code>
                            https://domain/projects/PROJECT_KEY/repos/REPO_SLUG/pull-requests/PR_NUMBER
                          </code>
                        </Alert>
                      </Grid>
                    ) : null}

                    <Grid item xs={12}>
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'center',
                          mt: 2,
                        }}
                      >
                        <Button
                          disabled={isLoading || !urlData.parsedData?.isValid}
                          size='large'
                          startIcon={
                            urlData.parsedData?.prNumber &&
                            urlData.directToPR ? (
                              <AutoAwesomeIcon />
                            ) : (
                              <SearchIcon />
                            )
                          }
                          sx={{
                            minWidth: 200,
                            background:
                              'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
                            '&:hover': {
                              background:
                                'linear-gradient(135deg, #0d7377 0%, #2dd4bf 100%)',
                            },
                          }}
                          type='submit'
                          variant='contained'
                        >
                          {isLoading
                            ? 'Loading...'
                            : urlData.parsedData?.prNumber && urlData.directToPR
                              ? 'Go Directly to Review'
                              : 'Fetch Pull Requests'}
                        </Button>
                      </Box>
                    </Grid>
                  </Grid>
                )}
              </form>
            </CardContent>
          </Card>
        </Grid>

        {/* Help Section */}
        <Grid item md={6} xs={12}>
          <Card elevation={2} sx={{ height: 'fit-content' }}>
            <CardContent>
              <Typography
                sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}
                variant='h6'
              >
                <InfoIcon color='primary' />
                How to Find Your Repository Details
              </Typography>

              <List dense>
                <ListItem>
                  <ListItemIcon>
                    <LinkIcon color='action' />
                  </ListItemIcon>
                  <ListItemText
                    primary='Navigate to your GitStash repository'
                    secondary='Go to your GitStash instance and open the repository you want to review'
                  />
                </ListItem>

                <ListItem>
                  <ListItemIcon>
                    <CodeIcon color='action' />
                  </ListItemIcon>
                  <ListItemText
                    primary='Extract from URL'
                    secondary='URL format: https://gitstash.company.com/projects/[PROJECT_KEY]/repos/[REPO_SLUG]'
                  />
                </ListItem>
              </List>

              <Divider sx={{ my: 2 }} />

              <Typography sx={{ mb: 1, fontWeight: 600 }} variant='subtitle2'>
                Example:
              </Typography>
              <Paper
                sx={{ p: 2, backgroundColor: 'grey.50' }}
                variant='outlined'
              >
                <Box
                  sx={{
                    fontFamily: 'monospace',
                    mb: 1,
                    display: 'flex',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: 0.5,
                  }}
                >
                  <Typography
                    component='span'
                    sx={{ fontFamily: 'monospace' }}
                    variant='body2'
                  >
                    URL: https://gitstash.company.com/projects/
                  </Typography>
                  <Chip color='primary' label='PROJ' size='small' />
                  <Typography
                    component='span'
                    sx={{ fontFamily: 'monospace' }}
                    variant='body2'
                  >
                    /repos/
                  </Typography>
                  <Chip color='secondary' label='my-repository' size='small' />
                </Box>
                <Typography color='text.secondary' variant='caption'>
                  Project Key: PROJ | Repository Slug: my-repository
                </Typography>
              </Paper>

              <Alert severity='info' sx={{ mt: 2 }}>
                <Typography variant='body2'>
                  Your repository details will be saved locally for future use.
                </Typography>
              </Alert>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default GitStashForm;
