import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Stack,
} from '@mui/material';
import { useSelector } from 'react-redux';
import { useFetchJiraQuery } from '../../../store/api/jiraApi';
import AttachmentUpload from './AttachmentUpload';

const JiraDetails = () => {
  const { jiraId } = useSelector((state) => state.jira.viewJira);
  
  // Use RTK Query to get cached data
  const { data: jiraData, isLoading, error } = useFetchJiraQuery(jiraId, {
    skip: !jiraId, // Skip the query if no jiraId
  });

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
    return (
      <Typography variant="body2" color="error" component="div">
        Error loading Jira details: {error.data || error.message}
      </Typography>
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
