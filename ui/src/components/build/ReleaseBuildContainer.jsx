import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Stepper,
  Step,
  StepLabel,
  Button,
  Grid,
  Alert,
} from '@mui/material';
import { useSelector, useDispatch } from 'react-redux';
import { setCurrentView } from '../../store/slices/appSlice';
import { useStartBuildMutation } from '../../store/api/buildApi';
import { 
  startBuild, 
  clearBuildLogs, 
  resetBuildState 
} from '../../store/slices/buildSlice';
import socketService from '../../services/socketService';
import BuildConfigForm from './BuildConfigForm';
import BuildProgress from './BuildProgress';

const steps = [
  'Configure Build',
  'Review & Start',
  'Build Progress'
];

const ReleaseBuildContainer = () => {
  const dispatch = useDispatch();
  const [activeStep, setActiveStep] = useState(0);
  const [buildConfig, setBuildConfig] = useState({
    ticketNumber: '',
    selectedPackages: [],
    createPullRequest: false,
  });
  
  const [startBuildMutation, { isLoading: isStartingBuild }] = useStartBuildMutation();
  
  const { 
    isBuilding, 
    error 
  } = useSelector((state) => state.build);

  // Connect to WebSocket when component mounts
  useEffect(() => {
    socketService.connect();
    
    return () => {
      // Don't disconnect on unmount as other components might use it
    };
  }, []);

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
      setActiveStep((prevStep) => prevStep - 1);
    }
  };

  const handleNext = () => {
    if (activeStep < steps.length - 1) {
      setActiveStep((prevStep) => prevStep + 1);
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
      }).unwrap();
      
      // Update Redux state
      dispatch(startBuild({ 
        buildId: result.buildId, 
        buildConfig: buildConfig 
      }));
      
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

  const getStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <BuildConfigForm
            config={buildConfig}
            onChange={setBuildConfig}
            onNext={handleNext}
          />
        );
      case 1:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Review Build Configuration
            </Typography>
            <Paper sx={{ p: 3, mb: 3 }}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Ticket Number:
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {buildConfig.ticketNumber || 'Not specified'}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Selected Packages ({buildConfig.selectedPackages.length}):
                  </Typography>
                  {buildConfig.selectedPackages.length > 0 ? (
                    <Box sx={{ mt: 1 }}>
                      {buildConfig.selectedPackages.map((pkg) => (
                        <Typography key={pkg} variant="body2" sx={{ ml: 2 }}>
                          • {pkg}
                        </Typography>
                      ))}
                    </Box>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No packages selected
                    </Typography>
                  )}
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Create Pull Request:
                  </Typography>
                  <Typography variant="body1">
                    {buildConfig.createPullRequest ? 'Yes' : 'No'}
                  </Typography>
                </Grid>
              </Grid>
            </Paper>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button onClick={handleBack}>
                Back
              </Button>
              <Button
                variant="contained"
                onClick={handleStartBuild}
                disabled={isStartingBuild || !buildConfig.ticketNumber}
              >
                {isStartingBuild ? 'Starting...' : 'Start Build'}
              </Button>
            </Box>
          </Box>
        );
      case 2:
        return (
          <BuildProgress
            onReset={handleReset}
            onBack={handleBack}
          />
        );
      default:
        return 'Unknown step';
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Mobile App Release Build
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Configure and execute the mobile app build process with package updates
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 3 }}>
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
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
