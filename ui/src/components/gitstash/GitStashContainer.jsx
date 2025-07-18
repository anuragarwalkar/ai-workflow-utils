import React, { useState } from 'react';
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
  const { error } = useSelector((state) => state.pr);

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

  const handleReset = () => {
    setActiveStep(0);
    dispatch(clearPRData());
  };

  const getStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <GitStashForm 
            onNext={handleNext}
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
            onPrevious={handlePrevious}
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

        <Paper elevation={2} sx={{ p: 3, minHeight: '60vh' }}>
          {getStepContent(activeStep)}
        </Paper>
      </Box>
    </Container>
  );
};

export default GitStashContainer;
