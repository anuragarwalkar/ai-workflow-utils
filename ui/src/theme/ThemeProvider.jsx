import React, { useEffect, useMemo, useState } from 'react';
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import PropTypes from 'prop-types';
import { createAppTheme, getSystemTheme } from './theme';
import { ThemeContext } from './ThemeContext';

// Theme provider component
export const AppThemeProvider = ({ children }) => {
  // Get initial theme mode from localStorage or default to 'auto'
  const getInitialThemeMode = () => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('themeMode');
      return stored || 'auto';
    }
    return 'auto';
  };

  const [themeMode, setThemeMode] = useState(getInitialThemeMode);
  const [currentTheme, setCurrentTheme] = useState(() => createAppTheme(themeMode));

  // Update theme when mode changes
  useEffect(() => {
    setCurrentTheme(createAppTheme(themeMode));
    if (typeof window !== 'undefined') {
      localStorage.setItem('themeMode', themeMode);
    }
  }, [themeMode]);

  // Listen to system theme changes when in auto mode
  useEffect(() => {
    if (themeMode === 'auto') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

      const handleChange = () => {
        setCurrentTheme(createAppTheme('auto'));
      };

      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [themeMode]);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => {
    const effectiveThemeMode = themeMode === 'auto' ? getSystemTheme() : themeMode;
    return {
      themeMode,
      setThemeMode,
      effectiveThemeMode,
      isDark: effectiveThemeMode === 'dark',
    };
  }, [themeMode]);

  return (
    <ThemeContext.Provider value={contextValue}>
      <MuiThemeProvider theme={currentTheme}>{children}</MuiThemeProvider>
    </ThemeContext.Provider>
  );
};

AppThemeProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export default AppThemeProvider;
