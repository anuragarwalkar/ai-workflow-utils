/* eslint-disable react/no-unescaped-entities */
/* eslint-disable react/jsx-max-depth */
/* eslint-disable max-lines */
import { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  FormControlLabel,
  Grid,
  IconButton,
  LinearProgress,
  Switch,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  AutoAwesome as AutoAwesomeIcon,
  Code as CodeIcon,
  Refresh as RefreshIcon,
  Speed as SpeedIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import {
  useGetPullRequestDiffQuery,
  useGetPullRequestsQuery,
  useReviewPullRequestMutation,
} from '../../store/api/prApi';
import {
  setDiffData,
  setError,
  setReviewData,
  setSelectedPullRequest,
} from '../../store/slices/prSlice';
import { useStreamingPRReview } from '../../hooks/useStreamingPRReview';
import RichTextViewer from '../common/RichTextViewer';
import FileChanges from './FileChanges';

// eslint-disable-next-line max-statements
const PullRequestDiff = ({ onPrevious, onReset }) => {
  const dispatch = useDispatch();
  const { selectedProject, selectedPullRequest, diffData, reviewData, directPRId } = useSelector(
    state => state.pr
  );
  const [expandedFiles, setExpandedFiles] = useState({});

  // Fetch PR list if we have a direct PR ID but no selected PR details
  const { data: pullRequests, isLoading: isPRListLoading } = useGetPullRequestsQuery(
    {
      projectKey: selectedProject.projectKey,
      repoSlug: selectedProject.repoSlug,
    },
    {
      skip:
        !directPRId ||
        !selectedProject.projectKey ||
        !selectedProject.repoSlug ||
        (selectedPullRequest && selectedPullRequest.title),
    }
  );

  // Set the selected PR from the list if we have a direct PR ID
  useEffect(() => {
    if (
      directPRId &&
      pullRequests?.values &&
      (!selectedPullRequest || !selectedPullRequest.title)
    ) {
      const targetPR = pullRequests.values.find(pr => pr.id === directPRId);
      if (targetPR) {
        dispatch(setSelectedPullRequest(targetPR));
      }
    }
  }, [directPRId, pullRequests, selectedPullRequest, dispatch]);

  const {
    data: diff,
    error: diffError,
    isLoading: isDiffLoading,
    refetch: refetchDiff,
  } = useGetPullRequestDiffQuery(
    {
      projectKey: selectedProject.projectKey,
      repoSlug: selectedProject.repoSlug,
      pullRequestId: selectedPullRequest?.id || directPRId,
    },
    {
      skip:
        !selectedProject.projectKey ||
        !selectedProject.repoSlug ||
        (!selectedPullRequest?.id && !directPRId),
    }
  );

  const [reviewPullRequest, { isLoading: isReviewing }] = useReviewPullRequestMutation();

  // Streaming PR review hook
  const {
    startReview: startStreamingReview,
    resetReview: resetStreamingReview,
    isStreaming,
    streamingContent,
    reviewComplete,
    error: streamingError,
  } = useStreamingPRReview();

  // UI state for streaming toggle
  const [useStreaming, setUseStreaming] = useState(true);

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

  const handleFileToggle = fileIndex => {
    setExpandedFiles(prev => ({
      ...prev,
      [fileIndex]: !prev[fileIndex],
    }));
  };

  const handleExpandAll = () => {
    const newExpanded = {};
    diffData?.diffs?.forEach((_, index) => {
      newExpanded[index] = true;
    });
    setExpandedFiles(newExpanded);
  };

  const handleCollapseAll = () => {
    setExpandedFiles({});
  };

  const handleReview = async () => {
    if (!diffData || (!selectedPullRequest?.id && !directPRId)) return;

    // Reset any previous streaming state
    resetStreamingReview();

    try {
      if (useStreaming) {
        // Use streaming review
        const result = await startStreamingReview({
          projectKey: selectedProject.projectKey,
          repoSlug: selectedProject.repoSlug,
          pullRequestId: selectedPullRequest?.id || directPRId,
          diffData,
          prDetails: selectedPullRequest,
        });

        // If streaming completes successfully, update the store
        if (result) {
          dispatch(setReviewData(result));
        }
      } else {
        // Use non-streaming review (original behavior)
        const result = await reviewPullRequest({
          projectKey: selectedProject.projectKey,
          repoSlug: selectedProject.repoSlug,
          pullRequestId: selectedPullRequest?.id || directPRId,
          diffData,
          prDetails: selectedPullRequest,
        }).unwrap();

        dispatch(setReviewData(result));
      }
    } catch (error) {
      dispatch(setError(`Failed to generate review: ${error.data?.error || error.message}`));
    }
  };

  const getDiffStats = () => {
    if (!diffData?.diffs) return { files: 0, additions: 0, deletions: 0 };

    let additions = 0;
    let deletions = 0;

    diffData.diffs.forEach(file => {
      file.hunks?.forEach(hunk => {
        hunk.segments?.forEach(segment => {
          if (segment.type === 'ADDED') {
            additions += segment.lines?.length || 0;
          } else if (segment.type === 'REMOVED') {
            deletions += segment.lines?.length || 0;
          }
        });
      });
    });

    return {
      files: diffData.diffs.length,
      additions,
      deletions,
    };
  };

  if (isDiffLoading || isPRListLoading) {
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
          {isPRListLoading ? 'Loading pull request details...' : 'Loading diff...'}
        </Typography>
      </Box>
    );
  }

  if (diffError) {
    return (
      <Box sx={{ textAlign: 'center' }}>
        <Alert severity='error' sx={{ mb: 3 }}>
          Failed to load diff. Please try again.
        </Alert>
        <Button sx={{ mr: 2 }} variant='outlined' onClick={refetchDiff}>
          Retry
        </Button>
        <Button variant='outlined' onClick={onPrevious}>
          Go Back
        </Button>
      </Box>
    );
  }

  const stats = getDiffStats();

  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
        }}
      >
        <Typography component='h2' variant='h5'>
          Review: {selectedPullRequest?.title || `PR #${directPRId || 'Unknown'}`}
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <FormControlLabel
            control={
              <Switch
                checked={useStreaming}
                size='small'
                onChange={e => setUseStreaming(e.target.checked)}
              />
            }
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <SpeedIcon fontSize='small' />
                <Typography variant='body2'>Streaming</Typography>
              </Box>
            }
          />
          <Button
            disabled={isReviewing || isStreaming || !diffData}
            startIcon={<AutoAwesomeIcon />}
            sx={{
              background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #0d7377 0%, #2dd4bf 100%)',
              },
            }}
            variant='contained'
            onClick={handleReview}
          >
            {isStreaming ? 'Streaming...' : isReviewing ? 'Reviewing...' : 'AI Review'}
          </Button>
          <Button startIcon={<RefreshIcon />} variant='outlined' onClick={refetchDiff}>
            Refresh
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3} sx={{ width: '100%' }}>
        <Grid
          item
          md={reviewData || isStreaming || streamingContent || streamingError ? 6 : 12}
          sx={{ width: '100%' }}
          xs={12}
        >
          <Card elevation={1} sx={{ mb: 3 }}>
            <CardContent>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  mb: 2,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CodeIcon color='primary' />
                  <Typography variant='h6'>Code Changes</Typography>
                  <Chip
                    color='primary'
                    label={`${stats.files} files`}
                    size='small'
                    variant='outlined'
                  />
                  <Chip
                    color='secondary'
                    label={`+${stats.additions} -${stats.deletions}`}
                    size='small'
                    variant='outlined'
                  />
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Tooltip title='Expand All'>
                    <IconButton size='small' onClick={handleExpandAll}>
                      <VisibilityIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title='Collapse All'>
                    <IconButton size='small' onClick={handleCollapseAll}>
                      <VisibilityOffIcon />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>

              {!diffData?.diffs || diffData.diffs.length === 0 ? (
                <Card
                  elevation={0}
                  sx={{
                    textAlign: 'center',
                    py: 4,
                    backgroundColor: 'grey.50',
                  }}
                >
                  <CardContent>
                    <Typography color='text.secondary' sx={{ mb: 2 }} variant='h6'>
                      📄 No Changes Found
                    </Typography>
                    <Typography color='text.secondary' sx={{ mb: 2 }} variant='body2'>
                      This pull request doesn't contain any file changes.
                    </Typography>
                    <Typography color='text.secondary' variant='caption'>
                      This might be a documentation-only PR or the changes haven't been committed
                      yet.
                    </Typography>
                  </CardContent>
                </Card>
              ) : (
                <Box>
                  {diffData.diffs.map((file, fileIndex) => (
                    <FileChanges
                      expanded={expandedFiles[fileIndex] || false}
                      file={file}
                      key={fileIndex}
                      onToggle={() => handleFileToggle(fileIndex)}
                    />
                  ))}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {reviewData || isStreaming || streamingContent || streamingError ? (
          <Grid item md={6} sx={{ width: '100%' }} xs={12}>
            <Card elevation={1} sx={{ mb: 3, width: '100%' }}>
              <CardContent sx={{ width: '100%', '&:last-child': { pb: 2 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <AutoAwesomeIcon color='secondary' />
                  <Typography variant='h6'>AI Review</Typography>
                  {isStreaming ? (
                    <Chip color='primary' label='Streaming...' size='small' variant='outlined' />
                  ) : null}
                  {reviewData && !isStreaming ? (
                    <Chip color='secondary' label='Generated' size='small' variant='outlined' />
                  ) : null}
                  {reviewComplete ? (
                    <Chip color='success' label='Completed' size='small' variant='outlined' />
                  ) : null}
                </Box>

                {isStreaming ? (
                  <Box sx={{ mb: 2 }}>
                    <LinearProgress variant='indeterminate' />
                    <Typography
                      color='text.secondary'
                      sx={{ mt: 1, display: 'block' }}
                      variant='caption'
                    >
                      AI is analyzing your code changes...
                    </Typography>
                  </Box>
                ) : null}

                {streamingError ? (
                  <Alert severity='error' sx={{ mb: 2 }}>
                    Streaming error: {streamingError}
                  </Alert>
                ) : null}

                <RichTextViewer
                  content={
                    isStreaming || streamingContent
                      ? streamingContent +
                        (isStreaming
                          ? ' ▋' // Add cursor while streaming
                          : '')
                      : reviewData?.review || 'No review available'
                  }
                  sx={{
                    backgroundColor: 'grey.50',
                    p: 2,
                    border: '1px solid',
                    borderColor: 'grey.300',
                    borderRadius: 1,
                    width: '100%',
                    minWidth: 0, // Allow content to shrink if needed
                    minHeight: '200px', // Add minimum height to make content area visible
                    overflowWrap: 'break-word',
                    wordWrap: 'break-word',
                    overflowX: 'auto', // Enable horizontal scrolling
                    maxWidth: '100%', // Prevent content from breaking out of container
                  }}
                  variant='inline'
                />

                {reviewComplete?.reviewedAt || (reviewData?.reviewedAt && !isStreaming) ? (
                  <Typography
                    color='text.secondary'
                    sx={{ mt: 1, display: 'block' }}
                    variant='caption'
                  >
                    Generated on{' '}
                    {new Date(reviewComplete?.reviewedAt || reviewData.reviewedAt).toLocaleString()}
                    {reviewComplete?.aiProvider || reviewData?.aiProvider
                      ? ` using ${reviewComplete?.aiProvider || reviewData.aiProvider}`
                      : null}
                  </Typography>
                ) : null}
              </CardContent>
            </Card>
          </Grid>
        ) : null}
      </Grid>

      <Divider sx={{ my: 3 }} />

      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Button startIcon={<ArrowBackIcon />} variant='outlined' onClick={onPrevious}>
          Back to PRs
        </Button>
        <Button variant='outlined' onClick={onReset}>
          Start Over
        </Button>
      </Box>
    </Box>
  );
};

export default PullRequestDiff;
