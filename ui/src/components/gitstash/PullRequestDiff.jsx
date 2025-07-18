import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  CircularProgress,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Paper,
  Divider,
  Grid,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ArrowBack as ArrowBackIcon,
  AutoAwesome as AutoAwesomeIcon,
  Refresh as RefreshIcon,
  Code as CodeIcon,
} from '@mui/icons-material';
import { useSelector, useDispatch } from 'react-redux';
import { useGetPullRequestDiffQuery, useReviewPullRequestMutation } from '../../store/api/prApi';
import { setDiffData, setReviewData, setError } from '../../store/slices/prSlice';

const PullRequestDiff = ({ onPrevious, onReset }) => {
  const dispatch = useDispatch();
  const { selectedProject, selectedPullRequest, diffData, reviewData } = useSelector((state) => state.pr);
  const [expandedFiles, setExpandedFiles] = useState({});

  const {
    data: diff,
    error: diffError,
    isLoading: isDiffLoading,
    refetch: refetchDiff
  } = useGetPullRequestDiffQuery(
    {
      projectKey: selectedProject.projectKey,
      repoSlug: selectedProject.repoSlug,
      pullRequestId: selectedPullRequest.id,
    },
    {
      skip: !selectedProject.projectKey || !selectedProject.repoSlug || !selectedPullRequest?.id,
    }
  );

  const [reviewPullRequest, { isLoading: isReviewing }] = useReviewPullRequestMutation();

  useEffect(() => {
    if (diff) {
      dispatch(setDiffData(diff));
    }
  }, [diff, dispatch]);

  useEffect(() => {
    if (diffError) {
      dispatch(setError(`Failed to fetch diff: ${diffError.data?.error || diffError.message}`));
    }
  }, [diffError, dispatch]);

  const handleFileToggle = (fileIndex) => {
    setExpandedFiles(prev => ({
      ...prev,
      [fileIndex]: !prev[fileIndex]
    }));
  };

  const handleReview = async () => {
    if (!diffData) return;

    try {
      const result = await reviewPullRequest({
        projectKey: selectedProject.projectKey,
        repoSlug: selectedProject.repoSlug,
        pullRequestId: selectedPullRequest.id,
        diffData,
        prDetails: selectedPullRequest,
      }).unwrap();

      dispatch(setReviewData(result));
    } catch (error) {
      dispatch(setError(`Failed to generate review: ${error.data?.error || error.message}`));
    }
  };

  const renderHunkLines = (lines) => {
    return lines.map((line, index) => (
      <Box key={index} sx={{ fontFamily: 'monospace', fontSize: '0.875rem', mb: 0.5 }}>
        {line.left && line.right ? (
          <Box>
            <Box sx={{ color: 'error.main', backgroundColor: 'error.light', p: 0.5, borderRadius: 0.5, mb: 0.25 }}>
              - {line.left}
            </Box>
            <Box sx={{ color: 'success.main', backgroundColor: 'success.light', p: 0.5, borderRadius: 0.5 }}>
              + {line.right}
            </Box>
          </Box>
        ) : line.left ? (
          <Box sx={{ color: 'error.main', backgroundColor: 'error.light', p: 0.5, borderRadius: 0.5 }}>
            - {line.left}
          </Box>
        ) : line.right ? (
          <Box sx={{ color: 'success.main', backgroundColor: 'success.light', p: 0.5, borderRadius: 0.5 }}>
            + {line.right}
          </Box>
        ) : null}
      </Box>
    ));
  };

  if (isDiffLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ ml: 2 }}>
          Loading diff...
        </Typography>
      </Box>
    );
  }

  if (diffError) {
    return (
      <Box sx={{ textAlign: 'center' }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          Failed to load diff. Please try again.
        </Alert>
        <Button variant="outlined" onClick={refetchDiff} sx={{ mr: 2 }}>
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" component="h2">
          Review: {selectedPullRequest.title}
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="contained"
            startIcon={<AutoAwesomeIcon />}
            onClick={handleReview}
            disabled={isReviewing || !diffData}
            sx={{
              background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #0d7377 0%, #2dd4bf 100%)',
              },
            }}
          >
            {isReviewing ? 'Reviewing...' : 'AI Review'}
          </Button>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={refetchDiff}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={reviewData ? 6 : 12}>
          <Card elevation={1} sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <CodeIcon color="primary" />
                <Typography variant="h6">
                  Code Changes
                </Typography>
                <Chip 
                  label={`${diffData?.values?.length || 0} files`} 
                  size="small" 
                  color="primary" 
                  variant="outlined" 
                />
              </Box>
              
              {diffData?.values?.length === 0 ? (
                <Typography color="text.secondary">
                  No changes found in this pull request.
                </Typography>
              ) : (
                <Box>
                  {diffData?.values?.map((file, fileIndex) => (
                    <Accordion
                      key={fileIndex}
                      expanded={expandedFiles[fileIndex] || false}
                      onChange={() => handleFileToggle(fileIndex)}
                      sx={{ mb: 1 }}
                    >
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="subtitle1" sx={{ fontFamily: 'monospace' }}>
                            {file.srcPath?.toString || 'Unknown file'}
                          </Typography>
                          <Chip 
                            label={`${file.hunks?.length || 0} hunks`} 
                            size="small" 
                            variant="outlined" 
                          />
                        </Box>
                      </AccordionSummary>
                      <AccordionDetails>
                        {file.hunks?.map((hunk, hunkIndex) => (
                          <Paper key={hunkIndex} variant="outlined" sx={{ p: 2, mb: 2 }}>
                            <Typography variant="subtitle2" sx={{ mb: 1, color: 'primary.main' }}>
                              {hunk.section || `Hunk ${hunkIndex + 1}`}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
                              Lines {hunk.oldLine}-{hunk.newLine}
                            </Typography>
                            <Box sx={{ backgroundColor: 'grey.50', p: 1, borderRadius: 1 }}>
                              {renderHunkLines(hunk.lines || [])}
                            </Box>
                          </Paper>
                        ))}
                      </AccordionDetails>
                    </Accordion>
                  ))}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {reviewData && (
          <Grid item xs={12} md={6}>
            <Card elevation={1} sx={{ mb: 3 }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <AutoAwesomeIcon color="secondary" />
                  <Typography variant="h6">
                    AI Review
                  </Typography>
                  <Chip 
                    label="Generated" 
                    size="small" 
                    color="secondary" 
                    variant="outlined" 
                  />
                </Box>
                
                <Paper variant="outlined" sx={{ p: 2, backgroundColor: 'grey.50' }}>
                  <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                    {reviewData.review}
                  </Typography>
                </Paper>
                
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  Generated on {new Date(reviewData.reviewedAt).toLocaleString()}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>

      <Divider sx={{ my: 3 }} />

      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={onPrevious}
        >
          Back to PRs
        </Button>
        <Button
          variant="outlined"
          onClick={onReset}
        >
          Start Over
        </Button>
      </Box>
    </Box>
  );
};

export default PullRequestDiff;
