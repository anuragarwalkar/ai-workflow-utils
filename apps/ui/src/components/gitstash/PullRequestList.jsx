import React, { useEffect } from 'react';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  List,
  ListItem,
  ListItemAvatar,
  ListItemButton,
  ListItemText,
  Typography,
} from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import {
  ArrowBack as ArrowBackIcon,
  ArrowForward as ArrowForwardIcon,
  Person as PersonIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';
import { useGetPullRequestsQuery } from '../../store/api/prApi';
import { setError, setSelectedPullRequest } from '../../store/slices/prSlice';
import { formatDate, getAuthorName, getStatusColor } from '../../utils/pullRequestUtils';

const PullRequestList = ({ onNext, onPrevious }) => {
  const dispatch = useDispatch();
  const { selectedProject, selectedPullRequest, directPRId } = useSelector(state => state.pr);

  const {
    data: pullRequests,
    error,
    isLoading,
    refetch,
  } = useGetPullRequestsQuery(
    {
      projectKey: selectedProject.projectKey,
      repoSlug: selectedProject.repoSlug,
    },
    {
      skip: !selectedProject.projectKey || !selectedProject.repoSlug,
    }
  );

  useEffect(() => {
    if (error) {
      dispatch(setError(`Failed to fetch pull requests: ${error.data?.error || error.message}`));
    }
  }, [error, dispatch]);

  // Handle direct PR navigation (for cases where we still land on this component)
  useEffect(() => {
    if (directPRId && pullRequests?.values) {
      const targetPR = pullRequests.values.find(pr => pr.id === directPRId);
      if (targetPR) {
        dispatch(setSelectedPullRequest(targetPR));
      }
    }
  }, [directPRId, pullRequests, dispatch]);

  const handleSelectPR = pr => {
    dispatch(setSelectedPullRequest(pr));
  };

  const handleNext = () => {
    if (selectedPullRequest) {
      onNext();
    }
  };

  if (isLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: 300,
        }}
      >
        <CircularProgress size={60} />
        <Typography sx={{ ml: 2 }} variant='h6'>
          Fetching pull requests...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ textAlign: 'center' }}>
        <Alert severity='error' sx={{ mb: 3 }}>
          Failed to fetch pull requests. Please check your project key and repository slug.
        </Alert>
        <Button sx={{ mr: 2 }} variant='outlined' onClick={refetch}>
          Retry
        </Button>
        <Button variant='outlined' onClick={onPrevious}>
          Go Back
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <Typography component='h2' sx={{ mb: 3, textAlign: 'center' }} variant='h5'>
        Pull Requests for {selectedProject.projectKey}/{selectedProject.repoSlug}
      </Typography>

      {pullRequests?.values?.length > 0 && (
        <Card elevation={1} sx={{ mb: 3 }}>
          <CardContent>
            <Typography color='text.secondary' variant='body2'>
              Found {pullRequests?.values?.length || 0} pull request(s). Select one to review its
              changes.
            </Typography>
          </CardContent>
        </Card>
      )}

      {pullRequests?.values?.length === 0 ? (
        <Card elevation={1} sx={{ textAlign: 'center', py: 6 }}>
          <CardContent>
            <Box sx={{ mb: 3 }}>
              <Typography color='text.secondary' sx={{ mb: 2 }} variant='h5'>
                🔍 No Pull Requests Found
              </Typography>
              <Typography color='text.secondary' sx={{ mb: 1 }} variant='body1'>
                There are currently no pull requests in this repository.
              </Typography>
              <Typography color='text.secondary' variant='body2'>
                This could mean:
              </Typography>
            </Box>

            <Box sx={{ mb: 3, textAlign: 'left', maxWidth: 400, mx: 'auto' }}>
              <List dense>
                <ListItem>
                  <ListItemText
                    primary='• All pull requests have been merged or closed'
                    primaryTypographyProps={{
                      variant: 'body2',
                      color: 'text.secondary',
                    }}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary='• No active development in this repository'
                    primaryTypographyProps={{
                      variant: 'body2',
                      color: 'text.secondary',
                    }}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary='• Repository details might be incorrect'
                    primaryTypographyProps={{
                      variant: 'body2',
                      color: 'text.secondary',
                    }}
                  />
                </ListItem>
              </List>
            </Box>

            <Button sx={{ mt: 2 }} variant='outlined' onClick={onPrevious}>
              Try Different Repository
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <List sx={{ mb: 3 }}>
            {pullRequests?.values?.map(pr => (
              <React.Fragment key={pr.id}>
                <ListItem disablePadding>
                  <ListItemButton
                    selected={selectedPullRequest?.id === pr.id}
                    sx={{
                      border: selectedPullRequest?.id === pr.id ? 2 : 1,
                      borderColor: selectedPullRequest?.id === pr.id ? 'primary.main' : 'divider',
                      borderRadius: 1,
                      mb: 1,
                      '&:hover': {
                        borderColor: 'primary.main',
                      },
                    }}
                    onClick={() => handleSelectPR(pr)}
                  >
                    <ListItemAvatar>
                      <Avatar>
                        <PersonIcon />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            mb: 1,
                          }}
                        >
                          <Typography component='span' variant='subtitle1'>
                            {pr.title}
                          </Typography>
                          <Chip
                            color={getStatusColor(pr.state)}
                            label={pr.state}
                            size='small'
                            variant='outlined'
                          />
                        </Box>
                      }
                      secondary={
                        <Box component='span'>
                          <Typography
                            color='text.secondary'
                            component='span'
                            sx={{ mb: 0.5, display: 'block' }}
                            variant='body2'
                          >
                            #{pr.id} • by {getAuthorName(pr)}
                          </Typography>
                          <Box
                            component='span'
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1,
                              mb: 0.5,
                            }}
                          >
                            <ScheduleIcon color='action' fontSize='small' />
                            <Typography color='text.secondary' component='span' variant='caption'>
                              Created: {formatDate(pr.createdDate)}
                            </Typography>
                          </Box>
                          <Box
                            component='span'
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 2,
                              flexWrap: 'wrap',
                            }}
                          >
                            <Typography color='text.secondary' component='span' variant='caption'>
                              From: {pr.fromRef?.displayId || 'Unknown'}
                            </Typography>
                            <Typography color='text.secondary' component='span' variant='caption'>
                              To: {pr.toRef?.displayId || 'Unknown'}
                            </Typography>
                            {pr.reviewers?.length > 0 && (
                              <Typography color='text.secondary' component='span' variant='caption'>
                                Reviewers: {pr.reviewers.length}
                              </Typography>
                            )}
                            {pr.properties?.commentCount > 0 && (
                              <Typography color='text.secondary' component='span' variant='caption'>
                                Comments: {pr.properties.commentCount}
                              </Typography>
                            )}
                            {pr.properties?.openTaskCount > 0 && (
                              <Typography color='text.secondary' component='span' variant='caption'>
                                Tasks: {pr.properties.openTaskCount}
                              </Typography>
                            )}
                          </Box>
                          {pr.description ? (
                            <Typography
                              component='span'
                              sx={{ mt: 1, maxWidth: '80%', display: 'block' }}
                              variant='body2'
                            >
                              {pr.description.length > 100
                                ? `${pr.description.substring(0, 100)}...`
                                : pr.description}
                            </Typography>
                          ) : null}
                        </Box>
                      }
                    />
                  </ListItemButton>
                </ListItem>
                <Divider component='li' variant='inset' />
              </React.Fragment>
            ))}
          </List>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
            <Button startIcon={<ArrowBackIcon />} variant='outlined' onClick={onPrevious}>
              Previous
            </Button>
            <Button
              disabled={!selectedPullRequest}
              endIcon={<ArrowForwardIcon />}
              sx={{
                background: selectedPullRequest
                  ? 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)'
                  : undefined,
                '&:hover': selectedPullRequest
                  ? {
                      background: 'linear-gradient(135deg, #0d7377 0%, #2dd4bf 100%)',
                    }
                  : undefined,
              }}
              variant='contained'
              onClick={handleNext}
            >
              Review Changes
            </Button>
          </Box>
        </>
      )}
    </Box>
  );
};

export default PullRequestList;
