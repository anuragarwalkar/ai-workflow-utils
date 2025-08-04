import { useContext } from 'react';
import { ThemeContext } from './ThemeContext';

// Custom hook to use theme
export const useAppTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useAppTheme must be used within an AppThemeProvider');
  }
  return context;
};
