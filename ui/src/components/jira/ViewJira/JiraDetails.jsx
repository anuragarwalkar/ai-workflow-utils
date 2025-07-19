import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Stack,
} from '@mui/material';
import { useSelector } from 'react-redux';
import { useFetchJiraQuery } from '../../../store/api/jiraApi';
import { useDebounce } from '../../../hooks/useDebounce';
import AttachmentUpload from './AttachmentUpload';

const JiraDetails = () => {
  const { jiraId } = useSelector((state) => state.jira.viewJira);
  
  // Debounce the jiraId to prevent API calls while typing
  const debouncedJiraId = useDebounce(jiraId, 300);
  
  // Validate Jira ID format before making API call
  const jiraIdPattern = /^[A-Z]{2,}-\d+$/i;
  const isValidJiraId = debouncedJiraId && jiraIdPattern.test(debouncedJiraId.trim());
  
  // Use RTK Query with skip condition for invalid IDs
  const { data: jiraData, isLoading, error } = useFetchJiraQuery(debouncedJiraId?.trim(), {
    skip: !isValidJiraId, // Skip the query if jiraId is invalid
  });

  // Show a hint when user is typing but hasn't entered a valid format yet
  if (jiraId && !isValidJiraId && jiraId.length > 0) {
    return (
      <Paper elevation={1} sx={{ p: 3, backgroundColor: 'info.light', color: 'info.contrastText' }}>
        <Typography variant="body2" component="div">
          Enter a valid Jira ID format (e.g. PROJ-456)
        </Typography>
      </Paper>
    );
  }

  if (!jiraId) {
    return null;
  }

  if (isLoading) {
    return (
      <Typography variant="body2" color="text.secondary" component="div">
        Loading Jira details...
      </Typography>
    );
  }

  if (error) {
    // Handle different types of errors gracefully
    let errorMessage = 'Error loading Jira details';
    
    if (error.status === 404) {
      errorMessage = `Jira issue "${debouncedJiraId.trim()}" not found. Please check the ID and try again.`;
    } else if (error.status === 401) {
      errorMessage = 'Authentication failed. Please check your Jira credentials.';
    } else if (error.status === 403) {
      errorMessage = 'Access denied. You may not have permission to view this Jira issue.';
    } else if (error.data) {
      errorMessage = `Error: ${error.data.message || error.data}`;
    } else if (error.message) {
      errorMessage = `Error: ${error.message}`;
    }
    
    return (
      <Paper elevation={1} sx={{ p: 3, backgroundColor: 'error.light', color: 'error.contrastText' }}>
        <Typography variant="body2" component="div">
          {errorMessage}
        </Typography>
      </Paper>
    );
  }

  if (!jiraData) {
    return null;
  }

  const { fields } = jiraData;

  return (
    <Paper elevation={1} sx={{ p: 3, backgroundColor: 'grey.50' }}>
      <Stack spacing={3}>
        <Box>
          <Typography variant="h3" component="h3">
            Summary:
          </Typography>
          <Typography variant="body1">
            {fields.summary || 'No summary available'}
          </Typography>
        </Box>

        <Box>
          <Typography variant="h3" component="h3">
            Description:
          </Typography>
          <Box
            sx={{
              p: 2,
              backgroundColor: 'background.paper',
              borderRadius: 1,
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Typography
              variant="body1"
              component="div"
              sx={{
                whiteSpace: 'pre-wrap',
                '& br': {
                  display: 'block',
                  content: '""',
                  marginTop: '0.5em',
                },
              }}
              dangerouslySetInnerHTML={{
                __html: fields.description
                  ? fields.description.replace(/\n/g, '<br>')
                  : 'No description available',
              }}
            />
          </Box>
        </Box>

        <AttachmentUpload />
      </Stack>
    </Paper>
  );
};

export default JiraDetails;
