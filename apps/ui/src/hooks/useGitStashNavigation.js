import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { clearPRData } from '../store/slices/prSlice';

export const useGitStashNavigation = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [shouldSkipPRList, setShouldSkipPRList] = useState(false);
  const { directPRId } = useSelector(state => state.pr);

  // Reset shouldSkipPRList on component mount if there's no directPRId
  useEffect(() => {
    if (!directPRId) {
      setShouldSkipPRList(false);
    }
  }, [directPRId]); // Run when directPRId changes

  // Watch for directPRId and set flag to skip PR list
  useEffect(() => {
    if (directPRId) {
      setShouldSkipPRList(true);
    } else if (shouldSkipPRList) {
      // Reset shouldSkipPRList when directPRId becomes null
      setShouldSkipPRList(false);
    }
  }, [directPRId, shouldSkipPRList]);

  const handleBack = () => {
    dispatch(clearPRData());
    navigate('/');
  };

  const handleNext = () => {
    setActiveStep(prevStep => prevStep + 1);
  };

  const handlePrevious = () => {
    setActiveStep(prevStep => prevStep - 1);
  };

  const handleDirectNext = () => {
    // For direct PR navigation, skip to step 2 (Review Changes)
    setActiveStep(2);
  };

  const handleReset = () => {
    setActiveStep(0);
    setShouldSkipPRList(false);
    dispatch(clearPRData());
  };

  return {
    activeStep,
    shouldSkipPRList,
    handleBack,
    handleNext,
    handlePrevious,
    handleDirectNext,
    handleReset,
  };
};
