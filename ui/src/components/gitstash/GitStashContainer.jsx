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
  Alert,
} from '@mui/material';
import { useSelector, useDispatch } from 'react-redux';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { setCurrentView } from '../../store/slices/appSlice';
import { clearPRData } from '../../store/slices/prSlice';
import GitStashForm from './GitStashForm';
import PullRequestList from './PullRequestList';
import PullRequestDiff from './PullRequestDiff';

const steps = ['Select Repository', 'Choose Pull Request', 'Review Changes'];

const GitStashContainer = () => {
  const dispatch = useDispatch();
  const [activeStep, setActiveStep] = useState(0);
  const [shouldSkipPRList, setShouldSkipPRList] = useState(false);
  const { error, directPRId } = useSelector((state) => state.pr);

  // Reset shouldSkipPRList on component mount if there's no directPRId
  useEffect(() => {
    if (!directPRId) {
      console.log('GitStashContainer: No directPRId on mount, resetting shouldSkipPRList to false'); // Debug log
      setShouldSkipPRList(false);
    }
  }, []); // Only run on mount

  // Watch for directPRId and set flag to skip PR list
  useEffect(() => {
    console.log('GitStashContainer: directPRId changed:', directPRId); // Debug log
    if (directPRId) {
      console.log('GitStashContainer: Setting shouldSkipPRList to true'); // Debug log
      setShouldSkipPRList(true);
    } else {
      console.log('GitStashContainer: directPRId is null, shouldSkipPRList remains:', shouldSkipPRList); // Debug log
      // Reset shouldSkipPRList when directPRId becomes null
      if (shouldSkipPRList) {
        console.log('GitStashContainer: Resetting shouldSkipPRList to false'); // Debug log
        setShouldSkipPRList(false);
      }
    }
  }, [directPRId, shouldSkipPRList]);

  const handleBack = () => {
    dispatch(clearPRData());
    dispatch(setCurrentView('home'));
  };

  const handleNext = () => {
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handlePrevious = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleDirectNext = () => {
    console.log('GitStashContainer: handleDirectNext called, setting step to 2'); // Debug log
    // For direct PR navigation, skip to step 2 (Review Changes)
    setActiveStep(2);
  };

  const handleReset = () => {
    setActiveStep(0);
    setShouldSkipPRList(false);
    dispatch(clearPRData());
  };

  const getStepContent = (step) => {
    console.log('GitStashContainer: getStepContent called with step:', step, 'shouldSkipPRList:', shouldSkipPRList); // Debug log
    switch (step) {
      case 0:
        return (
          <GitStashForm 
            onNext={handleNext}
            onDirectNext={handleDirectNext}
          />
        );
      case 1:
        return (
          <PullRequestList 
            onNext={handleNext}
            onPrevious={handlePrevious}
          />
        );
      case 2:
        return (
          <PullRequestDiff 
            onPrevious={shouldSkipPRList ? handleReset : handlePrevious}
            onReset={handleReset}
          />
        );
      default:
        return 'Unknown step';
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={handleBack}
            sx={{ mr: 2 }}
          >
            Back to Home
          </Button>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 600 }}>
            GitStash PR Review
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
          <Stepper activeStep={activeStep} alternativeLabel>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </Paper>

        <Paper elevation={2} sx={{ p: 3, minHeight: activeStep === 0 ? 'auto' : '60vh' }}>
          {getStepContent(activeStep)}
        </Paper>
      </Box>
    </Container>
  );
};

export default GitStashContainer;
