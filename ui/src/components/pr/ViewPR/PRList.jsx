import React from 'react';
import {
  Box,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
  Button,
  CircularProgress,
  Chip,
} from '@mui/material';
import { useGetPullRequestsQuery } from '../../../store/api/prApi';

const PRList = ({ projectKey, repoSlug, onViewDiff, onRequestReview }) => {
  const {
    data: pullRequests,
    isLoading,
    error,
  } = useGetPullRequestsQuery({ projectKey, repoSlug });

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color='error'>
          Error loading pull requests: {error.message || 'Unknown error'}
        </Typography>
      </Box>
    );
  }

  if (!pullRequests?.values?.length) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography color='text.secondary'>No pull requests found</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ mt: 2 }}>
      <Paper sx={{ p: 2 }}>
        <Typography variant='h6' gutterBottom>
          Pull Requests
        </Typography>
        <List>
          {pullRequests.values.map(pr => (
            <ListItem
              key={pr.id}
              sx={{
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1,
                mb: 1,
                flexDirection: { xs: 'column', sm: 'row' },
                alignItems: { xs: 'flex-start', sm: 'center' },
              }}
            >
              <ListItemText
                primary={
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      flexWrap: 'wrap',
                    }}
                  >
                    <Typography variant='subtitle1'>{pr.title}</Typography>
                    <Chip
                      size='small'
                      label={pr.state}
                      color={pr.state === 'OPEN' ? 'primary' : 'default'}
                    />
                  </Box>
                }
                secondary={
                  <>
                    <Typography variant='body2' color='text.secondary'>
                      Created by: {pr.author?.displayName || 'Unknown'}
                    </Typography>
                    <Typography variant='body2' color='text.secondary'>
                      Created: {new Date(pr.createdDate).toLocaleString()}
                    </Typography>
                  </>
                }
              />
              <Box
                sx={{
                  display: 'flex',
                  gap: 1,
                  mt: { xs: 1, sm: 0 },
                  ml: { xs: 0, sm: 2 },
                }}
              >
                <Button
                  variant='outlined'
                  size='small'
                  onClick={() => onViewDiff(pr)}
                >
                  View Diff
                </Button>
                <Button
                  variant='outlined'
                  size='small'
                  onClick={() => onRequestReview(pr)}
                >
                  Request Review
                </Button>
              </Box>
            </ListItem>
          ))}
        </List>
      </Paper>
    </Box>
  );
};

export default PRList;
