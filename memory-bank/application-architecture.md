# Application Architecture

## Overview
AI Workflow Utils is a full-stack web application built with React frontend and Node.js backend, designed to automate workflow tasks using AI-powered content generation.

## System Architecture

### High-Level Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React UI      │    │   Node.js API   │    │  External APIs  │
│                 │    │                 │    │                 │
│ • Components    │◄──►│ • Controllers   │◄──►│ • Jira          │
│ • Redux Store   │    │ • Services      │    │ • Bitbucket     │
│ • Material-UI   │    │ • Routes        │    │ • AI Providers  │
│ • Vite Build    │    │ • Middleware    │    │ • Email         │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Technology Stack

#### Frontend
- **React 19.1.0**: Modern functional components with hooks
- **Material-UI 7.2.0**: Complete UI component library
- **Redux Toolkit**: State management with RTK Query
- **Vite**: Build tool and development server
- **Emotion**: CSS-in-JS styling

#### Backend
- **Node.js**: JavaScript runtime
- **Express**: Web framework
- **LangChain**: AI integration framework
- **File System**: JSON-based data storage
- **Multer**: File upload handling

#### External Integrations
- **AI Providers**: OpenAI, Anthropic, Google, Ollama
- **Issue Tracking**: Jira
- **Version Control**: Bitbucket
- **Email**: SMTP services

## Frontend Architecture

### Component Structure
```
ui/src/
├── components/
│   ├── layout/              # Layout components
│   │   ├── Header.jsx
│   │   └── Layout.jsx
│   ├── home/               # Home page components
│   │   ├── ActionCards.jsx
│   │   └── HomeButtons.jsx
│   ├── jira/               # Jira-related components
│   │   ├── CreateJira/
│   │   └── ViewJira/
│   ├── pr/                 # Pull request components
│   ├── email/              # Email components
│   ├── chat/               # Chat interface
│   ├── build/              # Build management
│   ├── settings/           # Settings components
│   │   ├── templates/
│   │   ├── environment/
│   │   ├── general/
│   │   └── advanced/
│   └── common/             # Shared components
├── store/                  # Redux store
│   ├── slices/            # Redux slices
│   └── api/               # RTK Query APIs
├── theme/                 # Material-UI theme
├── hooks/                 # Custom hooks
├── services/              # Frontend services
└── config/                # Configuration
```

### State Management
Redux Toolkit with the following slices:
- **appSlice**: Global application state
- **jiraSlice**: Jira-related state
- **prSlice**: Pull request state
- **emailSlice**: Email state
- **templateSlice**: Template management
- **uiSlice**: UI state (modals, notifications)
- **buildSlice**: Build management state
- **chatSlice**: Chat interface state

### RTK Query APIs
- **jiraApi**: Jira operations
- **prApi**: Pull request operations
- **emailApi**: Email operations
- **templateApi**: Template management
- **environmentSettingsApi**: Configuration
- **buildApi**: Build operations
- **chatApi**: Chat operations

## Backend Architecture

### Directory Structure
```
server/
├── controllers/            # Request handlers
│   ├── jiraController.js
│   ├── prController.js
│   ├── emailController.js
│   ├── templateController.js
│   ├── environmentSettingsController.js
│   ├── chatController.js
│   └── htmlParser.js
├── services/              # Business logic
│   ├── langchainService.js
│   ├── templateDbService.js
│   ├── environmentDbService.js
│   └── configBridge.js
├── routes/                # API routes
│   ├── jiraRoutes.js
│   ├── prRoutes.js
│   ├── emailRoutes.js
│   ├── templateRoutes.js
│   ├── environmentSettingsRoutes.js
│   ├── buildRoutes.js
│   └── chatRoutes.js
├── middleware/            # Express middleware
├── data/                  # Static data
│   ├── config.json
│   └── defaultTemplates.json
├── utils/                 # Utility functions
└── logs/                  # Application logs
```

### API Layer
RESTful API design with the following endpoints:

#### Jira API
- `POST /api/jira/preview` - Generate Jira preview
- `POST /api/jira/create` - Create Jira issue
- `GET /api/jira/:id` - Fetch Jira details
- `POST /api/jira/upload` - Upload attachment

#### Template API
- `GET /api/templates` - List templates
- `POST /api/templates` - Create template
- `PUT /api/templates/:id` - Update template
- `DELETE /api/templates/:id` - Delete template

#### Environment Settings API
- `GET /api/environment-settings` - Get settings
- `PUT /api/environment-settings` - Update settings
- `GET /api/environment-settings/config` - Get provider config
- `GET /api/environment-settings/providers` - Get provider status

### Data Storage
File-based storage system:
- **Templates**: `~/.ai-workflow-utils/templates.json`
- **Environment Settings**: `~/.ai-workflow-utils/config.json`
- **Uploads**: `./uploads/` directory
- **Logs**: `./server/logs/` directory

## Integration Architecture

### AI Provider Integration
```javascript
// LangChain service abstraction
class LangChainService {
  async generateContent(prompt, imageData, template) {
    // Provider-agnostic content generation
  }
  
  async analyzeImage(imageBuffer) {
    // Image analysis across providers
  }
}
```

Supported providers:
- **OpenAI**: GPT models with vision
- **Anthropic**: Claude models
- **Google**: Gemini models
- **Ollama**: Local models

### External API Integration
- **Jira REST API**: Issue creation and management
- **Bitbucket API**: Pull request operations
- **SMTP**: Email sending
- **File Upload**: Multer middleware

## Security Architecture

### Authentication & Authorization
- Environment-based API key management
- Secure credential storage
- API key masking in responses

### Data Protection
- Sensitive data encryption
- File upload validation
- CORS configuration
- Input sanitization

### Error Handling
- Global error middleware
- Structured error responses
- Logging and monitoring

## Performance Architecture

### Frontend Optimizations
- Component memoization with React.memo
- Redux selector memoization
- RTK Query caching
- Vite build optimizations

### Backend Optimizations
- File-based storage for fast access
- Efficient file upload handling
- Response compression
- Request rate limiting

### Caching Strategy
- RTK Query automatic caching
- Template caching in memory
- Configuration caching
- Static asset caching

## Deployment Architecture

### Development Environment
```bash
# Frontend development server
npm run dev:ui

# Backend development server
npm run dev:server

# Full development stack
npm run dev
```

### Production Build
```bash
# Build frontend
npm run build:ui

# Start production server
npm start
```

### Environment Configuration
- `.env` files for environment variables
- Runtime configuration through settings API
- Provider-specific configuration
- Feature flags support

## Monitoring & Logging

### Application Logging
- Winston logger integration
- Structured log format
- Log rotation and archival
- Error tracking

### Performance Monitoring
- Request/response timing
- Memory usage tracking
- File upload metrics
- API response times

## Scalability Considerations

### Current Limitations
- File-based storage (single instance)
- In-memory caching
- Local file uploads

### Future Scalability Options
- Database migration (PostgreSQL/MongoDB)
- Redis caching layer
- Cloud storage integration
- Microservices architecture
- Container deployment

## Development Workflow

### Code Organization
- Feature-based component organization
- Service layer abstraction
- Consistent naming conventions
- TypeScript migration path

### Build Process
- Vite for fast development builds
- Hot module replacement
- Source map generation
- Bundle optimization

### Testing Strategy
- Unit tests for components and services
- Integration tests for API endpoints
- E2E tests for user workflows
- Mock service providers for testing

## Configuration Management

### Environment Settings
Dynamic configuration through UI:
- AI provider selection
- API credentials
- Service endpoints
- Feature toggles

### Template System
Customizable content templates:
- Variable substitution
- Issue type specific templates
- Default template management
- Template validation

This architecture provides a solid foundation for the AI Workflow Utils application while maintaining flexibility for future enhancements and scalability requirements.
