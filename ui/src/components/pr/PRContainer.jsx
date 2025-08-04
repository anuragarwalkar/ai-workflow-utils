import React, { useState, useEffect } from 'react';
import { Box, Tab, Tabs, Paper, Typography } from '@mui/material';
import CreatePRContainer from './CreatePR/CreatePRContainer';
import PRList from './ViewPR/PRList';

const STORAGE_KEY = 'gitstash_project_config';

const PRContainer = () => {
  const [tabValue, setTabValue] = useState(0);
  const [config, setConfig] = useState({
    projectKey: '',
    repoSlug: '',
  });

  useEffect(() => {
    const savedConfig = localStorage.getItem(STORAGE_KEY);
    if (savedConfig) {
      setConfig(JSON.parse(savedConfig));
    }
  }, []);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleViewDiff = pr => {
    // TODO: Implement diff viewing logic
    console.log('View diff for PR:', pr);
  };

  const handleRequestReview = pr => {
    // TODO: Implement review request logic
    console.log('Request review for PR:', pr);
  };

  return (
    <Box sx={{ width: '100%', p: 3 }}>
      <Paper sx={{ width: '100%', mb: 2 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          indicatorColor='primary'
          textColor='primary'
          variant='fullWidth'
        >
          <Tab label='Create PR' />
          <Tab label='View PRs' />
        </Tabs>
      </Paper>

      {tabValue === 0 && <CreatePRContainer />}

      {tabValue === 1 &&
        (config.projectKey && config.repoSlug ? (
          <PRList
            projectKey={config.projectKey}
            repoSlug={config.repoSlug}
            onViewDiff={handleViewDiff}
            onRequestReview={handleRequestReview}
          />
        ) : (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography color='text.secondary'>
              Please create a PR first to configure project key and repository
              slug
            </Typography>
          </Box>
        ))}
    </Box>
  );
};

export default PRContainer;
