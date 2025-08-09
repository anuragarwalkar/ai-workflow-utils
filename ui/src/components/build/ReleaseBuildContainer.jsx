import React, { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Container,
  Grid,
  Paper,
  Step,
  StepLabel,
  Stepper,
  Typography,
} from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { setCurrentView } from '../../store/slices/appSlice';
import { useStartBuildMutation } from '../../store/api/buildApi';
import {
  clearBuildLogs,
  resetBuildState,
  saveRepoConfig,
  startBuild,
} from '../../store/slices/buildSlice';
import socketService from '../../services/socketService';
import BuildConfigForm from './BuildConfigForm';
import BuildProgress from './BuildProgress';

const steps = ['Configure Build', 'Review & Start', 'Build Progress'];

const ReleaseBuildContainer = () => {
  const dispatch = useDispatch();
  const [activeStep, setActiveStep] = useState(0);
  const [buildConfig, setBuildConfig] = useState({
    ticketNumber: '',
    repoKey: '',
    repoSlug: '',
    gitRepos: '',
    availablePackages: [],
    selectedPackages: [],
    createPullRequest: false,
  });

  const [startBuildMutation, { isLoading: isStartingBuild }] =
    useStartBuildMutation();

  const { isBuilding, error, savedRepoConfig } = useSelector(
    state => state.build
  );

  // Connect to WebSocket when component mounts and load saved config
  useEffect(() => {
    socketService.connect();

    // Load saved configuration from Redux state
    if (savedRepoConfig) {
      setBuildConfig(prevConfig => ({
        ...prevConfig,
        repoKey: savedRepoConfig.repoKey || '',
        repoSlug: savedRepoConfig.repoSlug || '',
        gitRepos: savedRepoConfig.gitRepos || '',
        availablePackages: savedRepoConfig.gitRepos
          ? savedRepoConfig.gitRepos
              .split(',')
              .map(repo => repo.trim())
              .filter(repo => repo)
          : [],
      }));
    }

    return () => {
      // Don't disconnect on unmount as other components might use it
    };
  }, [savedRepoConfig]);

  // Auto-advance to progress step when build starts
  useEffect(() => {
    if (isBuilding && activeStep < 2) {
      setActiveStep(2);
    }
  }, [isBuilding, activeStep]);

  const handleBack = () => {
    if (activeStep === 0) {
      dispatch(setCurrentView('home'));
    } else {
      setActiveStep(prevStep => prevStep - 1);
    }
  };

  const handleNext = () => {
    if (activeStep < steps.length - 1) {
      setActiveStep(prevStep => prevStep + 1);
    }
  };

  const handleStartBuild = async () => {
    try {
      // Clear previous logs
      dispatch(clearBuildLogs());

      // Start the build process with configuration
      const result = await startBuildMutation({
        ticketNumber: buildConfig.ticketNumber,
        selectedPackages: buildConfig.selectedPackages,
        createPullRequest: buildConfig.createPullRequest,
        repoKey: buildConfig.repoKey,
        repoSlug: buildConfig.repoSlug,
        gitRepos: buildConfig.gitRepos,
      }).unwrap();

      // Update Redux state
      dispatch(
        startBuild({
          buildId: result.buildId,
          buildConfig,
        })
      );

      // Move to progress step
      setActiveStep(2);
    } catch (error) {
      console.error('Failed to start build:', error);
    }
  };

  const handleReset = () => {
    dispatch(resetBuildState());
    setBuildConfig({
      ticketNumber: '',
      selectedPackages: [],
      createPullRequest: false,
    });
    setActiveStep(0);
  };

  const getStepContent = step => {
    switch (step) {
      case 0:
        return (
          <BuildConfigForm
            config={buildConfig}
            onChange={setBuildConfig}
            onNext={handleNext}
            onSaveConfig={repoConfig => dispatch(saveRepoConfig(repoConfig))}
          />
        );
      case 1:
        return (
          <Box>
            <Typography gutterBottom variant='h6'>
              Review Build Configuration
            </Typography>
            <Paper sx={{ p: 3, mb: 3 }}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography color='text.secondary' variant='subtitle2'>
                    Repository Key:
                  </Typography>
                  <Typography sx={{ mb: 2 }} variant='body1'>
                    {buildConfig.repoKey || 'Not specified'}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography color='text.secondary' variant='subtitle2'>
                    Repository Slug:
                  </Typography>
                  <Typography sx={{ mb: 2 }} variant='body1'>
                    {buildConfig.repoSlug || 'Not specified'}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography color='text.secondary' variant='subtitle2'>
                    Git Repositories:
                  </Typography>
                  <Typography sx={{ mb: 2 }} variant='body1'>
                    {buildConfig.gitRepos || 'Not specified'}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography color='text.secondary' variant='subtitle2'>
                    Ticket Number:
                  </Typography>
                  <Typography sx={{ mb: 2 }} variant='body1'>
                    {buildConfig.ticketNumber || 'Not specified'}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography color='text.secondary' variant='subtitle2'>
                    Selected Packages ({buildConfig.selectedPackages.length}):
                  </Typography>
                  {buildConfig.selectedPackages.length > 0 ? (
                    <Box sx={{ mt: 1 }}>
                      {buildConfig.selectedPackages.map(pkg => (
                        <Typography key={pkg} sx={{ ml: 2 }} variant='body2'>
                          • {pkg}
                        </Typography>
                      ))}
                    </Box>
                  ) : (
                    <Typography color='text.secondary' variant='body2'>
                      No packages selected
                    </Typography>
                  )}
                </Grid>
                <Grid item xs={12}>
                  <Typography color='text.secondary' variant='subtitle2'>
                    Create Pull Request:
                  </Typography>
                  <Typography variant='body1'>
                    {buildConfig.createPullRequest ? 'Yes' : 'No'}
                  </Typography>
                </Grid>
              </Grid>
            </Paper>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button onClick={handleBack}>Back</Button>
              <Button
                disabled={isStartingBuild || !buildConfig.ticketNumber}
                variant='contained'
                onClick={handleStartBuild}
              >
                {isStartingBuild ? 'Starting...' : 'Start Build'}
              </Button>
            </Box>
          </Box>
        );
      case 2:
        return <BuildProgress onBack={handleBack} onReset={handleReset} />;
      default:
        return 'Unknown step';
    }
  };

  return (
    <Container maxWidth='lg' sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography gutterBottom component='h1' variant='h4'>
          Mobile App Release Build
        </Typography>
        <Typography color='text.secondary' variant='body1'>
          Configure and execute the mobile app build process with package
          updates
        </Typography>
      </Box>

      {error ? (
        <Alert severity='error' sx={{ mb: 3 }}>
          {error}
        </Alert>
      ) : null}

      <Paper sx={{ p: 3 }}>
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map(label => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {getStepContent(activeStep)}
      </Paper>
    </Container>
  );
};

export default ReleaseBuildContainer;
