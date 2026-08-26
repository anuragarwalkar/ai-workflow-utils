import { Box, Typography, useTheme } from '@mui/material';
import { Add as AddIcon, Remove as RemoveIcon } from '@mui/icons-material';

const DiffLine = ({ line, type, lineNumber }) => {
  const theme = useTheme();

  const getLineStyle = segmentType => {
    switch (segmentType) {
      case 'ADDED':
        return {
          backgroundColor: 'rgba(46, 160, 67, 0.15)',
          borderLeft: '3px solid #3fb950',
          color: '#e6ffed',
        };
      case 'REMOVED':
        return {
          backgroundColor: 'rgba(248, 81, 73, 0.15)',
          borderLeft: '3px solid #f85149',
          color: '#ffeef0',
        };
      case 'CONTEXT':
        return {
          backgroundColor: 'transparent',
          borderLeft: '3px solid #4a4a4a',
          color: '#d4d4d4',
        };
      default:
        return {};
    }
  };

  const getLineIcon = segmentType => {
    switch (segmentType) {
      case 'ADDED':
        return <AddIcon sx={{ color: '#3fb950' }} fontSize='small' />;
      case 'REMOVED':
        return <RemoveIcon sx={{ color: '#f85149' }} fontSize='small' />;
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
        ...getLineStyle(type),
      }}
    >
      <Box sx={{ minWidth: '20px', display: 'flex', alignItems: 'center' }}>
        {getLineIcon(type)}
      </Box>
      <Box
        sx={{
          minWidth: '60px',
          color: '#858585',
          marginRight: 2,
        }}
      >
        {lineNumber ? (
          <Typography sx={{ fontFamily: 'monospace' }} variant='caption'>
            {lineNumber}
          </Typography>
        ) : null}
      </Box>
      <Box sx={{ flex: 1, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{line}</Box>
    </Box>
  );
};

export default DiffLine;
