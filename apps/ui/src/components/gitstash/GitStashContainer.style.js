import { styled } from '@mui/material/styles';
import { Button, Container, Paper } from '@mui/material';

export const StyledContainer = styled(Container)(({ theme }) => ({
  paddingTop: theme.spacing(4),
  paddingBottom: theme.spacing(4),
}));

export const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  marginBottom: theme.spacing(3),
  elevation: 2,
}));

export const StyledContentPaper = styled(Paper)(({ theme, activeStep }) => ({
  padding: theme.spacing(3),
  minHeight: activeStep === 0 ? 'auto' : '60vh',
  elevation: 2,
}));

export const StyledBackButton = styled(Button)(({ theme }) => ({
  marginRight: theme.spacing(2),
}));

export const StyledHeaderBox = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  marginBottom: theme.spacing(3),
}));

export const StyledTitle = styled('h1')(() => ({
  fontWeight: 600,
  margin: 0,
}));
