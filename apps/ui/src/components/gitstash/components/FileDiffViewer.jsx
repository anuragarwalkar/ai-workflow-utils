import React from 'react';
import {
  Box,
  Typography,
  Chip,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Code as CodeIcon,
  ContentCopy as ContentCopyIcon
} from '@mui/icons-material';
import DiffLine from '../DiffLine';
import {
  DiffViewerContainer,
  DiffHeader,
  FilePathText,
  HunkHeader,
  DiffContent,
  EmptyStateContainer
} from './FileDiffViewer.style';

const FileDiffViewer = ({ file, totalFiles, currentIndex, onNavigate }) => {
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
      case 'ADDED': return 'success';
      case 'REMOVED': return 'error';
      case 'MODIFIED': return 'warning';
      default: return 'default';
    }
  };

  const status = getFileStatus();
  const filePath = file.destination?.toString || file.source?.toString || 'Unknown file';

  const handleCopyPath = () => {
    navigator.clipboard.writeText(filePath);
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
                sx={{ color: '#569cd6', fontFamily: 'monospace' }}
                variant="subtitle2"
              >
                {hunk.context ||
                  `@@ -${hunk.sourceLine},${hunk.sourceSpan} +${hunk.destinationLine},${hunk.destinationSpan} @@`}
              </Typography>
            </HunkHeader>
            <Box>
              {hunk.segments?.map((segment, segmentIndex) => (
                <Box key={segmentIndex}>
                  {segment.lines?.map((line, lineIndex) => (
                    <DiffLine
                      key={`${segmentIndex}-${lineIndex}`}
                      line={line.line}
                      lineNumber={line.source || line.destination}
                      type={segment.type}
                    />
                  ))}
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


    </DiffViewerContainer>
  );
};

export default FileDiffViewer;
