// Main Chat Controller (modular version)
export { default as ChatController } from './chat-controller.js';
export * from './chat-controller.js';

// Services
export { default as ChatService } from './services/chat-service.js';
export { default as OpenAIService } from './services/openai-service.js';
export { default as OllamaService } from './services/ollama-service.js';

// Processors
export { default as StreamingProcessor } from './processors/streaming-processor.js';
export { default as MessageProcessor } from './processors/message-processor.js';

// Models
export { ChatMessage, ChatResponse } from './models/chat-message.js';
export { default as ChatMessageModel } from './models/chat-message.js';

// Utils
export { ChatProviderConfig, ChatConstants } from './utils/chat-config.js';
export { ErrorHandler } from './utils/error-handler.js';
