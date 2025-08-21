/**
 * Chat header component
 */

import React from 'react';
import { Avatar, Box, Chip, Typography, useTheme } from '@mui/material';
import {
  Chat as ChatIcon,
  Clear as ClearIcon,
  Close as CloseIcon,
  FullscreenExit as FullscreenExitIcon,
  Fullscreen as FullscreenIcon,
} from '@mui/icons-material';
import { ActionButton, HeaderContainer } from './AiChatAssistant.style';
import { ToolsToggle } from './tools/ui';

export const ChatHeader = ({ 
  isFullscreen, 
  onClear, 
  onToggleFullscreen, 
  onClose,
  toolsEnabled = false,
  onToggleTools,
}) => {
  const theme = useTheme();

  return (
    <HeaderContainer>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Avatar
          sx={{
            backgroundColor: theme.palette.primary.main,
            width: 40,
            height: 40,
          }}
        >
          <ChatIcon sx={{ fontSize: 20 }} />
        </Avatar>
        <Box>
          <Typography sx={{ fontWeight: 600 }} variant='h6'>
            AI Chat Assistant
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Chip
              label='Template-Driven'
              size='small'
              sx={{ height: 20, fontSize: '0.7rem' }}
              variant='outlined'
            />
            {Boolean(onToggleTools) && (
              <ToolsToggle 
                enabled={toolsEnabled} 
                onToggle={onToggleTools}
              />
            )}
          </Box>
        </Box>
      </Box>
      <Box sx={{ display: 'flex', gap: 1 }}>
        <ActionButton title='Clear conversation' variant='outlined' onClick={onClear}>
          <ClearIcon fontSize='small' />
        </ActionButton>
        <ActionButton
          title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          variant='outlined'
          onClick={onToggleFullscreen}
        >
          {isFullscreen ? (
            <FullscreenExitIcon fontSize='small' />
          ) : (
            <FullscreenIcon fontSize='small' />
          )}
        </ActionButton>
        <ActionButton title='Close' variant='outlined' onClick={onClose}>
          <CloseIcon fontSize='small' />
        </ActionButton>
      </Box>
    </HeaderContainer>
  );
};
