import React from 'react';
import { IconButton, Tooltip } from '@mui/material';
import { 
  LightMode, 
  DarkMode, 
  SettingsBrightness 
} from '@mui/icons-material';
import { useAppTheme } from '../../theme/useAppTheme';

const ThemeToggle = () => {
  const { themeMode, setThemeMode } = useAppTheme();

  const cycleTheme = () => {
    const nextTheme = {
      'light': 'dark',
      'dark': 'auto',
      'auto': 'light'
    };
    setThemeMode(nextTheme[themeMode] || 'auto');
  };

  const getIcon = () => {
    switch (themeMode) {
      case 'light':
        return <LightMode />;
      case 'dark':
        return <DarkMode />;
      case 'auto':
        return <SettingsBrightness />;
      default:
        return <SettingsBrightness />;
    }
  };

  const getTooltip = () => {
    switch (themeMode) {
      case 'light':
        return 'Switch to Dark theme';
      case 'dark':
        return 'Switch to Auto theme';
      case 'auto':
        return 'Switch to Light theme';
      default:
        return 'Toggle theme';
    }
  };

  return (
    <Tooltip title={getTooltip()}>
      <IconButton
        onClick={cycleTheme}
        sx={{
          color: 'white',
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          transition: 'all 0.3s ease',
          '&:hover': {
            background: 'rgba(255, 255, 255, 0.2)',
            transform: 'scale(1.1)',
            boxShadow: '0 4px 20px rgba(102, 126, 234, 0.3)',
          },
        }}
      >
        {getIcon()}
      </IconButton>
    </Tooltip>
  );
};

export default ThemeToggle;
