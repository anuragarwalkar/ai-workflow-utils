import React from 'react';
import { useSelector } from 'react-redux';
import GitStashHeader from './GitStashHeader';
import GitStashStepper from './GitStashStepper';
import GitStashContent from './GitStashContent';
import { useGitStashNavigation } from '../../hooks/useGitStashNavigation';
import { StyledContainer } from './GitStashContainer.style';

const GitStashContainer = () => {
  const { error } = useSelector(state => state.pr);
  const { activeStep, shouldSkipPRList, handleNext, handlePrevious, handleDirectNext, handleReset } = useGitStashNavigation();

  return (
    <StyledContainer maxWidth='xl'>
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
    </StyledContainer>
  );
};

export default GitStashContainer;
