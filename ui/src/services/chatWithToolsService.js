/**
 * Chat Service with Tools Support
 * Handles AI chat interactions and tool execution
 */

import { ToolsRegistry } from '../components/ai/tools/ToolsRegistry';
import { log } from '../utils/log';

class ChatWithToolsService {
  constructor() {
    this.apiUrl = '/api/chat';
    this.toolsEnabled = true;
  }

  /**
   * Send a message to the AI with optional tool support
   */
  async sendMessage(message, options = {}) {
    const {
      onStreamUpdate,
      onToolCall,
      onToolComplete,
      conversationHistory = [],
      enableTools = this.toolsEnabled,
    } = options;

    try {
      log('[ChatWithToolsService] [sendMessage] Sending message', { 
        messageLength: message.length,
        enableTools,
        historyLength: conversationHistory.length,
      });

      const requestBody = {
        message,
        history: conversationHistory,
        tools: enableTools ? this.getAvailableToolsForAPI() : undefined,
      };

      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Handle streaming response
      if (response.headers.get('content-type')?.includes('text/stream')) {
        return this.handleStreamingResponse(response, {
          onStreamUpdate,
          onToolCall,
          onToolComplete,
        });
      }

      // Handle regular JSON response
      const result = await response.json();
      return this.processResponse(result, { onToolCall, onToolComplete });

    } catch (error) {
      log('[ChatWithToolsService] [sendMessage] Error', { error: error.message });
      throw error;
    }
  }

  /**
   * Process a single streaming data line
   */
  processStreamingLine(line, callbacks) {
    const { onStreamUpdate, onToolCall } = callbacks;
    
    if (!line.startsWith('data: ')) return null;

    try {
      const data = JSON.parse(line.slice(6));
      
      if (data.type === 'content') {
        return { type: 'content', content: data.content };
      } 
      
      if (data.type === 'tool_call') {
        onToolCall?.(data.tool_call);
        return { type: 'tool_call', toolCall: data.tool_call };
      } 
      
      if (data.type === 'done') {
        return { type: 'done' };
      }
    } catch (parseError) {
      log('[ChatWithToolsService] [processStreamingLine] Parse error', { 
        error: parseError.message 
      });
    }

    return null;
  }

  /**
   * Handle streaming response from AI
   */
  async handleStreamingResponse(response, callbacks) {
    const { onToolComplete } = callbacks;
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    
    let accumulatedContent = '';
    const toolCalls = [];

    try {
      const result = await this.processStreamChunks({
        reader, 
        decoder, 
        content: accumulatedContent, 
        toolCalls, 
        callbacks,
      });
      
      accumulatedContent = result.content;

      // Execute any tool calls
      if (toolCalls.length > 0) {
        await this.executeToolCalls(toolCalls, onToolComplete);
      }

      return {
        content: accumulatedContent,
        toolCalls,
      };

    } finally {
      reader.releaseLock();
    }
  }

  /**
   * Process streaming chunks
   */
  async processStreamChunks({ reader, decoder, content, toolCalls, callbacks }) {
    let accumulatedContent = content;

    while (true) {
      const { done, value } = await reader.read();
      
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const result = this.processStreamLine({ line, accumulatedContent, toolCalls, callbacks });
          accumulatedContent = result.content;
        }
      }
    }

    return { content: accumulatedContent };
  }

  /**
   * Process a single stream line
   */
  processStreamLine({ line, accumulatedContent, toolCalls, callbacks }) {
    const { onStreamUpdate, onToolCall } = callbacks;
    
    try {
      const data = JSON.parse(line.slice(6));
      
      if (data.type === 'content') {
        accumulatedContent += data.content;
        onStreamUpdate?.(accumulatedContent, false);
      } else if (data.type === 'tool_call') {
        toolCalls.push(data.tool_call);
        onToolCall?.(data.tool_call);
      } else if (data.type === 'done') {
        onStreamUpdate?.(accumulatedContent, true);
      }
    } catch (parseError) {
      log('[ChatWithToolsService] [processStreamLine] Parse error', { 
        error: parseError.message 
      });
    }

    return { content: accumulatedContent };
  }

  /**
   * Process regular JSON response
   */
  async processResponse(result, callbacks) {
    const { onToolCall, onToolComplete } = callbacks;
    const { content, tool_calls: toolCalls } = result;

    // Handle tool calls if present
    if (toolCalls && toolCalls.length > 0) {
      for (const toolCall of toolCalls) {
        onToolCall?.(toolCall);
      }
      
      await this.executeToolCalls(toolCalls, onToolComplete);
    }

    return {
      content,
      toolCalls: toolCalls || [],
    };
  }

  /**
   * Execute tool calls
   */
  async executeToolCalls(toolCalls, onToolComplete) {
    for (const toolCall of toolCalls) {
      try {
        const tool = ToolsRegistry.getTool(toolCall.name);
        if (!tool) {
          log('[ChatWithToolsService] [executeToolCalls] Tool not found', { 
            name: toolCall.name 
          });
          onToolComplete?.(toolCall.id, null, `Tool '${toolCall.name}' not found`);
          continue;
        }

        const result = await tool.execute(toolCall.parameters);
        onToolComplete?.(toolCall.id, result, null);

      } catch (error) {
        log('[ChatWithToolsService] [executeToolCalls] Tool execution failed', { 
          toolName: toolCall.name,
          error: error.message 
        });
        onToolComplete?.(toolCall.id, null, error.message);
      }
    }
  }

  /**
   * Get available tools formatted for API
   */
  getAvailableToolsForAPI() {
    const tools = ToolsRegistry.getAllTools();
    return tools.map(tool => ({
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters,
    }));
  }

  /**
   * Enable/disable tools
   */
  setToolsEnabled(enabled) {
    this.toolsEnabled = enabled;
    log('[ChatWithToolsService] [setToolsEnabled] Tools enabled changed', { enabled });
  }

  /**
   * Get current tools status
   */
  getToolsEnabled() {
    return this.toolsEnabled;
  }
}

// Export singleton instance
export const chatWithToolsService = new ChatWithToolsService();
export default chatWithToolsService;
