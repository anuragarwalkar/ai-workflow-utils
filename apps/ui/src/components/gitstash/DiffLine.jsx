import React, { useState } from 'react';
import { Box, Typography, Tooltip, useTheme } from '@mui/material';
import {
  Add as AddIcon,
  Remove as RemoveIcon,
  AddComment as AddCommentIcon,
  ChatBubble as ChatBubbleIcon,
} from '@mui/icons-material';
import InlineCommentBox from './components/InlineCommentBox';
import InlineCommentThread from './components/InlineCommentThread';

const DiffLine = ({
  line,
  type,
  lineNumber,
  filePath,
  srcPath,
  comments = [],
  isCommentOpen = false,
  onToggleComment,
  onAddComment,
}) => {
  const theme = useTheme();
  const [isHovered, setIsHovered] = useState(false);

  const getLineStyle = (segmentType) => {
    switch (segmentType) {
      case 'ADDED':
        return {
          backgroundColor: 'rgba(46, 160, 67, 0.18)',
          borderLeft: '3px solid #3fb950',
          color: '#e6ffed',
        };
      case 'REMOVED':
        return {
          backgroundColor: 'rgba(248, 81, 73, 0.18)',
          borderLeft: '3px solid #f85149',
          color: '#ffeef0',
        };
      case 'CONTEXT':
      default:
        return {
          backgroundColor: 'transparent',
          borderLeft: '3px solid transparent',
          color: '#d4d4d4',
        };
    }
  };

  const getLineIcon = (segmentType) => {
    switch (segmentType) {
      case 'ADDED':
        return <AddIcon sx={{ color: '#3fb950', fontSize: 14 }} />;
      case 'REMOVED':
        return <RemoveIcon sx={{ color: '#f85149', fontSize: 14 }} />;
      default:
        return null;
    }
  };

  const hasComments = comments && comments.length > 0;

  return (
    <Box sx={{ width: '100%' }}>
      {/* Diff Code Row */}
      <Box
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        sx={{
          display: 'flex',
          alignItems: 'flex-start',
          fontFamily: "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace",
          fontSize: '0.8125rem',
          lineHeight: '20px',
          padding: '1px 4px',
          minHeight: '22px',
          position: 'relative',
          ...getLineStyle(type),
          '&:hover': {
            backgroundColor:
              type === 'ADDED'
                ? 'rgba(46, 160, 67, 0.28)'
                : type === 'REMOVED'
                ? 'rgba(248, 81, 73, 0.28)'
                : 'rgba(255, 255, 255, 0.05)',
          },
        }}
      >
        {/* Line Type Sign (+ / - / blank) */}
        <Box
          sx={{
            width: '18px',
            minWidth: '18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            userSelect: 'none',
          }}
        >
          {getLineIcon(type)}
        </Box>

        {/* Gutter / Line Number with Hover Action */}
        <Box
          onClick={() => lineNumber && onToggleComment && onToggleComment()}
          sx={{
            width: '56px',
            minWidth: '56px',
            color: '#858585',
            marginRight: 1.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            userSelect: 'none',
            cursor: lineNumber ? 'pointer' : 'default',
            px: 0.5,
            borderRadius: 1,
            '&:hover': lineNumber
              ? {
                  backgroundColor: 'rgba(255, 255, 255, 0.12)',
                  color: '#58a6ff',
                }
              : {},
          }}
        >
          <Typography
            variant="caption"
            sx={{
              fontFamily: 'monospace',
              fontSize: '0.75rem',
              color: 'inherit',
              width: '100%',
              textAlign: 'right',
              pr: 0.5,
            }}
          >
            {lineNumber || ''}
          </Typography>

          {/* Inline Comment Trigger Icon on Hover or when Comments exist */}
          {lineNumber && (isHovered || isCommentOpen || hasComments) && (
            <Tooltip
              title={
                hasComments
                  ? `${comments.length} comment${comments.length > 1 ? 's' : ''}`
                  : `Add comment on line ${lineNumber}`
              }
              arrow
            >
              <Box
                component="span"
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 16,
                  height: 16,
                  borderRadius: '3px',
                  backgroundColor: hasComments ? '#1976d2' : '#238636',
                  color: '#ffffff',
                  ml: 0.5,
                  flexShrink: 0,
                  transition: 'transform 0.15s ease',
                  '&:hover': {
                    transform: 'scale(1.15)',
                  },
                }}
              >
                {hasComments ? (
                  <ChatBubbleIcon sx={{ fontSize: 10 }} />
                ) : (
                  <AddCommentIcon sx={{ fontSize: 10 }} />
                )}
              </Box>
            </Tooltip>
          )}
        </Box>

        {/* Code Content */}
        <Box
          sx={{
            flex: 1,
            color: 'inherit',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-all',
            tabSize: 4,
          }}
        >
          {line}
        </Box>
      </Box>

      {/* Existing Comments Thread for this Line */}
      {hasComments && (
        <InlineCommentThread
          comments={comments}
          filePath={filePath}
          lineNumber={lineNumber}
          lineType={type}
          onAddReply={onAddComment}
        />
      )}

      {/* Inline Comment Box */}
      {isCommentOpen && (
        <InlineCommentBox
          filePath={filePath}
          lineNumber={lineNumber}
          lineType={type}
          srcPath={srcPath}
          onCommentAdded={async (data) => {
            await onAddComment(data);
            onToggleComment();
          }}
          onCancel={onToggleComment}
        />
      )}
    </Box>
  );
};

export default DiffLine;
