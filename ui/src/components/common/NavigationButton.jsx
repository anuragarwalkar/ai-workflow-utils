/**
 * Reusable Navigation Button Component
 * Provides a consistent way to navigate between pages
 */

import React from 'react';
import { IconButton, Tooltip } from '@mui/material';
import { ArrowBack as ArrowBackIcon, Home as HomeIcon } from '@mui/icons-material';
import { alpha, useTheme } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import { createLogger } from '../../utils/log.js';

const logger = createLogger('NavigationButton');

/**
 * NavigationButton component
 * @param {object} props - Component props
 * @param {string} [props.to='/'] - Route to navigate to
 * @param {string} [props.type='home'] - Button type: 'home' or 'back'
 * @param {string} [props.size='small'] - Button size
 * @param {object} [props.sx] - Additional styling
 * @param {boolean} [props.disabled=false] - Whether button is disabled
 * @param {string} [props.tooltip] - Custom tooltip text
 * @returns {React.Element} NavigationButton component
 */
const NavigationButton = ({ 
  to = '/', 
  type = 'home',
  size = 'small', 
  sx = {}, 
  disabled = false,
  tooltip,
  ...props 
}) => {
  const theme = useTheme();
  const navigate = useNavigate();

  const handleNavigation = () => {
    logger.info('NavigationButton', 'handleNavigation', { to, type });
    navigate(to);
  };

  const getIcon = () => {
    switch (type) {
      case 'back':
        return <ArrowBackIcon sx={{ fontSize: 16 }} />;
      case 'home':
      default:
        return <HomeIcon sx={{ fontSize: 16 }} />;
    }
  };

  const getTooltipText = () => {
    if (tooltip) return tooltip;
    
    switch (type) {
      case 'back':
        return 'Go Back';
      case 'home':
      default:
        return 'Go to Home';
    }
  };

  return (
    <Tooltip title={getTooltipText()}>
      <IconButton
        disabled={disabled}
        size={size}
        sx={{
          width: '28px',
          height: '28px',
          background: alpha(theme.palette.secondary.main, 0.1),
          color: theme.palette.secondary.main,
          '&:hover': {
            background: alpha(theme.palette.secondary.main, 0.2),
          },
          '&:disabled': {
            background: alpha(theme.palette.action.disabled, 0.1),
            color: theme.palette.action.disabled,
          },
          ...sx,
        }}
        onClick={handleNavigation}
        {...props}
      >
        {getIcon()}
      </IconButton>
    </Tooltip>
  );
};

export default NavigationButton;
