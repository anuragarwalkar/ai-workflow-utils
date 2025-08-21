/**
 * Tool Card Styles
 */

import { styled } from '@mui/material/styles';
import { Box } from '@mui/material';

export const ToolCardContainer = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  '&:last-child': {
    marginBottom: 0,
  },
}));

export const ToolIcon = styled(Box)(() => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  minWidth: 24,
  minHeight: 24,
}));

export const ToolStatus = styled(Box)(() => ({
  marginLeft: 'auto',
}));
