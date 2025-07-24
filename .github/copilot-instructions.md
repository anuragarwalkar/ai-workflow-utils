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
│   ├── controllers/        # Route handlers
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

### Error Handling
```javascript
try {
  const result = await operation();
  res.json({ success: true, data: result });
} catch (error) {
  res.status(500).json({ success: false, error: error.message });
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
