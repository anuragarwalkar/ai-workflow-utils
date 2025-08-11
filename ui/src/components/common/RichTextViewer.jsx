import React from 'react';
import { Box, Paper } from '@mui/material';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useAppTheme } from '../../theme/useAppTheme';
import { createMarkdownComponents } from './markdownComponents.jsx';

const MotionPaper = motion(Paper);

const RichTextViewer = ({ content, variant = 'paper', sx = {} }) => {
  const { isDark } = useAppTheme();
  const text = content || 'No content available';

  // Create markdown components with theme support
  const components = createMarkdownComponents(isDark);

  const markdownContent = (
    <ReactMarkdown components={components} remarkPlugins={[remarkGfm]}>
      {text}
    </ReactMarkdown>
  );

  if (variant === 'inline') {
    return <Box sx={sx}>{markdownContent}</Box>;
  }

  const paperSx = {
    background: isDark ? 'rgba(45,55,72,0.95)' : 'rgba(255,255,255,0.95)',
    backdropFilter: 'blur(20px)',
    border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)',
    borderRadius: 3,
    ...sx,
  };

  return (
    <MotionPaper
      animate={{ opacity: 1, y: 0 }}
      elevation={0}
      initial={{ opacity: 0, y: 20 }}
      sx={paperSx}
    >
      <Box sx={{ p: 3 }}>{markdownContent}</Box>
    </MotionPaper>
  );
};

export default RichTextViewer;
