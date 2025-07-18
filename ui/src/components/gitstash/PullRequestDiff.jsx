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
  useTheme,
  Tooltip,
  IconButton,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ArrowBack as ArrowBackIcon,
  AutoAwesome as AutoAwesomeIcon,
  Refresh as RefreshIcon,
  Code as CodeIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
  FileCopy as FileCopyIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
} from '@mui/icons-material';
import { useSelector, useDispatch } from 'react-redux';
import { useGetPullRequestDiffQuery, useReviewPullRequestMutation, useGetPullRequestsQuery } from '../../store/api/prApi';
import { setDiffData, setReviewData, setError, setSelectedPullRequest } from '../../store/slices/prSlice';

const DiffLine = ({ line, type, lineNumber }) => {
  const theme = useTheme();
  
  const getLineStyle = (segmentType) => {
    switch (segmentType) {
      case 'ADDED':
        return {
          backgroundColor: theme.palette.success.light + '20',
          borderLeft: `3px solid ${theme.palette.success.main}`,
          color: theme.palette.success.dark
        };
      case 'REMOVED':
        return {
          backgroundColor: theme.palette.error.light + '20',
          borderLeft: `3px solid ${theme.palette.error.main}`,
          color: theme.palette.error.dark
        };
      case 'CONTEXT':
        return {
          backgroundColor: theme.palette.grey[50],
          borderLeft: `3px solid ${theme.palette.grey[300]}`,
          color: theme.palette.text.primary
        };
      default:
        return {};
    }
  };

  const getLineIcon = (segmentType) => {
    switch (segmentType) {
      case 'ADDED':
        return <AddIcon fontSize="small" color="success" />;
      case 'REMOVED':
        return <RemoveIcon fontSize="small" color="error" />;
      default:
        return null;
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'flex-start',
        fontFamily: 'monospace',
        fontSize: '0.875rem',
        padding: '2px 8px',
        minHeight: '20px',
        ...getLineStyle(type)
      }}
    >
      <Box sx={{ minWidth: '20px', display: 'flex', alignItems: 'center' }}>
        {getLineIcon(type)}
      </Box>
      <Box sx={{ minWidth: '60px', color: theme.palette.text.secondary, marginRight: 2 }}>
        {lineNumber && (
          <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
            {lineNumber}
          </Typography>
        )}
      </Box>
      <Box sx={{ flex: 1, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
        {line}
      </Box>
    </Box>
  );
};

const FileChanges = ({ file, expanded, onToggle }) => {
  const theme = useTheme();
  
  const getFileStatus = () => {
    if (!file.source && file.destination) return 'ADDED';
    if (file.source && !file.destination) return 'REMOVED';
    return 'MODIFIED';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'ADDED': return 'success';
      case 'REMOVED': return 'error';
      case 'MODIFIED': return 'warning';
      default: return 'default';
    }
  };

  const status = getFileStatus();
  const fileName = file.destination?.toString || file.source?.toString || 'Unknown file';

  return (
    <Accordion
      expanded={expanded}
      onChange={onToggle}
      sx={{ mb: 1, border: `1px solid ${theme.palette.divider}` }}
    >
      <AccordionSummary 
        expandIcon={<ExpandMoreIcon />}
        sx={{ 
          backgroundColor: theme.palette.grey[50],
          '&:hover': { backgroundColor: theme.palette.grey[100] }
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
          <Typography 
            variant="subtitle1" 
            sx={{ 
              fontFamily: 'monospace', 
              flex: 1,
              wordBreak: 'break-all',
              whiteSpace: 'normal',
              lineHeight: 1.2,
              minWidth: 0
            }}
          >
            {fileName}
          </Typography>
          <Chip 
            label={status} 
            size="small" 
            color={getStatusColor(status)}
            variant="outlined" 
          />
          <Chip 
            label={`${file.hunks?.length || 0} hunks`} 
            size="small" 
            variant="outlined" 
          />
        </Box>
      </AccordionSummary>
      <AccordionDetails sx={{ p: 0 }}>
        {file.hunks?.map((hunk, hunkIndex) => (
          <Box key={hunkIndex} sx={{ mb: 2 }}>
            <Box sx={{ 
              backgroundColor: theme.palette.primary.light + '20', 
              p: 1, 
              borderBottom: `1px solid ${theme.palette.divider}` 
            }}>
              <Typography variant="subtitle2" sx={{ color: 'primary.main', fontFamily: 'monospace' }}>
                {hunk.context || `@@ -${hunk.sourceLine},${hunk.sourceSpan} +${hunk.destinationLine},${hunk.destinationSpan} @@`}
              </Typography>
            </Box>
            <Box>
              {hunk.segments?.map((segment, segmentIndex) => (
                <Box key={segmentIndex}>
                  {segment.lines?.map((line, lineIndex) => (
                    <DiffLine
                      key={`${segmentIndex}-${lineIndex}`}
                      line={line.line}
                      type={segment.type}
                      lineNumber={line.source || line.destination}
                    />
                  ))}
                </Box>
              ))}
            </Box>
          </Box>
        ))}
      </AccordionDetails>
    </Accordion>
  );
};

const PullRequestDiff = ({ onPrevious, onReset }) => {
  const dispatch = useDispatch();
  const { selectedProject, selectedPullRequest, diffData, reviewData, directPRId } = useSelector((state) => state.pr);
  const [expandedFiles, setExpandedFiles] = useState({});

  // Fetch PR list if we have a direct PR ID but no selected PR details
  const {
    data: pullRequests,
    isLoading: isPRListLoading
  } = useGetPullRequestsQuery(
    {
      projectKey: selectedProject.projectKey,
      repoSlug: selectedProject.repoSlug,
    },
    {
      skip: !directPRId || !selectedProject.projectKey || !selectedProject.repoSlug || (selectedPullRequest && selectedPullRequest.title),
    }
  );

  // Set the selected PR from the list if we have a direct PR ID
  useEffect(() => {
    if (directPRId && pullRequests?.values && (!selectedPullRequest || !selectedPullRequest.title)) {
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
    refetch: refetchDiff
  } = useGetPullRequestDiffQuery(
    {
      projectKey: selectedProject.projectKey,
      repoSlug: selectedProject.repoSlug,
      pullRequestId: selectedPullRequest?.id || directPRId,
    },
    {
      skip: !selectedProject.projectKey || !selectedProject.repoSlug || (!selectedPullRequest?.id && !directPRId),
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

    try {
      const result = await reviewPullRequest({
        projectKey: selectedProject.projectKey,
        repoSlug: selectedProject.repoSlug,
        pullRequestId: selectedPullRequest?.id || directPRId,
        diffData,
        prDetails: selectedPullRequest,
      }).unwrap();

      dispatch(setReviewData(result));
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
      deletions
    };
  };

  if (isDiffLoading || isPRListLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ ml: 2 }}>
          {isPRListLoading ? 'Loading pull request details...' : 'Loading diff...'}
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

  const stats = getDiffStats();

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" component="h2">
          Review: {selectedPullRequest?.title || `PR #${directPRId || 'Unknown'}`}
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
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CodeIcon color="primary" />
                  <Typography variant="h6">
                    Code Changes
                  </Typography>
                  <Chip 
                    label={`${stats.files} files`} 
                    size="small" 
                    color="primary" 
                    variant="outlined" 
                  />
                  <Chip 
                    label={`+${stats.additions} -${stats.deletions}`} 
                    size="small" 
                    color="secondary" 
                    variant="outlined" 
                  />
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Tooltip title="Expand All">
                    <IconButton size="small" onClick={handleExpandAll}>
                      <VisibilityIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Collapse All">
                    <IconButton size="small" onClick={handleCollapseAll}>
                      <VisibilityOffIcon />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>
              
              {!diffData?.diffs || diffData.diffs.length === 0 ? (
                <Card elevation={0} sx={{ textAlign: 'center', py: 4, backgroundColor: 'grey.50' }}>
                  <CardContent>
                    <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
                      📄 No Changes Found
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      This pull request doesn't contain any file changes.
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      This might be a documentation-only PR or the changes haven't been committed yet.
                    </Typography>
                  </CardContent>
                </Card>
              ) : (
                <Box>
                  {diffData.diffs.map((file, fileIndex) => (
                    <FileChanges
                      key={fileIndex}
                      file={file}
                      expanded={expandedFiles[fileIndex] || false}
                      onToggle={() => handleFileToggle(fileIndex)}
                    />
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
