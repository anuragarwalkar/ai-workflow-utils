import { styled } from '@mui/material/styles';
import { Box, Card, Typography } from '@mui/material';

export const DiffViewerContainer = styled(Card)(({ theme }) => ({
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  borderRadius: 0,
  borderLeft: 'none',
  boxShadow: 'none',
  backgroundColor: '#1e1e1e',
  color: '#d4d4d4',
}));

export const DiffHeader = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: theme.spacing(1.5, 2),
  backgroundColor: '#252526',
  borderBottom: '1px solid #333',
}));

export const FilePathText = styled(Typography)(({ theme }) => ({
  fontFamily: 'monospace',
  fontWeight: 600,
  fontSize: '0.9rem',
  wordBreak: 'break-all',
  lineHeight: 1.2,
  color: '#d4d4d4',
}));

export const HunkHeader = styled(Box)(({ theme }) => ({
  backgroundColor: '#2d2d2d',
  padding: theme.spacing(1, 2),
  borderBottom: '1px solid #333',
  borderTop: '1px solid #333',
}));

export const DiffContent = styled(Box)(({ theme }) => ({
  flex: 1,
  overflowY: 'auto',
  backgroundColor: '#1e1e1e',
  paddingBottom: theme.spacing(2),
  '&::-webkit-scrollbar': {
    width: '8px',
    height: '8px',
  },
  '&::-webkit-scrollbar-track': {
    background: 'transparent',
  },
  '&::-webkit-scrollbar-thumb': {
    background: '#424242',
    borderRadius: '4px',
  },
}));

export const DiffFooter = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: theme.spacing(1, 2),
  borderTop: '1px solid #333',
  backgroundColor: '#252526',
}));

export const EmptyStateContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  height: '100%',
  color: '#858585',
  backgroundColor: '#1e1e1e',
}));
