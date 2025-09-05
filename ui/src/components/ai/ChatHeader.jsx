/**
 * Chat header component with sidebar toggle and title
 */

import React from 'react';
import { Box, IconButton, Tooltip } from '@mui/material';
import { Menu as MenuIcon, MenuOpen as MenuOpenIcon } from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { createLogger } from '../../utils/log.js';
import ThemeToggleButton from '../common/ThemeToggleButton.jsx';
import NavigationButton from '../common/NavigationButton.jsx';

const logger = createLogger('ChatHeader');

const HeaderContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: theme.spacing(2, 3),
  borderBottom: `1px solid ${theme.palette.divider}`,
  backgroundColor: theme.palette.background.paper,
  minHeight: '64px',
}));

/**
 * ChatHeader component
 * @param {object} props - Component props
 * @param {boolean} props.sidebarOpen - Whether sidebar is open
 * @param {function} props.onToggleSidebar - Handler for toggling sidebar
 * @returns {React.Element} ChatHeader component
 */
const ChatHeader = ({ sidebarOpen, onToggleSidebar }) => {
  logger.info('ChatHeader', 'Rendering header', { sidebarOpen });

  return (
    <HeaderContainer>
      <Box alignItems="center" display="flex" gap={1}>
        <NavigationButton 
          to="/" 
          tooltip="Go to Main Page"
          type="home"
        />
        <Tooltip title={sidebarOpen ? 'Hide sidebar' : 'Show sidebar'}>
          <IconButton onClick={onToggleSidebar}>
            {sidebarOpen ? <MenuOpenIcon /> : <MenuIcon />}
          </IconButton>
        </Tooltip>
      </Box>

      <Box alignItems="center" display="flex" gap={0.5}>
        <ThemeToggleButton />
      </Box>
    </HeaderContainer>
  );
};

export default ChatHeader;
