import { styled } from '@mui/material/styles';
import { Box, ListItemButton, Typography } from '@mui/material';

export const SidebarContainer = styled(Box)(({ theme }) => ({
  width: '320px',
  minWidth: '320px',
  display: 'flex',
  flexDirection: 'column',
  borderRight: `1px solid ${theme.palette.divider}`,
  backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)',
  height: '100%',
  overflow: 'hidden',
}));

export const SearchHeader = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  borderBottom: `1px solid ${theme.palette.divider}`,
}));

export const FileListContainer = styled(Box)(({ theme }) => ({
  flex: 1,
  overflowY: 'auto',
  padding: theme.spacing(1, 0),
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
  paddingTop: theme.spacing(0.5),
  paddingBottom: theme.spacing(0.5),
  paddingLeft: theme.spacing(2 + level * 1.5),
  paddingRight: theme.spacing(2),
  minHeight: 32,
  backgroundColor: active ? (theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)') : 'transparent',
  borderLeft: `3px solid ${active ? theme.palette.primary.main : 'transparent'}`,
  '&:hover': {
    backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
  },
}));

export const FolderItemButton = styled(ListItemButton, {
  shouldForwardProp: (prop) => prop !== 'level',
})(({ theme, level = 0 }) => ({
  paddingTop: theme.spacing(0.5),
  paddingBottom: theme.spacing(0.5),
  paddingLeft: theme.spacing(2 + level * 1.5),
  paddingRight: theme.spacing(2),
  minHeight: 32,
  '&:hover': {
    backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
  },
}));

export const FileText = styled(Typography)(({ theme }) => ({
  fontSize: '0.875rem',
  fontFamily: 'monospace',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  flex: 1,
}));
