import React from 'react';
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  Paper,
  Typography,
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
        <Typography gutterBottom variant='h6'>
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
                      color={pr.state === 'OPEN' ? 'primary' : 'default'}
                      label={pr.state}
                      size='small'
                    />
                  </Box>
                }
                secondary={
                  <>
                    <Typography color='text.secondary' variant='body2'>
                      Created by: {pr.author?.displayName || 'Unknown'}
                    </Typography>
                    <Typography color='text.secondary' variant='body2'>
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
                  size='small'
                  variant='outlined'
                  onClick={() => onViewDiff(pr)}
                >
                  View Diff
                </Button>
                <Button
                  size='small'
                  variant='outlined'
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
