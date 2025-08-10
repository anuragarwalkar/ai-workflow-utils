import { Box, Typography } from '@mui/material';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

const CodeComponent = ({ inline, className, children, isDark }) => {
  const match = /language-(\w+)/.exec(className || '');

  if (!inline && match) {
    return (
      <SyntaxHighlighter
        customStyle={{
          margin: '0.75rem 0', // Smaller margins
          borderRadius: '6px', // Smaller radius
          background: 'rgba(0, 0, 0, 0.5)',
          fontSize: '0.8rem', // Smaller font size
          padding: '0.75rem', // Smaller padding
        }}
        language={match[1]}
        PreTag='div'
        style={vscDarkPlus}
      >
        {String(children).replace(/\n$/, '')}
      </SyntaxHighlighter>
    );
  }

  const inlineStyle = {
    background: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
    padding: '1px 4px', // Smaller padding
    borderRadius: '3px', // Smaller radius
    fontFamily: 'Monaco, Consolas, monospace',
    fontSize: '0.8rem', // Smaller font size
    color: isDark ? '#d4d4d8' : '#71717a', // Neutral gray colors
  };

  return (
    <code className={className} style={inlineStyle}>
      {children}
    </code>
  );
};

const createBasicComponents = isDark => ({
  h1: ({ children }) => (
    <Typography
      sx={{
        mt: 2,
        mb: 1.5,
        fontWeight: 700,
        fontSize: '1.25rem', // Smaller than default h4
        color: isDark ? 'white' : 'black',
      }}
      variant='h6'
    >
      {children}
    </Typography>
  ),

  h2: ({ children }) => (
    <Typography
      sx={{
        mt: 1.5,
        mb: 1,
        fontWeight: 600,
        fontSize: '1.125rem', // Smaller than default h5
        color: isDark ? 'white' : 'black',
      }}
      variant='subtitle1'
    >
      {children}
    </Typography>
  ),

  h3: ({ children }) => (
    <Typography
      sx={{
        mt: 1.5,
        mb: 0.75,
        fontWeight: 600,
        fontSize: '1rem', // Same as body text but bold
        color: isDark ? 'white' : 'black',
      }}
      variant='subtitle2'
    >
      {children}
    </Typography>
  ),

  p: ({ children }) => (
    <Typography
      sx={{
        mb: 1.5, // Reduced from 2
        lineHeight: 1.6, // Slightly tighter
        fontSize: '0.875rem', // Smaller body text
        color: isDark ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.8)',
      }}
      variant='body2'
    >
      {children}
    </Typography>
  ),
});

const createTextComponents = isDark => ({
  strong: ({ children }) => (
    <Box
      component='strong'
      sx={{ color: isDark ? 'white' : 'black', fontWeight: 700 }}
    >
      {children}
    </Box>
  ),

  em: ({ children }) => (
    <Box
      component='em'
      sx={{
        color: isDark ? '#a1a1aa' : '#52525b', // Neutral gray for emphasis
        fontStyle: 'italic',
      }}
    >
      {children}
    </Box>
  ),

  a: ({ children, href }) => (
    <Box
      component='a'
      href={href}
      rel='noopener noreferrer'
      sx={{
        color: '#667eea',
        textDecoration: 'none',
        '&:hover': {
          textDecoration: 'underline',
          color: '#764ba2',
        },
        transition: 'color 0.2s ease',
      }}
      target='_blank'
    >
      {children}
    </Box>
  ),
});

const createListComponents = isDark => ({
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
        mb: 0.25, // Tighter spacing
        fontSize: '0.875rem', // Smaller text
        color: isDark ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.8)',
      }}
      variant='body2'
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
        color: isDark ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.8)',
      }}
    >
      {children}
    </Box>
  ),
});

export const createMarkdownComponents = isDark => ({
  code: props => <CodeComponent {...props} isDark={isDark} />,
  ...createBasicComponents(isDark),
  ...createTextComponents(isDark),
  ...createListComponents(isDark),
});
