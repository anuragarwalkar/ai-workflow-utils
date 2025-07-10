import React from 'react';
import { Container, Paper, Box } from '@mui/material';
import Header from './Header';

const Layout = ({ children }) => {
  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: 'background.default' }}>
      <Header />
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Paper elevation={2} sx={{ p: 3 }}>
          {children}
        </Paper>
      </Container>
    </Box>
  );
};

export default Layout;
