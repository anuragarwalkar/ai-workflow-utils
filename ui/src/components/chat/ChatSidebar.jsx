/**
 * Chat sidebar component for conversation history and management
 * Similar to ChatGPT sidebar with conversation list and controls
 */

import React from 'react';
import {
  Box,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { CHAT_UI } from '../../constants/chat.js';
import { getConversationTitle } from '../../utils/chatUtils.js';
import { createLogger } from '../../utils/log.js';

const logger = createLogger('ChatSidebar');

const SidebarContainer = styled(Box)(({ theme }) => ({
  width: CHAT_UI.SIDEBAR_WIDTH,
  height: '100%',
  backgroundColor: theme.palette.background.paper,
  borderRight: `1px solid ${theme.palette.divider}`,
  display: 'flex',
  flexDirection: 'column',
}));

const SidebarHeader = styled(Box)(({ theme }) => ({
  padding: theme.spacing(3, 2),
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  borderBottom: `1px solid ${theme.palette.divider}`,
  backgroundColor: theme.palette.background.paper,
}));

const ConversationList = styled(List)({
  flex: 1,
  overflow: 'auto',
  padding: 0,
});

const ConversationItem = styled(ListItem)(({ theme, isActive }) => ({
  padding: 0,
  '& .MuiListItemButton-root': {
    padding: theme.spacing(1.5, 2),
    backgroundColor: isActive ? theme.palette.action.selected : 'transparent',
    '&:hover': {
      backgroundColor: isActive 
        ? theme.palette.action.selected 
        : theme.palette.action.hover,
    },
  },
}));

const ConversationText = styled(ListItemText)(({ theme }) => ({
  '& .MuiListItemText-primary': {
    fontSize: '14px',
    fontWeight: 500,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  '& .MuiListItemText-secondary': {
    fontSize: '12px',
    color: theme.palette.text.secondary,
  },
}));

const ActionButtons = styled(Box)({
  display: 'flex',
  gap: '4px',
  opacity: 0,
  transition: 'opacity 0.2s',
  '&.visible': {
    opacity: 1,
  },
});

/**
 * ChatSidebar component
 * @param {object} props - Component props
 * @param {Array} props.conversations - List of conversations
 * @param {string} props.currentSessionId - Current active session ID
 * @param {function} props.onNewConversation - Handler for creating new conversation
 * @param {function} props.onSelectConversation - Handler for selecting conversation
 * @param {function} props.onDeleteConversation - Handler for deleting conversation
 * @param {function} props.onEditConversation - Handler for editing conversation
 * @returns {React.Element} ChatSidebar component
 */
const ChatSidebar = ({
  conversations = [],
  currentSessionId,
  onNewConversation,
  onSelectConversation,
  onDeleteConversation,
  onEditConversation,
}) => {
  logger.info('ChatSidebar', 'Rendering sidebar', { 
    conversationCount: conversations.length,
    currentSessionId 
  });

  const handleNewConversation = () => {
    logger.info('ChatSidebar', 'handleNewConversation', 'Creating new conversation');
    onNewConversation?.();
  };

  const handleSelectConversation = (sessionId) => {
    logger.info('ChatSidebar', 'handleSelectConversation', `Selecting conversation: ${sessionId}`);
    onSelectConversation?.(sessionId);
  };

  const handleDeleteConversation = (event, sessionId) => {
    event.stopPropagation();
    logger.info('ChatSidebar', 'handleDeleteConversation', `Deleting conversation: ${sessionId}`);
    onDeleteConversation?.(sessionId);
  };

  const handleEditConversation = (event, sessionId) => {
    event.stopPropagation();
    logger.info('ChatSidebar', 'handleEditConversation', `Editing conversation: ${sessionId}`);
    onEditConversation?.(sessionId);
  };

  const renderConversationItem = (conversation) => {
    const isActive = conversation.id === currentSessionId;
    const title = getConversationTitle(conversation.messages || []);
    const lastMessage = conversation.messages?.slice(-1)[0];
    const lastMessageTime = lastMessage?.timestamp 
      ? new Date(lastMessage.timestamp).toLocaleDateString()
      : '';

    return (
      <ConversationItem isActive={isActive} key={conversation.id}>
        <ListItemButton 
          sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
          onClick={() => handleSelectConversation(conversation.id)}
        >
          <ConversationText
            primary={title}
            secondary={lastMessageTime}
            sx={{ flex: 1, minWidth: 0 }}
          />
          <ActionButtons 
            className={isActive ? 'visible' : ''}
            sx={{
              '&:hover': { opacity: 1 },
            }}
          >
            <Tooltip title="Edit conversation">
              <IconButton
                size="small"
                onClick={(e) => handleEditConversation(e, conversation.id)}
              >
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete conversation">
              <IconButton
                size="small"
                onClick={(e) => handleDeleteConversation(e, conversation.id)}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </ActionButtons>
        </ListItemButton>
      </ConversationItem>
    );
  };

  return (
    <SidebarContainer>
      <SidebarHeader>
        <Typography component="h2" variant="h6">
          Conversations
        </Typography>
        <Tooltip title="New conversation">
          <IconButton onClick={handleNewConversation}>
            <AddIcon />
          </IconButton>
        </Tooltip>
      </SidebarHeader>

      <Divider />

      <ConversationList>
        {conversations.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography color="text.secondary" variant="body2">
              No conversations yet
            </Typography>
            <Typography color="text.secondary" variant="caption">
              Start a new conversation to begin
            </Typography>
          </Box>
        ) : (
          conversations.map(renderConversationItem)
        )}
      </ConversationList>
    </SidebarContainer>
  );
};

export default ChatSidebar;
