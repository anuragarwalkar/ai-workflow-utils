import React, { useState } from 'react';
import { Box, Card, CardContent, Grid, Typography } from '@mui/material';
import { useDispatch } from 'react-redux';
import { setDirectPRId, setError, setSelectedProject } from '../../store/slices/prSlice';
import { useFormData } from './hooks/useFormData';
import { useUrlData } from './hooks/useUrlData';
import { validateFormData, validateUrlData } from './utils/urlParser';
import TabNavigation from './components/TabNavigation';
import ManualEntryForm from './components/ManualEntryForm';
import UrlEntryForm from './components/UrlEntryForm';
import HelpSection from './components/HelpSection';

/**
 * Main GitStash form component for repository selection
 */
const GitStashForm = ({ onNext, onDirectNext }) => {
  const dispatch = useDispatch();
  const [tabValue, setTabValue] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  
  const { formData, handleInputChange, saveFormData } = useFormData();
  const { urlData, handleUrlChange, handleDirectToPRChange } = useUrlData();

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    dispatch(setError(null));
  };

  const processSubmission = async (projectData, prNumber = null, shouldGoDirectToPR = false) => {
    setIsLoading(true);
    dispatch(setError(null));

    try {
      // Save to localStorage for future use
      saveFormData();

      // If we have a PR number and user wants to go directly to it, set it first
      if (prNumber && shouldGoDirectToPR) {
        dispatch(setDirectPRId(prNumber));
      }

      // Set the selected project in Redux store
      dispatch(setSelectedProject(projectData));

      // Re-set the direct PR ID after setting project (since setSelectedProject clears it)
      if (prNumber && shouldGoDirectToPR) {
        dispatch(setDirectPRId(prNumber));
      }

      // If we have direct PR navigation, use onDirectNext to skip PR list
      if (prNumber && shouldGoDirectToPR) {
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

  const handleManualSubmit = async (event) => {
    event.preventDefault();

    const validation = validateFormData(formData);
    if (!validation.isValid) {
      dispatch(setError(validation.errors[0]));
      return;
    }

    const projectData = {
      projectKey: formData.projectKey.trim(),
      repoSlug: formData.repoSlug.trim(),
    };

    await processSubmission(projectData);
  };

  const handleUrlSubmit = async (event) => {
    event.preventDefault();

    const validation = validateUrlData(urlData.url);
    if (!validation.isValid) {
      dispatch(setError(validation.errors[0]));
      return;
    }

    const { parsed } = validation;
    const projectData = {
      projectKey: parsed.projectKey,
      repoSlug: parsed.repoSlug,
    };

    await processSubmission(projectData, parsed.prNumber, urlData.directToPR);
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto' }}>
      <Typography component="h2" sx={{ mb: 3, textAlign: 'center' }} variant="h5">
        Select GitStash Repository
      </Typography>

      <Grid container spacing={4}>
        {/* Form Section */}
        <Grid item md={6} xs={12}>
          <Card elevation={2} sx={{ height: 'fit-content' }}>
            <CardContent>
              <TabNavigation tabValue={tabValue} onTabChange={handleTabChange} />

              <form onSubmit={tabValue === 0 ? handleManualSubmit : handleUrlSubmit}>
                {tabValue === 0 ? (
                  <ManualEntryForm
                    formData={formData}
                    isLoading={isLoading}
                    onInputChange={handleInputChange}
                    onSubmit={handleManualSubmit}
                  />
                ) : (
                  <UrlEntryForm
                    isLoading={isLoading}
                    urlData={urlData}
                    onDirectToPRChange={handleDirectToPRChange}
                    onSubmit={handleUrlSubmit}
                    onUrlChange={handleUrlChange}
                  />
                )}
              </form>
            </CardContent>
          </Card>
        </Grid>

        {/* Help Section */}
        <Grid item md={6} xs={12}>
          <HelpSection />
        </Grid>
      </Grid>
    </Box>
  );
};

export default GitStashForm;
