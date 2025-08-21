/**
 * Styled components for PreviewSection component
 */

import { Box, Button, Paper, Typography, styled } from '@mui/material';

export const PreviewContainer = styled(Box)(({ theme }) => ({
  marginTop: theme.spacing(4),
}));

export const PreviewForm = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  backgroundColor: theme.palette.grey[100],
  marginBottom: theme.spacing(2),
}));

export const PreviewInfo = styled(Box)(({ theme }) => ({
  marginTop: theme.spacing(2),
}));

export const InfoText = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.secondary,
  variant: 'subtitle2',
}));

export const AIGeneratedText = styled(Typography)(({ theme }) => ({
  color: theme.palette.primary.main,
  variant: 'subtitle2',
}));

export const CreateButton = styled(Button)(({ theme }) => ({
  marginTop: theme.spacing(1),
}));

export const PreviewTitle = styled(Typography)(({ theme }) => ({
  marginBottom: theme.spacing(1),
  fontWeight: theme.typography.fontWeightMedium,
}));
