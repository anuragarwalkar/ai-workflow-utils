/**
 * Styled components for CreatePRContainer component
 */

import { Box, Button, Paper, Typography, styled } from '@mui/material';

export const MainContainer = styled(Box)(({ theme }) => ({
  width: '100%',
  marginTop: theme.spacing(2),
}));

export const ContentPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
}));

export const Title = styled(Typography)(({ theme }) => ({
  marginBottom: theme.spacing(1),
  fontWeight: theme.typography.fontWeightMedium,
}));

export const ActionContainer = styled(Box)(({ theme }) => ({
  marginTop: theme.spacing(2),
  display: 'flex',
  gap: theme.spacing(2),
}));

export const PreviewButton = styled(Button)(({ theme }) => ({
  minWidth: theme.spacing(12),
}));
