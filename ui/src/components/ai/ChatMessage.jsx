/**
 * Chat message components
 */

import React from 'react';
import { Avatar, Box, Fade, Typography, useTheme } from '@mui/material';
import { SmartToy as AIIcon, Person as PersonIcon } from '@mui/icons-material';
import { LoadingDots, MessageBubble } from './AiChatAssistant.style';
import ToolsList from './tools/ui/ToolsList';

export const ChatMessage = ({ message }) => {
  const theme = useTheme();

  return (
    <Fade in timeout={300}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: message.role === 'user' ? 'flex-end' : 'flex-start',
          mb: 2,
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 1,
            maxWidth: '100%',
            flexDirection: message.role === 'user' ? 'row-reverse' : 'row',
          }}
        >
          <Avatar
            sx={{
              width: 32,
              height: 32,
              backgroundColor: message.role === 'user' 
                ? theme.palette.info.main 
                : theme.palette.success.main,
            }}
          >
            {message.role === 'user' ? (
              <PersonIcon sx={{ fontSize: 16 }} />
            ) : (
              <AIIcon sx={{ fontSize: 16 }} />
            )}
          </Avatar>

          <MessageBubble 
            isStreaming={message.isStreaming}
            isUser={message.role === 'user'} 
          >
            {message.isLoading ? (
              <LoadingDots>
                <div />
                <div />
                <div />
              </LoadingDots>
            ) : (
              <>
                <Typography
                  sx={{
                    whiteSpace: 'pre-wrap',
                    lineHeight: 1.5,
                    '& strong': { fontWeight: 600 },
                    '& code': {
                      backgroundColor: theme.palette.action.hover,
                      padding: '2px 6px',
                      borderRadius: 1,
                      fontFamily: 'monospace',
                      fontSize: '0.85em',
                    },
                  }}
                  variant="body2"
                >
                  {message.content || (message.isStreaming ? '▊' : '')}
                </Typography>

                {/* Display tools if present */}
                {Boolean(message.tools && message.tools.length > 0) && (
                  <ToolsList tools={message.tools} />
                )}
              </>
            )}
          </MessageBubble>
        </Box>
      </Box>
    </Fade>
  );
};
