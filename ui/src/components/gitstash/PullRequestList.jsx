import React, { useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Chip,
  CircularProgress,
  Alert,
  Divider,
} from '@mui/material';
import { useSelector, useDispatch } from 'react-redux';
import {
  ArrowBack as ArrowBackIcon,
  ArrowForward as ArrowForwardIcon,
  Person as PersonIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';
import { useGetPullRequestsQuery } from '../../store/api/prApi';
import { setSelectedPullRequest, setError } from '../../store/slices/prSlice';

const PullRequestList = ({ onNext, onPrevious }) => {
  const dispatch = useDispatch();
  const { selectedProject, selectedPullRequest } = useSelector((state) => state.pr);
  
  const {
    data: pullRequests,
    error,
    isLoading,
    refetch
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

  const handleSelectPR = (pr) => {
    dispatch(setSelectedPullRequest(pr));
  };

  const handleNext = () => {
    if (selectedPullRequest) {
      onNext();
    }
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (state) => {
    switch (state) {
      case 'OPEN':
        return 'success';
      case 'MERGED':
        return 'primary';
      case 'DECLINED':
        return 'error';
      default:
        return 'default';
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ ml: 2 }}>
          Fetching pull requests...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ textAlign: 'center' }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          Failed to fetch pull requests. Please check your project key and repository slug.
        </Alert>
        <Button variant="outlined" onClick={refetch} sx={{ mr: 2 }}>
          Retry
        </Button>
        <Button variant="outlined" onClick={onPrevious}>
          Go Back
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h5" component="h2" sx={{ mb: 3, textAlign: 'center' }}>
        Pull Requests for {selectedProject.projectKey}/{selectedProject.repoSlug}
      </Typography>

      {pullRequests?.values?.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="h6" color="text.secondary">
            No pull requests found
          </Typography>
          <Button variant="outlined" onClick={onPrevious} sx={{ mt: 2 }}>
            Try Different Repository
          </Button>
        </Box>
      ) : (
        <>
          <Card elevation={1} sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="body2" color="text.secondary">
                Found {pullRequests?.values?.length || 0} pull request(s). 
                Select one to review its changes.
              </Typography>
            </CardContent>
          </Card>

          <List sx={{ mb: 3 }}>
            {pullRequests?.values?.map((pr) => (
              <React.Fragment key={pr.id}>
                <ListItem disablePadding>
                  <ListItemButton
                    selected={selectedPullRequest?.id === pr.id}
                    onClick={() => handleSelectPR(pr)}
                    sx={{
                      border: selectedPullRequest?.id === pr.id ? 2 : 1,
                      borderColor: selectedPullRequest?.id === pr.id ? 'primary.main' : 'divider',
                      borderRadius: 1,
                      mb: 1,
                      '&:hover': {
                        borderColor: 'primary.main',
                      },
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar>
                        <PersonIcon />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <Typography variant="subtitle1" component="span">
                            {pr.title}
                          </Typography>
                          <Chip
                            label={pr.state}
                            size="small"
                            color={getStatusColor(pr.state)}
                            variant="outlined"
                          />
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                            #{pr.id} • by {pr.author?.displayName || 'Unknown'}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <ScheduleIcon fontSize="small" color="action" />
                            <Typography variant="caption" color="text.secondary">
                              Created: {formatDate(pr.createdDate)}
                            </Typography>
                          </Box>
                          {pr.description && (
                            <Typography variant="body2" sx={{ mt: 1, maxWidth: '80%' }}>
                              {pr.description.length > 100 
                                ? `${pr.description.substring(0, 100)}...` 
                                : pr.description
                              }
                            </Typography>
                          )}
                        </Box>
                      }
                    />
                  </ListItemButton>
                </ListItem>
                <Divider variant="inset" component="li" />
              </React.Fragment>
            ))}
          </List>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
            <Button
              variant="outlined"
              startIcon={<ArrowBackIcon />}
              onClick={onPrevious}
            >
              Previous
            </Button>
            <Button
              variant="contained"
              endIcon={<ArrowForwardIcon />}
              onClick={handleNext}
              disabled={!selectedPullRequest}
              sx={{
                background: selectedPullRequest 
                  ? 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)'
                  : undefined,
                '&:hover': selectedPullRequest ? {
                  background: 'linear-gradient(135deg, #0d7377 0%, #2dd4bf 100%)',
                } : undefined,
              }}
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
