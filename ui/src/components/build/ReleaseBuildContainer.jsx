/* eslint-disable max-statements */
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Container,
  FormControlLabel,
  Grid,
  Paper,
  Step,
  StepLabel,
  Stepper,
  Tab,
  Tabs,
  Typography,
} from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { setCurrentView } from '../../store/slices/appSlice';
import { 
  useStartBuildMutation, 
  useUploadBuildScriptMutation 
} from '../../store/api/buildApi';
import {
  clearBuildLogs,
  clearUploadedScript,
  resetBuildState,
  saveRepoConfig,
  setBuildError,
  setUploadedScript,
  startBuild,
} from '../../store/slices/buildSlice';
import socketService from '../../services/socketService';
import BuildConfigForm from './BuildConfigForm';
import BuildProgress from './BuildProgress';
import CronJobScheduleTab from './CronJobScheduleTab';
import ReviewBuildStep from './ReviewBuildStep';

const steps = ['Configure Build', 'Review & Start', 'Build Progress'];

const ReleaseBuildContainer = () => {
  const dispatch = useDispatch();
  const [activeStep, setActiveStep] = useState(0);
  const [activeTab, setActiveTab] = useState(0);
  const [buildConfig, setBuildConfig] = useState({
    ticketNumber: '',
    repoKey: '',
    repoSlug: '',
    gitRepos: '',
    availablePackages: [],
    selectedPackages: [],
    createPullRequest: false,
    buildScript: null,
  });

  const [startBuildMutation, { isLoading: isStartingBuild }] =
    useStartBuildMutation();
  const [uploadBuildScript] = useUploadBuildScriptMutation();

  const { isBuilding, error, savedRepoConfig, uploadedScript } = useSelector(
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

  // Load uploaded script information
  useEffect(() => {
    if (uploadedScript) {
      setBuildConfig(prevConfig => ({
        ...prevConfig,
        buildScript: {
          name: uploadedScript.originalName || uploadedScript.filename,
          size: uploadedScript.size,
          path: uploadedScript.path,
        },
      }));
    }
  }, [uploadedScript]);

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

  const handleScriptUpload = async file => {
    try {
      const result = await uploadBuildScript(file).unwrap();
      dispatch(setUploadedScript(result.script));
      return result;
    } catch (error) {
      throw new Error(error.data?.error || 'Failed to upload script');
    }
  };

  const handleScriptRemove = () => {
    dispatch(clearUploadedScript());
  };

  const handleStartBuild = async () => {
    try {
      // Clear previous logs
      dispatch(clearBuildLogs());

      // Prepare build configuration
      const buildPayload = {
        ticketNumber: buildConfig.ticketNumber,
        selectedPackages: buildConfig.selectedPackages,
        createPullRequest: buildConfig.createPullRequest,
        repoKey: buildConfig.repoKey,
        repoSlug: buildConfig.repoSlug,
        gitRepos: buildConfig.gitRepos,
      };

      // Add script path if script was uploaded
      if (uploadedScript?.path) {
        buildPayload.scriptPath = uploadedScript.path;
      }

      // Start the build process with configuration
      const result = await startBuildMutation(buildPayload).unwrap();

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
      // Handle build start error
      dispatch(setBuildError(error.data?.message || 'Failed to start build'));
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

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
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
            onScriptRemove={handleScriptRemove}
            onScriptUpload={handleScriptUpload}
          />
        );
      case 1:
        return (
          <ReviewBuildStep
            buildConfig={buildConfig}
            isStartingBuild={isStartingBuild}
            onBack={handleBack}
            onStartBuild={handleStartBuild}
          />
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

      <Paper sx={{ p: 0 }}>
        <Tabs sx={{ borderBottom: 1, borderColor: 'divider' }} value={activeTab} onChange={handleTabChange}>
          <Tab label='Build Configuration' />
          <Tab label='Schedule' />
        </Tabs>

        <Box sx={{ p: 3 }}>
          {activeTab === 0 && (
            <>
              <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
                {steps.map(label => (
                  <Step key={label}>
                    <StepLabel>{label}</StepLabel>
                  </Step>
                ))}
              </Stepper>
              {getStepContent(activeStep)}
            </>
          )}
          
          {activeTab === 1 && (
            <CronJobScheduleTab 
              buildConfig={buildConfig}
              onScheduleCreated={() => {
                // Handle schedule creation if needed
              }}
            />
          )}
        </Box>
      </Paper>
    </Container>
  );
};

export default ReleaseBuildContainer;
