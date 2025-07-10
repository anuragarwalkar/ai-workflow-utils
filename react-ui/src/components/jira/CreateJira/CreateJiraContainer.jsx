import React from 'react';
import { Box } from '@mui/material';
import JiraForm from './JiraForm';
import PreviewSection from './PreviewSection';

const CreateJiraContainer = () => {
  return (
    <Box sx={{ width: '100%' }}>
      <JiraForm />
      <PreviewSection />
    </Box>
  );
};

export default CreateJiraContainer;
