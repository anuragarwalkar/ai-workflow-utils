import React from 'react';
import { Box } from '@mui/material';
import { useAppTheme } from '../../theme/useAppTheme';
import { useApiClientComposition } from './hooks/useApiClientComposition';
import ApiClientLayout from './components/ApiClientLayout';
import ApiClientErrorBoundary from './components/ApiClientErrorBoundary';

const ApiClient = () => {
  const { isDark } = useAppTheme();
  const composition = useApiClientComposition();

  return (
    <ApiClientErrorBoundary>
      <Box
        sx={{
          height: '100vh',
          background: isDark
            ? '#1E1E1E'
            : 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
          overflow: 'hidden',
        }}
      >
        <ApiClientLayout {...composition} />
      </Box>
    </ApiClientErrorBoundary>
  );
};

export default ApiClient;
