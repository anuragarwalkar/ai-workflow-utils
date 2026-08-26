import { styled } from '@mui/material/styles';
import { Box, IconButton } from '@mui/material';

export const ButtonContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  marginTop: theme.spacing(1),
}));

export const ActionButton = styled(IconButton)(({ theme, success }) => ({
  color: success ? theme.palette.success.main : theme.palette.primary.main,
  transition: 'all 0.2s ease-in-out',
  '&:hover': {
    backgroundColor: success ? theme.palette.success.light + '20' : theme.palette.primary.light + '20',
    transform: 'scale(1.05)',
  },
  '&.Mui-disabled': {
    color: success ? theme.palette.success.main : theme.palette.action.disabled,
  }
}));
