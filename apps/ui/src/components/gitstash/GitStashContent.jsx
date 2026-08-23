import React from 'react';
import { Paper } from '@mui/material';
import GitStashForm from './GitStashForm';
import PullRequestList from './PullRequestList';
import PullRequestDiff from './PullRequestDiff';

const GitStashContent = ({ 
  activeStep, 
  shouldSkipPRList, 
  handleNext, 
  handlePrevious, 
  handleDirectNext, 
  handleReset 
}) => {

  const getStepContent = step => {
    switch (step) {
      case 0:
        return <GitStashForm onDirectNext={handleDirectNext} onNext={handleNext} />;
      case 1:
        return <PullRequestList onNext={handleNext} onPrevious={handlePrevious} />;
      case 2:
        return (
          <PullRequestDiff
            onPrevious={shouldSkipPRList ? handleReset : handlePrevious}
            onReset={handleReset}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Paper elevation={2} sx={{ p: 3, minHeight: activeStep === 0 ? 'auto' : '60vh' }}>
      {getStepContent(activeStep)}
    </Paper>
  );
};

export default GitStashContent;
