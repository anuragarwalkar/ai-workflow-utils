import React, { useState } from 'react';
import {
  Box,
  Typography,
  Chip,
  IconButton,
  Tooltip,
  Snackbar,
  Alert,
} from '@mui/material';
import {
  Code as CodeIcon,
  ContentCopy as ContentCopyIcon,
  ChatBubbleOutline as CommentIcon,
} from '@mui/icons-material';
import DiffLine from '../DiffLine';
import {
  DiffViewerContainer,
  DiffHeader,
  FilePathText,
  HunkHeader,
  DiffContent,
  EmptyStateContainer,
} from './FileDiffViewer.style';

const FileDiffViewer = ({
  file,
  totalFiles,
  currentIndex,
  onNavigate,
  projectKey,
  repoSlug,
  pullRequestId,
  comments = [],
  onAddComment,
}) => {
  const [openCommentKey, setOpenCommentKey] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  if (!file) {
    return (
      <EmptyStateContainer>
        <CodeIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
        <Typography variant="h6" sx={{ color: '#d4d4d4' }}>
          No File Selected
        </Typography>
        <Typography variant="body2" sx={{ color: '#858585' }}>
          Select a file from the sidebar to view its changes
        </Typography>
      </EmptyStateContainer>
    );
  }

  const getFileStatus = () => {
    if (!file.source && file.destination) return 'ADDED';
    if (file.source && !file.destination) return 'REMOVED';
    return 'MODIFIED';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'ADDED':
        return 'success';
      case 'REMOVED':
        return 'error';
      case 'MODIFIED':
        return 'warning';
      default:
        return 'default';
    }
  };

  const status = getFileStatus();
  const filePath = file.destination?.toString || file.source?.toString || 'Unknown file';
  const srcPath = file.source?.toString || filePath;

  const handleCopyPath = () => {
    navigator.clipboard.writeText(filePath);
    setSnackbar({
      open: true,
      message: 'File path copied to clipboard',
      severity: 'info',
    });
  };

  // Find comments anchored to a specific line for this file
  const getLineComments = (lineNum) => {
    if (!lineNum || !comments || comments.length === 0) return [];
    return comments.filter((c) => {
      const anchor = c.anchor;
      if (!anchor) return false;
      const matchesPath =
        anchor.path === filePath ||
        anchor.srcPath === filePath ||
        anchor.path === srcPath ||
        anchor.srcPath === srcPath;
      return matchesPath && anchor.line === lineNum;
    });
  };

  const handleToggleComment = (key) => {
    setOpenCommentKey((prev) => (prev === key ? null : key));
  };

  const handleAddLineComment = async (commentPayload) => {
    if (onAddComment) {
      try {
        await onAddComment(commentPayload);
        setSnackbar({
          open: true,
          message: `Comment added to line ${commentPayload.anchor?.line} on ${filePath.split('/').pop()}`,
          severity: 'success',
        });
      } catch (err) {
        setSnackbar({
          open: true,
          message: err?.data?.message || err?.message || 'Failed to post comment',
          severity: 'error',
        });
        throw err;
      }
    }
  };

  return (
    <DiffViewerContainer variant="outlined">
      <DiffHeader>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, overflow: 'hidden' }}>
          <Chip
            label={status}
            size="small"
            color={getStatusColor(status)}
            variant="outlined"
            sx={{ fontWeight: 'bold' }}
          />
          <FilePathText noWrap title={filePath}>
            {filePath}
          </FilePathText>
          <Tooltip title="Copy path">
            <IconButton size="small" onClick={handleCopyPath} sx={{ ml: 1 }}>
              <ContentCopyIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Chip label={`${file.hunks?.length || 0} hunks`} size="small" variant="filled" />
        </Box>
      </DiffHeader>

      <DiffContent>
        {file.hunks?.map((hunk, hunkIndex) => (
          <Box key={hunkIndex} sx={{ mb: 2 }}>
            <HunkHeader>
              <Typography
                sx={{ color: '#569cd6', fontFamily: 'monospace', fontSize: '0.8rem' }}
                variant="subtitle2"
              >
                {hunk.context ||
                  `@@ -${hunk.sourceLine},${hunk.sourceSpan} +${hunk.destinationLine},${hunk.destinationSpan} @@`}
              </Typography>
            </HunkHeader>
            <Box>
              {hunk.segments?.map((segment, segmentIndex) => (
                <Box key={segmentIndex}>
                  {segment.lines?.map((line, lineIndex) => {
                    const lineNum = line.destination || line.source;
                    const lineKey = `${hunkIndex}-${segmentIndex}-${lineIndex}-${lineNum}`;
                    const lineComments = getLineComments(lineNum);

                    return (
                      <DiffLine
                        key={lineKey}
                        line={line.line}
                        lineNumber={lineNum}
                        type={segment.type}
                        filePath={filePath}
                        srcPath={srcPath}
                        comments={lineComments}
                        isCommentOpen={openCommentKey === lineKey}
                        onToggleComment={() => handleToggleComment(lineKey)}
                        onAddComment={handleAddLineComment}
                      />
                    );
                  })}
                </Box>
              ))}
            </Box>
          </Box>
        ))}

        {(!file.hunks || file.hunks.length === 0) && (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography sx={{ color: '#858585' }}>No content changes visible.</Typography>
          </Box>
        )}
      </DiffContent>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </DiffViewerContainer>
  );
};

export default FileDiffViewer;
