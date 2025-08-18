import { Box, Typography, useTheme } from '@mui/material';
import { Add as AddIcon, Remove as RemoveIcon } from '@mui/icons-material';

const DiffLine = ({ line, type, lineNumber }) => {
  const theme = useTheme();

  const getLineStyle = segmentType => {
    switch (segmentType) {
      case 'ADDED':
        return {
          backgroundColor: `${theme.palette.success.light}20`,
          borderLeft: `3px solid ${theme.palette.success.main}`,
          color: theme.palette.success.dark,
        };
      case 'REMOVED':
        return {
          backgroundColor: `${theme.palette.error.light}20`,
          borderLeft: `3px solid ${theme.palette.error.main}`,
          color: theme.palette.error.dark,
        };
      case 'CONTEXT':
        return {
          backgroundColor: theme.palette.grey[50],
          borderLeft: `3px solid ${theme.palette.grey[300]}`,
          color: theme.palette.text.primary,
        };
      default:
        return {};
    }
  };

  const getLineIcon = segmentType => {
    switch (segmentType) {
      case 'ADDED':
        return <AddIcon color='success' fontSize='small' />;
      case 'REMOVED':
        return <RemoveIcon color='error' fontSize='small' />;
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
          color: theme.palette.text.secondary,
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
