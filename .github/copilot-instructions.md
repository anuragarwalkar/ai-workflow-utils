# GitHub Copilot Instructions for AI Workflow Utils

## Project Overview

AI Workflow Utils is a comprehensive automation platform that streamlines
software development workflows by integrating AI-powered content generation with
popular development tools like Jira, Bitbucket, and email systems. Features include
AI-powered Jira ticket creation, pull request automation, universal API client with
natural language processing, MCP (Model Context Protocol) integration, and
comprehensive logging/monitoring.

## Architecture

- **Backend**: Node.js/Express server with WebSocket support (ES modules)
- **Frontend**: React with Vite, Material-UI components, Redux Toolkit for state
  management
- **Database**: LowDB for local storage (~/.ai-workflow-utils/)
- **AI Integration**: LangChain with multiple providers (OpenAI, Anthropic,
  Google Gemini, Ollama)
- **Build**: Webpack for server, Vite for UI
- **CLI**: Global command with startup service management capabilities

## Project Structure

```
├── bin/                    # CLI entry points (startup service management)
├── server/                 # Backend Express server (ES modules)
│   ├── controllers/        # Route handlers (modular + simple patterns)
│   │   ├── pull-request/   # Pull Request controller (full modular)
│   │   │   ├── models/     # Data models and validation
│   │   │   ├── services/   # Business logic services
│   │   │   ├── processors/ # Data processing utilities
│   │   │   ├── utils/      # Common utilities
│   │   │   └── pull-request-controller.js
│   │   ├── chat/           # Chat controller (modular)
│   │   ├── api-client/     # Universal API client (simple structure)
│   │   ├── mcp/           # Model Context Protocol integration
│   │   ├── logs/          # Real-time logging and monitoring
│   │   ├── jira/          # Jira integration
│   │   ├── email/         # Email automation
│   │   ├── environment/   # Configuration management
│   │   └── template/      # Template management
│   ├── services/          # Business logic & LangChain integration
│   ├── routes/            # API routes
│   ├── middleware/        # Express middleware
│   ├── mocks/            # Development mocking system
│   └── data/              # Configuration files
├── ui/                    # React frontend
│   ├── src/
│   │   ├── components/    # React components (lazy-loaded routes)
│   │   ├── store/         # Redux store and API
│   │   ├── routes/        # Route definitions with lazy loading
│   │   ├── services/      # Frontend services
│   │   └── hooks/         # Custom React hooks
└── uploads/               # File uploads directory
```

## Coding Standards & Conventions

### Backend (Node.js/Express)

- **ES Modules**: Use `import/export` syntax (`"type": "module"` in package.json)
- Async/await for asynchronous operations
- Express router pattern for routes
- Winston for logging
- Environment variables for configuration
- LowDB for data persistence
- Socket.IO for real-time communication
- **Modular Architecture**: Complex features use modular pattern (pull-request, chat)
- **Simple Architecture**: Basic features use single controller files (api-client, mcp)
- **Backward Compatibility**: Maintain through index exports and legacy controllers

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
  - **LangChain Anthropic**: Anthropic Claude integration via OpenAI-compatible
    API
- **State Management**: Redux Toolkit + RTK Query
- **UI Framework**: Material-UI v5+
- **Build Tools**: Webpack (server), Vite (client)
- **Routing**: React Router v6+ (all navigation)
- **Code Splitting**: Lazy load all route components
- **Development**: Nodemon, Concurrently for parallel processes

## Configuration Management

- All environment settings and sensitive keys are stored in
  `~/.ai-workflow-utils/environment.json`
- Schema-driven configuration with provider options
- Dynamic provider switching (AI, Repository, Issue tracking) via `ai_provider`,
  `repository_provider`, `issue_provider` keys
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
- `/api/api-client` - Universal API client with natural language processing
- `/api/mcp` - Model Context Protocol integration
- `/api/logs` - Real-time logging and monitoring

## Modular Architecture Patterns

### PR Controller Module Structure

The PR controller follows a modular architecture with clear separation of
concerns:

```
server/controllers/pull-request/
├── pull-request-controller.js  # Main orchestrator (delegates to services)
├── index.js                    # Clean module exports
├── README.md                  # Module documentation
├── models/
│   └── PullRequest.js         # Data models with validation
├── services/
│   ├── bitbucketService.js       # External API interactions
│   ├── diffProcessorService.js   # Business logic coordination
│   ├── prContentService.js       # AI-powered content generation
│   └── streamingService.js       # Real-time SSE handling
├── processors/
│   ├── unidiffProcessor.js            # Data transformation utilities
│   ├── bitbucketDiffProcessor.js      # Format-specific processing
│   └── legacyDiffProcessor.js         # Backward compatibility
└── utils/
    ├── constants.js               # Module constants
    ├── environmentConfig.js       # Configuration management
    ├── errorHandler.js            # Error handling utilities
    └── templateService.js         # Template operations
```

### Module Responsibilities

- **Controllers**: Orchestrate operations, handle HTTP requests/responses
- **Services**: Contain business logic, coordinate between different systems
- **Processors**: Transform and process data (diffs, formats, etc.)
- **Models**: Data validation, structure definition, payload generation
- **Utils**: Common utilities, configuration, error handling, constants

### Modular Import Patterns

```javascript
// ES Module imports (note: using ES modules, not CommonJS)
import { PRController } from "./controllers/pull-request/index.js";

// Import specific services for targeted operations
import { BitbucketService, PRContentService } from "./controllers/pull-request/index.js";

// Import individual processors for data transformation
import { UnidiffProcessor } from "./controllers/pull-request/index.js";

// Import utilities for common operations
import { ErrorHandler, EnvironmentConfig } from "./controllers/pull-request/index.js";

// Simple controller imports (non-modular)
import { convertNaturalLanguageToApi } from "./controllers/api-client/api-client-controller.js";
import { getMcpClients } from "./controllers/mcp/mcp-controller.js";
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

- **Centralized Service**: `server/services/langchainService.js` handles all AI
  interactions
- **Provider Abstraction**: Unified interface for different AI providers
- **Dynamic Provider Switching**: Runtime selection based on user configuration
- **Chain Composition**: Use LangChain chains for complex AI workflows

### AI Provider Implementation

```javascript
// LangChain provider pattern
const createProvider = (providerType, config) => {
  switch (providerType) {
    case "openai":
      return new ChatOpenAI({ ...config });
    case "anthropic":
      return new ChatOpenAI({
        baseURL: "https://api.anthropic.com",
        ...config,
      });
    case "google":
      return new ChatGoogleGenerativeAI({ ...config });
    case "ollama":
      return new ChatOllama({ ...config });
  }
};
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
- `npm run dev-server` - Start only backend in dev mode
- `npm run build` - Build for production (webpack + vite)
- `npm run start` - Start production server
- `ai-workflow-utils` - Global CLI command
- `ai-workflow-utils startup install` - Install as system service
- `ai-workflow-utils startup start/stop/restart` - Service management
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

### Universal API Client Pattern

```javascript
// Natural language to API conversion
export const convertNaturalLanguageToApi = async (req, res) => {
  const { prompt, streaming = false } = req.body;
  
  if (streaming) {
    // Server-Sent Events setup
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    });
    
    // Stream AI responses
    const streamCallback = (data) => {
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    };
  }
  
  // Use LangChain service for AI processing
  await langchainApiClientService.generateApiRequest(prompt, streamCallback);
};
```

### MCP Integration Pattern

```javascript
// Model Context Protocol client management
export const createMcpClient = async (req, res) => {
  try {
    const clientConfig = req.body;
    const result = await mcpService.createClient(clientConfig);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
```

### Real-time Logging Pattern

```javascript
// WebSocket-based log streaming
export const streamLogs = (io) => {
  const logStream = createLogStream();
  
  logStream.on('data', (logEntry) => {
    io.emit('log-entry', {
      timestamp: logEntry.timestamp,
      level: logEntry.level,
      message: logEntry.message
    });
  });
};
```

### CLI and Service Management Pattern

```javascript
// CLI entry point with service management
async function main() {
  const args = process.argv.slice(2);
  
  // Handle startup commands
  if (args[0] === 'startup') {
    const startupScript = path.join(packageDir, 'bin', 'startup.js');
    const startupProcess = spawn('node', [startupScript, ...args.slice(1)], {
      stdio: 'inherit',
      cwd: packageDir,
    });
    return;
  }
  
  // Default: start the server
  const serverProcess = spawn('node', [serverPath], {
    stdio: 'inherit',
    cwd: packageDir,
  });
}
```

### Natural Language Processing Pattern

```javascript
// Template-driven prompt engineering
const generateApiRequestPrompt = (userPrompt, examples) => {
  return `Convert this natural language request into an API configuration:
User: "${userPrompt}"

Examples:
${examples.map(ex => `- "${ex.input}" -> ${JSON.stringify(ex.output)}`).join('\n')}

Generate a JSON response with method, url, headers, and body.`;
};
```

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
    const required = ["title", "description", "fromBranch"];
    const missing = required.filter(field => !data[field]);
    if (missing.length > 0) {
      throw new Error(`Missing required fields: ${missing.join(", ")}`);
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
  res.json(result);
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
  if (error) return <Alert severity='error'>{error.message}</Alert>;
  return <Box>{/* Component content */}</Box>;
};
```

### API Service Pattern

```javascript
// RTK Query API slice
export const apiSlice = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({ baseUrl: "/api/" }),
  tagTypes: ["Settings", "Templates"],
  endpoints: builder => ({
    getSettings: builder.query({
      query: () => "environment-settings",
      providesTags: ["Settings"],
    }),
  }),
});
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

1. **Follow ES Module patterns**: Use `import/export`, not `require/module.exports`
2. **Architecture Choice**: Use modular pattern for complex features (pull-request, chat), simple controllers for basic features (api-client, mcp)
3. **Use the appropriate technology stack**: LangChain for AI, Material-UI for UI, Redux Toolkit for state
4. **Maintain consistency**: Follow existing code style and API response format
5. **Provider-based architecture**: Support multiple AI/repository/issue providers
6. **Real-time features**: Use Socket.IO for live updates and Server-Sent Events for streaming
7. **CLI integration**: Consider global command usage and service management capabilities
8. **Natural language processing**: Implement template-driven prompt engineering for AI features
9. **Error handling and loading states**: Always include proper error boundaries and loading indicators
10. **Security**: Store sensitive config in `~/.ai-workflow-utils/environment.json`, validate inputs
11. **Performance**: Use lazy loading for routes, debouncing for inputs, memoization for expensive operations
12. **Documentation**: Add README.md files for new complex modules following the established pattern
