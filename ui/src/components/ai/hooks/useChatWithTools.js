/**
 * Combined hook for chat functionality with tools support
 */

import { useState } from 'react';
import { useChatActions, useChatState } from '../useChatAssistant';

export const useChatWithTools = ({ enableTools = false } = {}) => {
  const [toolsEnabled, setToolsEnabled] = useState(enableTools);
  
  // Get base chat functionality
  const chatState = useChatState();
  const chatActions = useChatActions(chatState);
  
  // Tools-specific actions
  const toggleTools = () => {
    setToolsEnabled(prev => !prev);
  };
  
  // Combine all functionality
  return {
    // Chat state
    ...chatState,
    
    // Chat actions
    ...chatActions,
    
    // Tools state and actions
    toolsEnabled,
    toggleTools,
  };
};
