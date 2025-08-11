import React from 'react';
import { Box, Paper, Typography } from '@mui/material';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useAppTheme } from '../../../../theme/useAppTheme';

const MotionPaper = motion(Paper);

const JiraDescriptionSimple = ({ jiraData }) => {
  const { isDark } = useAppTheme();

  const description = jiraData?.fields?.description || 'No description available';

  const MarkdownComponents = {
    code({ inline, className, children, ...props }) {
      const match = /language-(\w+)/.exec(className || '');
      return !inline && match ? (
        <SyntaxHighlighter
          customStyle={{
            margin: '1rem 0',
            borderRadius: '8px',
            background: 'rgba(0, 0, 0, 0.5)',
          }}
          language={match[1]}
          PreTag='div'
          style={vscDarkPlus}
          {...props}
        >
          {String(children).replace(/\n$/, '')}
        </SyntaxHighlighter>
      ) : (
        <code
          className={className}
          style={{
            background: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
            padding: '2px 6px',
            borderRadius: '4px',
            fontFamily: 'Monaco, Consolas, monospace',
            color: '#4ecdc4',
          }}
          {...props}
        >
          {children}
        </code>
      );
    },
    h1: ({ children }) => (
      <Typography
        sx={{
          mt: 3,
          mb: 2,
          fontWeight: 700,
          color: isDark ? 'white' : 'black',
        }}
        variant='h4'
      >
        {children}
      </Typography>
    ),
    h2: ({ children }) => (
      <Typography
        sx={{
          mt: 2,
          mb: 1.5,
          fontWeight: 600,
          color: isDark ? 'white' : 'black',
        }}
        variant='h5'
      >
        {children}
      </Typography>
    ),
    h3: ({ children }) => (
      <Typography
        sx={{
          mt: 2,
          mb: 1,
          fontWeight: 600,
          color: isDark ? 'white' : 'black',
        }}
        variant='h6'
      >
        {children}
      </Typography>
    ),
    p: ({ children }) => (
      <Typography
        sx={{
          mb: 2,
          lineHeight: 1.7,
          color: isDark ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.8)',
        }}
        variant='body1'
      >
        {children}
      </Typography>
    ),
    strong: ({ children }) => (
      <Box component='strong' sx={{ color: isDark ? 'white' : 'black', fontWeight: 700 }}>
        {children}
      </Box>
    ),
    em: ({ children }) => (
      <Box component='em' sx={{ color: '#4ecdc4', fontStyle: 'italic' }}>
        {children}
      </Box>
    ),
    ul: ({ children }) => (
      <Box
        component='ul'
        sx={{
          pl: 3,
          mb: 2,
          color: isDark ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.8)',
        }}
      >
        {children}
      </Box>
    ),
    ol: ({ children }) => (
      <Box
        component='ol'
        sx={{
          pl: 3,
          mb: 2,
          color: isDark ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.8)',
        }}
      >
        {children}
      </Box>
    ),
    li: ({ children }) => (
      <Typography
        component='li'
        sx={{
          mb: 0.5,
          color: isDark ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.8)',
        }}
        variant='body1'
      >
        {children}
      </Typography>
    ),
    blockquote: ({ children }) => (
      <Box
        sx={{
          borderLeft: '4px solid #667eea',
          pl: 2,
          py: 1,
          my: 2,
          backgroundColor: 'rgba(102, 126, 234, 0.1)',
          borderRadius: '0 8px 8px 0',
          color: 'rgba(255, 255, 255, 0.9)',
        }}
      >
        {children}
      </Box>
    ),
  };

  return (
    <MotionPaper
      animate={{ opacity: 1, y: 0 }}
      elevation={0}
      initial={{ opacity: 0, y: 20 }}
      sx={{
        background: isDark ? 'rgba(45, 55, 72, 0.95)' : 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(20px)',
        border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
        borderRadius: 3,
        overflow: 'hidden',
      }}
      transition={{ duration: 0.5 }}
    >
      <Box sx={{ p: 3 }}>
        <ReactMarkdown components={MarkdownComponents} remarkPlugins={[remarkGfm]}>
          {description}
        </ReactMarkdown>
      </Box>
    </MotionPaper>
  );
};

export default JiraDescriptionSimple;
