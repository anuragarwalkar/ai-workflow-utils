# Environment Controller Module

## Overview
The Environment Controller module manages all environment settings and configuration operations in the AI Workflow Utils application. It follows the established modular architecture pattern with clear separation of concerns.

## Architecture

### Structure
```
server/controllers/environment/
├── environmentController.js    # Main orchestrator
├── index.js                   # Clean module exports
├── README.md                 # This documentation
├── models/
│   └── EnvironmentRequest.js  # Request data models and validation
├── services/
│   ├── environmentConfigService.js    # Core configuration management
│   └── providerConnectionService.js   # Provider connection testing
├── processors/
│   └── configurationProcessor.js      # Data transformation utilities
└── utils/
    ├── constants.js           # Module constants
    └── errorHandler.js        # Error handling utilities
```

### Module Responsibilities

#### Controllers
- **environmentController.js**: Main orchestrator that handles HTTP requests/responses and delegates to services

#### Models
- **EnvironmentRequest.js**: Handles request data validation and filtering of environment settings updates

#### Services
- **environmentConfigService.js**: Core business logic for configuration management, database operations, and service coordination
- **providerConnectionService.js**: Handles testing connections to various providers (AI, repository, issue tracking)

#### Processors
- **configurationProcessor.js**: Data transformation utilities for configuration display, storage, and validation

#### Utils
- **errorHandler.js**: Centralized error handling with consistent API responses
- **constants.js**: Module constants including provider types, required fields, and status codes

## API Endpoints

### GET /api/environment-settings
Get current configuration settings.

### PUT /api/environment-settings
Update configuration settings with validation.

### GET /api/environment-settings/providers
Get available providers and their status.

### GET /api/environment-settings/config
Get provider configuration metadata.

### POST /api/environment-settings/test
Test API connections for specific providers.

### GET /api/environment-settings/defaults
Get default configuration values.

### POST /api/environment-settings/reset
Reset settings to default configuration.

### GET /api/environment-settings/schema
Get configuration schema definition.

### POST /api/environment-settings/export
Export current settings.

### POST /api/environment-settings/import
Import settings from provided data.

## Usage Examples

### Import the Full Controller
```javascript
import { EnvironmentController } from './controllers/environment/index.js';
```

### Import Specific Services
```javascript
import { EnvironmentConfigService, ProviderConnectionService } from './controllers/environment/index.js';
```

### Import Individual Components
```javascript
import { ConfigurationProcessor } from './controllers/environment/index.js';
import { ErrorHandler, PROVIDER_TYPES } from './controllers/environment/index.js';
```

### Backward Compatibility
```javascript
import environmentController from './controllers/environment/index.js';
// Uses singleton instance for existing route compatibility
```

## Provider Support

### AI Providers
- OpenAI (with compatible APIs)
- Anthropic Claude
- Google Gemini
- Ollama (local)

### Repository Providers
- Bitbucket/GitStash
- GitHub (planned)
- GitLab (planned)

### Issue Tracking Providers
- Jira
- Linear (planned)
- GitHub Issues (planned)

## Configuration Management

The module integrates with:
- **environmentDbService**: Database operations for persistent storage
- **configBridge**: Environment variable loading and configuration bridge
- **langchainService**: AI provider initialization and management

## Error Handling

The module provides consistent error handling with:
- Standardized API error responses
- Appropriate HTTP status codes
- Detailed error logging
- Validation error handling
- Connection test error management

## Security Considerations

- Sensitive fields are automatically masked in API responses
- Configuration validation prevents invalid settings
- Error messages don't expose sensitive information
- Provider connection testing validates credentials safely

## Future Enhancements

- Actual connection testing implementation (currently mock)
- Additional provider support (GitHub, GitLab, Linear)
- Real-time configuration validation
- Configuration backup and restore
- Audit logging for configuration changes
