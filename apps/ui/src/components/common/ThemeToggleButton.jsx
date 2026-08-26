/**
 * Reusable Theme Toggle Button Component
 * Provides a consistent theme switcher across the application
 */

import React from 'react';
import { IconButton, Tooltip } from '@mui/material';
import { DarkMode as DarkModeIcon, LightMode as LightModeIcon } from '@mui/icons-material';
import { alpha, useTheme } from '@mui/material/styles';
import { useAppTheme } from '../../theme/useAppTheme.js';
import { createLogger } from '../../utils/log.js';

const logger = createLogger('ThemeToggleButton');

/**
 * ThemeToggleButton component
 * @param {object} props - Component props
 * @param {string} [props.size='small'] - Button size
 * @param {object} [props.sx] - Additional styling
 * @param {boolean} [props.disabled=false] - Whether button is disabled
 * @returns {React.Element} ThemeToggleButton component
 */
const ThemeToggleButton = ({ 
  size = 'small', 
  sx = {}, 
  disabled = false,
  ...props 
}) => {
  const theme = useTheme();
  const { isDark, toggleTheme } = useAppTheme();

  const handleToggle = () => {
    logger.info('ThemeToggleButton', 'handleToggle', { currentTheme: isDark ? 'dark' : 'light' });
    toggleTheme();
  };

  return (
    <Tooltip title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}>
      <IconButton
        disabled={disabled}
        size={size}
        sx={{
          width: '28px',
          height: '28px',
          background: alpha(theme.palette.primary.main, 0.1),
          color: theme.palette.primary.main,
          '&:hover': {
            background: alpha(theme.palette.primary.main, 0.2),
          },
          '&:disabled': {
            background: alpha(theme.palette.action.disabled, 0.1),
            color: theme.palette.action.disabled,
          },
          ...sx,
        }}
        onClick={handleToggle}
        {...props}
      >
        {isDark ? <LightModeIcon sx={{ fontSize: 16 }} /> : <DarkModeIcon sx={{ fontSize: 16 }} />}
      </IconButton>
    </Tooltip>
  );
};

export default ThemeToggleButton;
