import { Box } from '@mui/material';

export const createTableComponents = isDark => ({
  table: ({ children }) => (
    <Box
      sx={{
        overflowX: 'auto',
        mb: 2,
        width: '100%',
        // Add a subtle border and background for better visibility
        border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
        borderRadius: 1,
        backgroundColor: isDark ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.02)',
      }}
    >
      <Box
        component='table'
        sx={{
          width: '100%',
          minWidth: '600px', // Ensure table has minimum width for proper layout
          borderCollapse: 'collapse',
          fontSize: '0.875rem',
        }}
      >
        {children}
      </Box>
    </Box>
  ),

  thead: ({ children }) => (
    <Box
      component='thead'
      sx={{
        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
      }}
    >
      {children}
    </Box>
  ),

  tbody: ({ children }) => (
    <Box component='tbody'>
      {children}
    </Box>
  ),

  tr: ({ children }) => (
    <Box
      component='tr'
      sx={{
        borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
        '&:hover': {
          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)',
        },
      }}
    >
      {children}
    </Box>
  ),

  th: ({ children }) => (
    <Box
      component='th'
      sx={{
        p: 1.5,
        textAlign: 'left',
        fontWeight: 600,
        fontSize: '0.875rem',
        color: isDark ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.9)',
        minWidth: '120px', // Ensure columns have minimum width
        whiteSpace: 'nowrap', // Prevent header text from wrapping
      }}
    >
      {children}
    </Box>
  ),

  td: ({ children }) => (
    <Box
      component='td'
      sx={{
        p: 1.5,
        fontSize: '0.875rem',
        color: isDark ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.8)',
        minWidth: '120px', // Ensure columns have minimum width
        wordBreak: 'break-word', // Allow long text to wrap within cells
        verticalAlign: 'top',
      }}
    >
      {children}
    </Box>
  ),
});
