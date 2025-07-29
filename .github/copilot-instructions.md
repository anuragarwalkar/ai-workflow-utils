# GitHub Copilot Instructions for AI Workflow Utils

## Project Overview
AI Workflow Utils is a comprehensive automation platform that streamlines software development workflows by integrating AI-powered content generation with popular development tools like Jira, Bitbucket, and email systems.

## Architecture
- **Backend**: Node.js/Express server with WebSocket support
- **Frontend**: React with Vite, Material-UI components, Redux Toolkit for state management
- **Database**: LowDB for local storage (~/.ai-workflow-utils/)
- **AI Integration**: LangChain with multiple providers (OpenAI, Anthropic, Google Gemini, Ollama)
- **Build**: Webpack for server, Vite for UI

## Project Structure
```
├── bin/                    # CLI entry points
├── server/                 # Backend Express server
│   ├── controllers/        # Route handlers (modular structure)
│   │   ├── pr/             # Pull Request controller (modular)
│   │   │   ├── models/     # Data models and validation
│   │   │   ├── services/   # Business logic services
│   │   │   ├── processors/ # Data processing utilities
│   │   │   ├── utils/      # Common utilities
│   │   │   ├── prController.js  # Main PR orchestrator
│   │   │   ├── index.js    # Module exports
│   │   │   └── README.md   # Module documentation
│   │   ├── chatController.js
│   │   ├── emailController.js
│   │   ├── jiraController.js
│   │   └── prController.js # Backward compatibility layer
│   ├── services/          # Business logic
│   ├── routes/            # API routes
│   ├── middleware/        # Express middleware
│   └── data/              # Configuration files
├── ui/                    # React frontend
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── store/         # Redux store and API
│   │   ├── services/      # Frontend services
│   │   └── hooks/         # Custom React hooks
└── uploads/               # File uploads directory
```

## Coding Standards & Conventions

### Backend (Node.js/Express)
- Use ES6+ syntax with CommonJS modules
- Async/await for asynchronous operations
- Express router pattern for routes
- Winston for logging
- Environment variables for configuration
- LowDB for data persistence
- Socket.IO for real-time communication
- **Modular Architecture**: Use the PR controller pattern for complex features
  - Separate concerns into models, services, processors, and utilities
  - Single responsibility principle for each module
  - Maintain backward compatibility through index exports

### Frontend (React)
- Functional components with hooks
- Material-UI for UI components
- Redux Toolkit Query for API calls
- CSS-in-JS with emotion/styled
- File naming: PascalCase for components, camelCase for utilities
- Use React Router v6+ for navigation
- Lazy load all route components using React.lazy and Suspense for performance

### Key Technologies
- **AI/LLM**: LangChain framework for AI integration
  - **LangChain Core**: Base abstractions and interfaces
  - **LangChain OpenAI**: OpenAI provider integration
  - **LangChain Google GenAI**: Google Gemini provider integration
  - **LangChain Ollama**: Local Ollama provider integration
  - **LangChain Anthropic**: Anthropic Claude integration via OpenAI-compatible API
- **State Management**: Redux Toolkit + RTK Query
- **UI Framework**: Material-UI v5+
- **Build Tools**: Webpack (server), Vite (client)
- **Routing**: React Router v6+ (all navigation)
- **Code Splitting**: Lazy load all route components
- **Development**: Nodemon, Concurrently for parallel processes

## Configuration Management
- All environment settings and sensitive keys are stored in `~/.ai-workflow-utils/environment.json`
- Schema-driven configuration with provider options
- Dynamic provider switching (AI, Repository, Issue tracking) via `ai_provider`, `repository_provider`, `issue_provider` keys
- Settings API for CRUD operations

## API Patterns
- RESTful endpoints under `/api/`
- Consistent response format: `{ success: boolean, data: any, error?: string }`
- Error handling middleware
- CORS enabled for development

### Key API Endpoints
- `/api/environment-settings` - Configuration management
- `/api/chat` - AI chat interactions
- `/api/email` - Email operations
- `/api/jira` - Jira integration
- `/api/pr` - Pull request operations
- `/api/templates` - Template management

## Modular Architecture Patterns

### PR Controller Module Structure
The PR controller follows a modular architecture with clear separation of concerns:

```
server/controllers/pr/
├── prController.js          # Main orchestrator (delegates to services)
├── index.js                 # Clean module exports
├── README.md               # Module documentation
├── models/
│   └── PullRequest.js      # Data models with validation
├── services/
│   ├── bitbucketService.js    # External API interactions
│   ├── diffProcessorService.js # Business logic coordination
│   ├── prContentService.js    # AI-powered content generation
│   └── streamingService.js    # Real-time SSE handling
├── processors/
│   ├── unidiffProcessor.js        # Data transformation utilities
│   ├── bitbucketDiffProcessor.js  # Format-specific processing
│   └── legacyDiffProcessor.js     # Backward compatibility
└── utils/
    ├── constants.js           # Module constants
    ├── environmentConfig.js   # Configuration management
    ├── errorHandler.js        # Error handling utilities
    └── templateService.js     # Template operations
```

### Module Responsibilities
- **Controllers**: Orchestrate operations, handle HTTP requests/responses
- **Services**: Contain business logic, coordinate between different systems
- **Processors**: Transform and process data (diffs, formats, etc.)
- **Models**: Data validation, structure definition, payload generation
- **Utils**: Common utilities, configuration, error handling, constants

### Modular Import Patterns
```javascript
// Import the full controller (backward compatibility)
import { PRController } from './controllers/pr/index.js';

// Import specific services for targeted operations
import { BitbucketService, PRContentService } from './controllers/pr/index.js';

// Import individual processors for data transformation
import { UnidiffProcessor } from './controllers/pr/index.js';

// Import utilities for common operations
import { ErrorHandler, EnvironmentConfig } from './controllers/pr/index.js';
```

## Component Patterns

### React Components
- Use Material-UI components consistently
- Implement proper error boundaries
- Loading states with CircularProgress
- Form handling with controlled components
- Real-time updates via Socket.IO
- Use React Router for navigation
- Lazy load all route components

### State Management
- RTK Query for server state
- Local state for UI-only concerns
- Optimistic updates where appropriate

## LangChain Integration Patterns

### LangChain Service Architecture
- **Centralized Service**: `server/services/langchainService.js` handles all AI interactions
- **Provider Abstraction**: Unified interface for different AI providers
- **Dynamic Provider Switching**: Runtime selection based on user configuration
- **Chain Composition**: Use LangChain chains for complex AI workflows

### AI Provider Implementation
```javascript
// LangChain provider pattern
const createProvider = (providerType, config) => {
  switch (providerType) {
    case 'openai':
      return new ChatOpenAI({ ...config })
    case 'anthropic':
      return new ChatOpenAI({ baseURL: 'https://api.anthropic.com', ...config })
    case 'google':
      return new ChatGoogleGenerativeAI({ ...config })
    case 'ollama':
      return new ChatOllama({ ...config })
  }
}
```

### Common LangChain Patterns
- **Chat Models**: Use for conversational AI interactions
- **Prompts**: Template-based prompt management
- **Chains**: Sequential AI operations
- **Memory**: Conversation history management
- **Output Parsers**: Structured response handling

## Provider Integration
The application supports multiple providers for different services:

### AI Providers
- **Anthropic Claude** (recommended): Uses OpenAI-compatible API
- **OpenAI GPT**: Direct OpenAI API integration
- **Google Gemini**: Google AI integration
- **Ollama**: Local LLM hosting

### Repository Providers
- **Bitbucket/GitStash**: Primary git repository integration
- **GitHub**: (Coming soon)
- **GitLab**: (Coming soon)

### Issue Tracking
- **Jira**: Primary issue tracking integration
- **Linear**: (Coming soon)
- **GitHub Issues**: (Coming soon)

## Development Workflow
- `npm run dev` - Start development servers (backend + frontend)
- `npm run build` - Build for production
- `npm run start` - Start production server
- Hot reload enabled for both frontend and backend

## Testing Considerations
- No test framework currently configured
- When adding tests, consider Jest for unit tests
- React Testing Library for component tests
- Supertest for API endpoint testing

## Security & Best Practices
- API keys stored securely in environment configuration
- Sensitive data masked in UI (password fields)
- CORS configuration for cross-origin requests
- Input validation and sanitization
- Error messages that don't expose sensitive information

## Common Patterns to Follow

### Modular Service Pattern
```javascript
// Service class with static methods for stateless operations
class BitbucketService {
  static async getPullRequests(projectKey, repoSlug) {
    const { bitbucketUrl, authToken } = EnvironmentConfig.get();
    // Implementation
  }
  
  static async createPullRequest(projectKey, repoSlug, payload) {
    // Implementation with proper error handling
  }
}
```

### Data Model Pattern
```javascript
// Model with validation and payload generation
class PullRequest {
  constructor(data) {
    this.title = data.title;
    this.description = data.description;
  }
  
  static validate(data) {
    const required = ['title', 'description', 'fromBranch'];
    const missing = required.filter(field => !data[field]);
    if (missing.length > 0) {
      throw new Error(`Missing required fields: ${missing.join(', ')}`);
    }
  }
  
  toBitbucketPayload() {
    return {
      title: this.title,
      description: this.description,
      // Transform to external API format
    };
  }
}
```

### Processor Pattern
```javascript
// Stateless processors for data transformation
class UnidiffProcessor {
  static processWithUnidiff(diffData) {
    try {
      // Process and transform data
      return { codeChanges, hasChanges };
    } catch (error) {
      logger.warn("Processing failed:", error.message);
      return { codeChanges: "", hasChanges: false };
    }
  }
}
```

### Error Handling
```javascript
try {
  const result = await operation();
  res.json({ success: true, data: result });
} catch (error) {
  ErrorHandler.handleApiError(error, "operation context", res);
}
```

### React Component Structure
```jsx
const ComponentName = () => {
  // Hooks
  const [state, setState] = useState();
  const { data, isLoading, error } = useApiQuery();
  // Event handlers
  const handleAction = () => {};
  // Render conditions
  if (isLoading) return <CircularProgress />;
  if (error) return <Alert severity="error">{error.message}</Alert>;
  return (
    <Box>
      {/* Component content */}
    </Box>
  );
};
```

### API Service Pattern
```javascript
// RTK Query API slice
export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({ baseUrl: '/api/' }),
  tagTypes: ['Settings', 'Templates'],
  endpoints: (builder) => ({
    getSettings: builder.query({
      query: () => 'environment-settings',
      providesTags: ['Settings']
    })
  })
})
```

## Performance Considerations
- Lazy loading for large components and all route components
- Memoization for expensive calculations
- Debounced inputs for search/filter operations
- Pagination for large data sets
- WebSocket connections for real-time features

## Deployment Notes
- Files to include in package: dist/, ui/dist/, bin/, README.md, LICENSE
- Environment configuration persists in user directory
- CLI tool available as `ai-workflow-utils` command
- Requires Node.js >=16.0.0

When providing suggestions or generating code:
1. Follow the established patterns and conventions
2. Use the appropriate technology stack components
3. Maintain consistency with existing code style
4. Consider the provider-based architecture
5. Include proper error handling and loading states
6. Use Material-UI components for consistency
7. Follow the API response format standards
8. **Use modular architecture patterns for complex features**:
   - Separate concerns into appropriate modules (controllers, services, processors, models, utils)
   - Maintain single responsibility principle
   - Use static methods for stateless operations
   - Implement proper data validation in models
   - Keep backward compatibility through index exports
   - Add comprehensive documentation for new modules
