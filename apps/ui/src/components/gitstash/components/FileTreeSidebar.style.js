import { styled } from '@mui/material/styles';
import { Box, ListItemButton, Typography } from '@mui/material';

export const SidebarContainer = styled(Box)(({ theme }) => ({
  width: '320px',
  minWidth: '280px',
  maxWidth: '400px',
  display: 'flex',
  flexDirection: 'column',
  borderRight: `1px solid ${theme.palette.divider}`,
  backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)',
  height: '100%',
  overflow: 'hidden',
  userSelect: 'none',
}));

export const SearchHeader = styled(Box)(({ theme }) => ({
  padding: theme.spacing(1.5, 1.5, 1),
  borderBottom: `1px solid ${theme.palette.divider}`,
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(1),
}));

export const FileListContainer = styled(Box)(({ theme }) => ({
  flex: 1,
  overflowY: 'auto',
  overflowX: 'hidden',
  padding: theme.spacing(1, 0.5),
  '&::-webkit-scrollbar': {
    width: '6px',
  },
  '&::-webkit-scrollbar-track': {
    background: 'transparent',
  },
  '&::-webkit-scrollbar-thumb': {
    background: theme.palette.divider,
    borderRadius: '4px',
  },
}));

export const FileItemButton = styled(ListItemButton, {
  shouldForwardProp: (prop) => prop !== 'active' && prop !== 'level',
})(({ theme, active, level = 0 }) => ({
  paddingTop: 3,
  paddingBottom: 3,
  paddingLeft: 10 + level * 14,
  paddingRight: theme.spacing(1),
  minHeight: 28,
  borderRadius: 4,
  margin: '1px 4px',
  backgroundColor: active
    ? theme.palette.mode === 'dark'
      ? 'rgba(33, 150, 243, 0.2)'
      : 'rgba(25, 118, 210, 0.1)'
    : 'transparent',
  borderLeft: active ? `3px solid ${theme.palette.primary.main}` : '3px solid transparent',
  '&:hover': {
    backgroundColor: active
      ? theme.palette.mode === 'dark'
        ? 'rgba(33, 150, 243, 0.25)'
        : 'rgba(25, 118, 210, 0.15)'
      : theme.palette.mode === 'dark'
      ? 'rgba(255, 255, 255, 0.05)'
      : 'rgba(0, 0, 0, 0.04)',
  },
}));

export const FolderItemButton = styled(ListItemButton, {
  shouldForwardProp: (prop) => prop !== 'level',
})(({ theme, level = 0 }) => ({
  paddingTop: 3,
  paddingBottom: 3,
  paddingLeft: 10 + level * 14,
  paddingRight: theme.spacing(1),
  minHeight: 28,
  borderRadius: 4,
  margin: '1px 4px',
  '&:hover': {
    backgroundColor:
      theme.palette.mode === 'dark'
        ? 'rgba(255, 255, 255, 0.05)'
        : 'rgba(0, 0, 0, 0.04)',
  },
}));

export const StatusBadge = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'status',
})(({ theme, status }) => {
  let bgColor = '#1976d2'; // Default blue for modified/general
  if (status === 'ADDED') bgColor = '#0052cc';
  if (status === 'REMOVED') bgColor = '#de350b';
  if (status === 'RENAMED' || status === 'COPIED') bgColor = '#ff8b00';
  if (status === 'MODIFIED') bgColor = '#0052cc';

  return {
    width: 18,
    height: 18,
    minWidth: 18,
    minHeight: 18,
    borderRadius: 3,
    backgroundColor: bgColor,
    color: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing(1),
    flexShrink: 0,
    '& svg': {
      fontSize: 12,
    },
  };
});

export const FileText = styled(Typography)(({ theme }) => ({
  fontSize: '0.8125rem',
  fontFamily: "'Segoe UI', -apple-system, BlinkMacSystemFont, 'Roboto', sans-serif",
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  flex: 1,
  color: theme.palette.text.primary,
}));

export const FolderText = styled(Typography)(({ theme }) => ({
  fontSize: '0.8125rem',
  fontWeight: 600,
  fontFamily: "'Segoe UI', -apple-system, BlinkMacSystemFont, 'Roboto', sans-serif",
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  flex: 1,
  color: theme.palette.text.primary,
}));
