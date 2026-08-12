import { Box, Typography } from '@mui/material';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { createTableComponents } from './tableComponents.jsx';

const CodeComponent = ({ className, children, isDark, ...props }) => {
  const inlineStyle = {
    background: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
    padding: '2px 6px',
    borderRadius: '4px',
    fontFamily: 'Monaco, Consolas, monospace',
    fontSize: '0.8rem',
    color: isDark ? '#e4e4e7' : '#27272a',
  };

  return (
    <code className={className} style={inlineStyle} {...props}>
      {children}
    </code>
  );
};

const PreComponent = ({ children, ...props }) => {
  // Check if children is a code element (which is the case for block code in react-markdown)
  if (children && children.props && children.props.node && children.props.node.tagName === 'code') {
    const codeProps = children.props;
    const className = codeProps.className || '';
    const match = /language-(\w+)/.exec(className);
    const text = String(codeProps.children).replace(/\n$/, '');

    return (
      <SyntaxHighlighter
        customStyle={{
          margin: '0.75rem 0',
          borderRadius: '6px',
          backgroundColor: '#1e1e1e', // Always use dark background for block code
          fontSize: '0.8rem',
          padding: '0.75rem',
        }}
        language={match ? match[1] : 'text'}
        PreTag='div'
        style={vscDarkPlus}
      >
        {text}
      </SyntaxHighlighter>
    );
  }
  
  // Fallback for pre elements that don't directly wrap a single code element
  return (
    <pre {...props} style={{ backgroundColor: '#1e1e1e', padding: '0.75rem', borderRadius: '6px', color: '#d4d4d8', overflowX: 'auto' }}>
      {children}
    </pre>
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
    <Box component='strong' sx={{ color: isDark ? 'white' : 'black', fontWeight: 700 }}>
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
  pre: PreComponent,
  ...createBasicComponents(isDark),
  ...createTextComponents(isDark),
  ...createListComponents(isDark),
  ...createTableComponents(isDark),
});
