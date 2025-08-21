# AI Tools System

A modular, extensible tools system for AI chat interfaces, similar to ChatGPT's function calling capabilities.

## Overview

This system provides a pluggable architecture for AI tools that can be:
- **Easily added**: Create new tools by extending the `BaseTool` class
- **Dynamically registered**: Tools are automatically registered in the `ToolsRegistry`
- **UI integrated**: Automatic UI generation for tool execution status and results
- **Type safe**: Full TypeScript support with proper interfaces

## Architecture

```
components/ai/tools/
├── ToolsRegistry.js          # Central registry for all tools
├── BaseTool.js              # Base class for creating tools
├── tools/                   # Individual tool implementations
│   ├── CodeAnalyzerTool.js
│   ├── FileSearchTool.js
│   ├── ApiClientTool.js
│   └── index.js
├── ui/                      # UI components for tools
│   ├── ToolCard.jsx         # Individual tool execution display
│   ├── ToolsList.jsx        # List of tool executions
│   ├── ToolsToggle.jsx      # Enable/disable tools
│   └── index.js
├── hooks/                   # React hooks for tools
│   └── useToolsExecution.js # Hook for managing tool execution
└── ToolsDemo.jsx           # Demo component showcasing the system
```

## Quick Start

### 1. Use the Enhanced Chat Hook

```jsx
import { useChatWithTools } from './components/ai/hooks/useChatWithTools';

const MyChat = () => {
  const {
    messages,
    inputMessage,
    setInputMessage,
    handleSendMessage,
    toolsEnabled,
    toggleTools,
  } = useChatWithTools({ enableTools: true });

  return (
    <div>
      <ToolsToggle enabled={toolsEnabled} onToggle={toggleTools} />
      {messages.map(message => (
        <ChatMessage key={message.id} message={message} />
      ))}
      <input 
        value={inputMessage} 
        onChange={(e) => setInputMessage(e.target.value)}
        onKeyPress={handleKeyPress}
      />
    </div>
  );
};
```

### 2. Create a New Tool

```javascript
import { BaseTool } from '../BaseTool';

export class CustomTool extends BaseTool {
  constructor() {
    super({
      name: 'custom_tool',
      description: 'A custom tool that does something useful',
      parameters: {
        type: 'object',
        properties: {
          input: {
            type: 'string',
            description: 'Input parameter',
          },
        },
        required: ['input'],
      },
    });
  }

  async execute(parameters) {
    const { input } = parameters;
    
    // Your tool logic here
    const result = await someAsyncOperation(input);
    
    return result;
  }
}

// Auto-register the tool
new CustomTool();
```

### 3. Display Tools in Messages

The `ChatMessage` component automatically displays tools if present in the message:

```jsx
// Message structure with tools
const messageWithTools = {
  id: 'msg-1',
  role: 'assistant',
  content: 'I used some tools to help with your request.',
  tools: [
    {
      id: 'tool-1',
      tool: { name: 'file_search', description: 'Search for files' },
      status: 'completed',
      result: 'Found 5 files matching your criteria',
      error: null,
    }
  ],
};
```

## Available Tools

### Built-in Tools

1. **Code Analyzer Tool** (`code_analyzer`)
   - Analyzes code quality and suggests improvements
   - Parameters: `{ code: string, language?: string }`

2. **File Search Tool** (`file_search`) 
   - Searches for files in the workspace
   - Parameters: `{ query: string, fileTypes?: string[] }`

3. **API Client Tool** (`api_client`)
   - Makes HTTP requests and handles responses
   - Parameters: `{ url: string, method: string, data?: object }`

### Adding More Tools

Tools are automatically registered when instantiated. Simply create a new tool class and import it:

```javascript
// In tools/index.js
export * from './CodeAnalyzerTool';
export * from './FileSearchTool';
export * from './ApiClientTool';
export * from './YourNewTool'; // Add your tool here
```

## Components

### ToolCard
Displays individual tool execution with status, parameters, and results.

### ToolsList  
Shows a list of tool executions with expandable details.

### ToolsToggle
A switch component to enable/disable tools functionality.

## Services

### chatWithToolsService
Enhanced chat service that handles:
- Tool-enabled message sending
- Streaming responses with tool calls
- Tool execution coordination
- Error handling

## Demo

Run the `ToolsDemo` component to see the system in action:

```jsx
import ToolsDemo from './components/ai/tools/ToolsDemo';

// Renders a complete demo of the tools system
<ToolsDemo />
```

## Integration Notes

1. **Message Format**: Messages with tools include a `tools` array with execution details
2. **Status Tracking**: Tools have status: `pending`, `running`, `completed`, `error`
3. **Error Handling**: Failed tool executions are gracefully handled and displayed
4. **Extensible**: Easy to add new tools without modifying existing code
5. **UI Automatic**: Tool execution UI is automatically generated

## Future Enhancements

- [ ] Tool chaining (output of one tool as input to another)
- [ ] Parallel tool execution
- [ ] Tool result caching
- [ ] Custom tool UI components
- [ ] Tool permissions and access control
- [ ] Integration with backend AI services

This system provides a solid foundation for adding powerful tool capabilities to your AI chat interface, with room for future expansion and customization.
