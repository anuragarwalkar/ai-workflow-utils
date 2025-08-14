import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Chip,
  Typography,
  useTheme,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
} from '@mui/icons-material';
import DiffLine from './DiffLine';

const FileChanges = ({ file, expanded, onToggle }) => {
  const theme = useTheme();

  const getFileStatus = () => {
    if (!file.source && file.destination) return 'ADDED';
    if (file.source && !file.destination) return 'REMOVED';
    return 'MODIFIED';
  };

  const getStatusColor = status => {
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
  const fileName = file.destination?.toString || file.source?.toString || 'Unknown file';

  return (
    <Accordion
      expanded={expanded}
      sx={{ mb: 1, border: `1px solid ${theme.palette.divider}` }}
      onChange={onToggle}
    >
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
        sx={{
          backgroundColor: theme.palette.grey[50],
          '&:hover': { backgroundColor: theme.palette.grey[100] },
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
          <Typography
            sx={{
              fontFamily: 'monospace',
              flex: 1,
              wordBreak: 'break-all',
              whiteSpace: 'normal',
              lineHeight: 1.2,
              minWidth: 0,
            }}
            variant='subtitle1'
          >
            {fileName}
          </Typography>
          <Chip color={getStatusColor(status)} label={status} size='small' variant='outlined' />
          <Chip label={`${file.hunks?.length || 0} hunks`} size='small' variant='outlined' />
        </Box>
      </AccordionSummary>
      <AccordionDetails sx={{ p: 0 }}>
        {file.hunks?.map((hunk, hunkIndex) => (
          <Box key={hunkIndex} sx={{ mb: 2 }}>
            <Box
              sx={{
                backgroundColor: `${theme.palette.primary.light}20`,
                p: 1,
                borderBottom: `1px solid ${theme.palette.divider}`,
              }}
            >
              <Typography
                sx={{ color: 'primary.main', fontFamily: 'monospace' }}
                variant='subtitle2'
              >
                {hunk.context ||
                  `@@ -${hunk.sourceLine},${hunk.sourceSpan} +${hunk.destinationLine},${hunk.destinationSpan} @@`}
              </Typography>
            </Box>
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
      </AccordionDetails>
    </Accordion>
  );
};

export default FileChanges;