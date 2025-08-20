import { useMemo } from 'react';
import { alpha, useTheme } from '@mui/material';
import { useAppTheme } from '../../../theme/useAppTheme';
import { useApiClientViewModel } from '../viewModels/useApiClientViewModel';
import { useCollectionsViewModel } from '../viewModels/useCollectionsViewModel';
import { useEnvironmentViewModel } from '../viewModels/useEnvironmentViewModel';
import { useUiStateViewModel } from '../viewModels/useUiStateViewModel';

export const useApiClientComposition = () => {
  const theme = useTheme();
  const { isDark } = useAppTheme();
  
  // ViewModels
  const apiClient = useApiClientViewModel();
  const collections = useCollectionsViewModel();
  const environments = useEnvironmentViewModel();
  const uiState = useUiStateViewModel();
  
  const glassMorphismStyle = useMemo(() => ({
    background: isDark 
      ? '#1E1E1E'
      : alpha(theme.palette.background.paper, 0.9),
    backdropFilter: 'blur(20px)',
    border: `1px solid ${alpha(theme.palette.divider, isDark ? 0.1 : 0.1)}`,
  }), [isDark, theme]);

  return {
    apiClient,
    collections,
    environments,
    uiState,
    glassMorphismStyle,
  };
};
