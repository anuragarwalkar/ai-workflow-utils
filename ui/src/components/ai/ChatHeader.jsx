/**
 * Chat header component with sidebar toggle and title
 */

import React from 'react';
import { Box, IconButton, Tooltip } from '@mui/material';
import { Menu as MenuIcon, MenuOpen as MenuOpenIcon } from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { createLogger } from '../../utils/log.js';

const logger = createLogger('ChatHeader');

const HeaderContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(1, 2),
  borderBottom: `1px solid ${theme.palette.divider}`,
  backgroundColor: theme.palette.background.paper,
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
      <Tooltip title={sidebarOpen ? 'Hide sidebar' : 'Show sidebar'}>
        <IconButton onClick={onToggleSidebar}>
          {sidebarOpen ? <MenuOpenIcon /> : <MenuIcon />}
        </IconButton>
      </Tooltip>
    </HeaderContainer>
  );
};

export default ChatHeader;
