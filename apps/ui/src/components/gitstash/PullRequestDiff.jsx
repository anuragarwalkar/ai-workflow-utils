/* eslint-disable react/no-unescaped-entities */
/* eslint-disable react/jsx-max-depth */
/* eslint-disable max-lines */
import { useEffect, useState, useMemo } from 'react';
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
  LinearProgress,
  Switch,
  Tabs,
  Tab,
  Typography,
  Portal,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  AutoAwesome as AutoAwesomeIcon,
  Refresh as RefreshIcon,
  Speed as SpeedIcon,
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import {
  useGetPullRequestDiffQuery,
  useGetPullRequestsQuery,
  useReviewPullRequestMutation,
  useGetPRActivitiesQuery,
  useAddPRCommentMutation,
} from '../../store/api/prApi';
import {
  setDiffData,
  setError,
  setReviewData,
  setSelectedPullRequest,
} from '../../store/slices/prSlice';
import { useStreamingPRReview } from '../../hooks/useStreamingPRReview';
import RichTextViewer from '../common/RichTextViewer';
import FileTreeSidebar from './components/FileTreeSidebar';
import FileDiffViewer from './components/FileDiffViewer';
import ManualCommentModal from './components/ManualCommentModal';
import { Fab } from '@mui/material';
import { AddComment as AddCommentIcon } from '@mui/icons-material';

// eslint-disable-next-line max-statements
const PullRequestDiff = ({ onPrevious, onReset }) => {
  const dispatch = useDispatch();
  const { selectedProject, selectedPullRequest, diffData, reviewData, directPRId } = useSelector(
    state => state.pr
  );
  const [selectedFileIndex, setSelectedFileIndex] = useState(0);
  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
  const [localComments, setLocalComments] = useState([]);

  const prId = selectedPullRequest?.id || directPRId;
  const projectKey = selectedProject?.projectKey;
  const repoSlug = selectedProject?.repoSlug;

  // Fetch PR activities to extract line comments
  const { data: activitiesData, refetch: refetchActivities } = useGetPRActivitiesQuery(
    {
      projectKey,
      repoSlug,
      pullRequestId: prId,
    },
    {
      skip: !projectKey || !repoSlug || !prId,
    }
  );

  const [addPRComment] = useAddPRCommentMutation();

  // Extract inline comments from activities
  const prComments = useMemo(() => {
    const fetched = [];
    if (activitiesData?.values) {
      activitiesData.values.forEach((act) => {
        if (act.action === 'COMMENTED' && act.comment) {
          fetched.push(act.comment);
        }
      });
    }
    return [...fetched, ...localComments];
  }, [activitiesData, localComments]);

  const handleAddInlineComment = async ({ commentText, anchor, parent }) => {
    const result = await addPRComment({
      projectKey,
      repoSlug,
      pullRequestId: prId,
      commentText,
      anchor,
      parent,
    }).unwrap();

    if (result) {
      setLocalComments((prev) => [...prev, result]);
    }
    refetchActivities();
    return result;
  };

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

  const handleNavigateFile = (direction) => {
    if (!diffData?.diffs) return;
    const newIndex = selectedFileIndex + direction;
    if (newIndex >= 0 && newIndex < diffData.diffs.length) {
      setSelectedFileIndex(newIndex);
    }
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

      {/* Main Split Layout */}
      <Box sx={{ display: 'flex', gap: 3, mb: 3, height: 'calc(100vh - 300px)', minHeight: '500px' }}>
        {/* Left Sidebar */}
        <FileTreeSidebar 
          diffData={diffData} 
          selectedFileIndex={selectedFileIndex}
          onSelectFile={setSelectedFileIndex}
        />

        {/* Right Diff Viewer */}
        <FileDiffViewer 
          file={diffData?.diffs?.[selectedFileIndex]}
          totalFiles={diffData?.diffs?.length || 0}
          currentIndex={selectedFileIndex}
          onNavigate={handleNavigateFile}
          projectKey={projectKey}
          repoSlug={repoSlug}
          pullRequestId={prId}
          comments={prComments}
          onAddComment={handleAddInlineComment}
        />
      </Box>

      {/* AI Review Panel (Full Width Below) */}
      {(reviewData || isStreaming || streamingContent || streamingError) ? (
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

            {(reviewData || streamingContent || reviewComplete) && (
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
            )}

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
      ) : null}

      <Divider sx={{ my: 3 }} />

      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Button startIcon={<ArrowBackIcon />} variant='outlined' onClick={onPrevious}>
          Back to PRs
        </Button>
        <Button variant='outlined' onClick={onReset}>
          Start Over
        </Button>
      </Box>

      {/* Floating Action Button */}
      <Portal>
        <Fab
          color="primary"
          aria-label="add comment"
          onClick={() => setIsCommentModalOpen(true)}
          sx={{
            position: 'fixed',
            bottom: 32,
            right: 32,
            zIndex: 1000,
          }}
        >
          <AddCommentIcon />
        </Fab>
      </Portal>

      <ManualCommentModal 
        open={isCommentModalOpen}
        onClose={() => setIsCommentModalOpen(false)}
        projectKey={selectedProject?.projectKey}
        repoSlug={selectedProject?.repoSlug}
        pullRequestId={selectedPullRequest?.id || directPRId}
      />
    </Box>
  );
};

export default PullRequestDiff;
