import React from 'react';
import { useSelector } from 'react-redux';
import { Box } from '@mui/material';
import GitStashHeader from './GitStashHeader';
import GitStashStepper from './GitStashStepper';
import GitStashContent from './GitStashContent';
import { useGitStashNavigation } from '../../hooks/useGitStashNavigation';

const GitStashContainer = () => {
  const { error } = useSelector(state => state.pr);
  const { activeStep, shouldSkipPRList, handleNext, handlePrevious, handleDirectNext, handleReset } = useGitStashNavigation();

  return (
    <Box>
      <GitStashHeader error={error} />
      <GitStashStepper activeStep={activeStep} />
      <GitStashContent 
        activeStep={activeStep}
        handleDirectNext={handleDirectNext}
        handleNext={handleNext}
        handlePrevious={handlePrevious}
        handleReset={handleReset}
        shouldSkipPRList={shouldSkipPRList}
      />
    </Box>
  );
};

export default GitStashContainer;

