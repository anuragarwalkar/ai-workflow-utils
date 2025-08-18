# Natural Language to API Request Feature

This document describes the implementation of the Natural Language to API Request functionality for the AI Workflow Utils project.

## Overview

Users can now describe API requests in natural language, and the system will generate the corresponding API request configuration using AI.

## Example Usage

User can type:
- "Send a POST request to create a new user with name Anurag and email test@test.com"
- "Get all users from the API"  
- "Update user ID 123 with new email"
- "Delete user with ID 456"

## Backend Implementation

### 1. LangChain API Client Service (`LangChainApiClientService.js`)
- Extends `BaseLangChainService` for AI provider management
- Uses Zod schema for structured output validation
- Supports streaming responses
- Handles multiple AI providers (OpenAI, Claude, Gemini, Ollama)

### 2. API Controller (`api-client-controller.js`)
- New endpoint: `POST /api/api-client/convert-nl`
- Supports both streaming and regular responses
- Validates generated API requests
- Proper error handling

### 3. Routes (`api-client-routes.js`)
- Added route for natural language conversion
- Integrated with existing API client routes

### 4. Template System (`defaultTemplates.json`)
- New template type: `API_CLIENT_NL`
- Comprehensive prompt engineering for API request generation
- Supports variable substitution

## Frontend Implementation

### 1. Natural Language API Generator (`NaturalLanguageApiGenerator.jsx`)
- React component for natural language input
- Real-time API request generation
- Example prompts for user guidance
- Error handling and success feedback

### 2. Enhanced AI Panel (`ApiClientAiPanel.jsx`)
- Integrated natural language generator
- Collapsed/expanded states
- Glass morphism design

### 3. API Client Integration (`ApiClient.jsx`)
- Automatic request creation from generated data
- Seamless integration with existing request management

## API Endpoints

### Convert Natural Language to API Request
```http
POST /api/api-client/convert-nl
Content-Type: application/json

{
  "prompt": "Send a POST request to create a new user with name Anurag and email test@test.com",
  "streaming": false
}
```

### Response Format
```json
{
  "success": true,
  "apiRequest": {
    "method": "POST",
    "url": "https://api.example.com/users",
    "headers": {
      "Content-Type": "application/json"
    },
    "params": {},
    "body": {
      "name": "Anurag",
      "email": "test@test.com"
    },
    "bodyType": "json",
    "auth": {
      "type": "none"
    },
    "description": "Create a new user with the provided name and email"
  },
  "provider": "OpenAI ChatGPT",
  "originalPrompt": "Send a POST request to create a new user with name Anurag and email test@test.com"
}
```

## Dependencies Added

- `zod` - For schema validation and structured output parsing

## Testing

Use the test script to verify functionality:
```bash
node server/test-api-nl.js
```

## Configuration

Ensure AI providers are configured in environment variables:
- `OPENAI_API_KEY` - OpenAI API key
- `OPENAI_COMPATIBLE_BASE_URL` - Alternative API base URL
- `GOOGLE_API_KEY` - Google Gemini API key
- `OLLAMA_BASE_URL` - Ollama server URL

## Features

✅ **Natural Language Processing**: Convert plain English to API requests
✅ **Multiple AI Providers**: Support for OpenAI, Claude, Gemini, Ollama
✅ **Structured Output**: Validated JSON schema for API requests
✅ **Streaming Support**: Real-time response generation
✅ **Template System**: Customizable prompts for better results
✅ **Error Handling**: Comprehensive error handling and validation
✅ **UI Integration**: Seamless frontend integration with existing API client
✅ **Example Prompts**: Pre-built examples for user guidance

## Future Enhancements

- [ ] Support for authentication detection from natural language
- [ ] API documentation integration for better URL inference
- [ ] History of generated requests
- [ ] Export/import of natural language prompts
- [ ] Multi-step API workflow generation
