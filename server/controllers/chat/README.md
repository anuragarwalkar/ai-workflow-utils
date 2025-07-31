# Chat Controller Module

## Overview
The Chat Controller module provides AI-powered chat functionality with support for multiple AI providers and streaming responses. It follows the modular architecture pattern with clear separation of concerns.

## Architecture

### Structure
```
server/controllers/chat/
├── chat-controller.js          # Main orchestrator (delegates to services)
├── index.js                   # Clean module exports
├── README.md                  # This documentation
├── models/
│   └── chat-message.js        # Data models with validation
├── services/
│   ├── chat-service.js        # Business logic coordination
│   ├── openai-service.js      # OpenAI API interactions
│   └── ollama-service.js      # Ollama API interactions
├── processors/
│   ├── streaming-processor.js # Real-time SSE handling
│   └── message-processor.js   # Message formatting utilities
└── utils/
    ├── chat-config.js         # Configuration management
    └── error-handler.js       # Error handling utilities
```

## Features

### AI Provider Support
- **OpenAI Compatible**: Supports OpenAI API and compatible services (Anthropic via OpenAI-compatible endpoint)
- **Ollama**: Local LLM hosting support
- **Automatic Fallback**: Falls back to secondary provider if primary fails

### Response Types
- **Standard**: Regular JSON responses for simple chat interactions
- **Streaming**: Server-Sent Events (SSE) for real-time streaming responses

### Provider Configuration
- Dynamic provider switching based on environment configuration
- Health checks for provider availability
- Configuration validation

## API Endpoints

### POST `/api/chat/message`
Send a chat message and receive AI response.

**Request Body:**
```json
{
  "message": "Hello, how can you help me?",
  "conversationHistory": [
    {
      "role": "user",
      "content": "Previous message"
    },
    {
      "role": "assistant", 
      "content": "Previous response"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "response": "AI generated response",
  "provider": "OpenAI Compatible",
  "timestamp": "2025-07-31T10:00:00.000Z"
}
```

### POST `/api/chat/stream`
Send a chat message and receive streaming AI response via Server-Sent Events.

**Request Body:** Same as `/message`

**Response:** Stream of SSE events:
```
data: {"type":"status","message":"Starting chat response...","provider":"Initializing"}

data: {"type":"chunk","content":"Hello"}

data: {"type":"chunk","content":" there!"}

data: {"type":"complete","response":"Hello there!","provider":"OpenAI Compatible"}
```

### GET `/api/chat/config`
Get chat configuration and available providers.

**Response:**
```json
{
  "success": true,
  "data": {
    "availableProviders": ["OpenAI Compatible", "Ollama"],
    "openaiConfigValid": true,
    "ollamaConfigValid": true
  }
}
```

### GET `/api/chat/health`
Check health status of AI providers.

**Response:**
```json
{
  "success": true,
  "data": {
    "openai": {
      "configured": true,
      "status": "ready"
    },
    "ollama": {
      "configured": true,
      "status": "ready"
    }
  }
}
```

## Module Responsibilities

### Controllers
- **ChatController**: Main orchestrator that handles HTTP requests/responses and delegates to services

### Services
- **ChatService**: Coordinates between different AI providers with automatic fallback
- **OpenAIService**: Handles OpenAI-compatible API interactions
- **OllamaService**: Handles Ollama local LLM interactions

### Processors
- **StreamingProcessor**: Manages Server-Sent Events for real-time responses
- **MessageProcessor**: Handles message formatting and conversation management

### Models
- **ChatMessage**: Data validation, structure definition, and provider format conversion
- **ChatResponse**: Standardized response format

### Utils
- **ChatProviderConfig**: Configuration management and validation
- **ErrorHandler**: Centralized error handling with context-aware processing

## Usage Examples

### Import the Controller
```javascript
// Import the full controller (backward compatibility)
import { ChatController } from './controllers/chat/index.js';

// Import specific services for targeted operations
import { ChatService, OpenAIService } from './controllers/chat/index.js';

// Import utilities for configuration
import { ChatProviderConfig, ErrorHandler } from './controllers/chat/index.js';
```

### Use in Routes
```javascript
import express from 'express';
import { ChatController } from '../controllers/chat/index.js';

const router = express.Router();

router.post('/message', ChatController.sendChatMessage);
router.post('/stream', ChatController.sendChatMessageStreaming);
router.get('/config', ChatController.getChatConfig);
router.get('/health', ChatController.checkProviderHealth);

export default router;
```

## Environment Configuration

Required environment variables:

### OpenAI Compatible Provider
```bash
OPENAI_COMPATIBLE_BASE_URL=https://api.openai.com/v1
OPENAI_COMPATIBLE_API_KEY=your-api-key
OPENAI_COMPATIBLE_MODEL=gpt-3.5-turbo
```

### Ollama Provider
```bash
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama2
```

## Error Handling

The module provides comprehensive error handling:

- **Validation Errors**: Input validation with descriptive messages
- **Provider Errors**: AI service-specific error handling
- **Network Errors**: Connection and timeout error management
- **Rate Limiting**: Automatic detection and user-friendly messages
- **Authentication**: API key validation and error reporting

## Migration from Legacy Controller

The modular controller maintains backward compatibility. To migrate:

1. Update imports from named exports to default export:
   ```javascript
   // Old
   import { sendChatMessage } from '../controllers/chatController.js';
   
   // New
   import { ChatController } from '../controllers/chat/index.js';
   // Use: ChatController.sendChatMessage
   ```

2. Update route handlers:
   ```javascript
   // Old
   router.post('/message', sendChatMessage);
   
   // New
   router.post('/message', ChatController.sendChatMessage);
   ```

3. The API remains the same - no client-side changes needed.
