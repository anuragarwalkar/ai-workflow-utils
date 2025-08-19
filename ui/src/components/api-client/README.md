# API Client Environment Management

This documentation explains how to use the new environment management system for the API Client.

## Overview

The environment management system allows users to:
- Create, edit, and delete environments
- Set an active environment
- Import/export environments in Postman v2.1 format
- Use environment variables in API requests with autocomplete
- Store environment variables as separate JSON files

## Components

### 1. EnvironmentManager
Main component for managing environments with full CRUD operations.

```jsx
import EnvironmentManager from './components/api-client/EnvironmentManager';

<EnvironmentManager
  environments={environments}
  activeEnvironment={activeEnvironment}
  onEnvironmentChange={handleEnvironmentChange}
  onEnvironmentSave={handleEnvironmentSave}
  onEnvironmentDelete={handleEnvironmentDelete}
  onEnvironmentImport={handleEnvironmentImport}
  onEnvironmentExport={handleEnvironmentExport}
/>
```

### 2. EnvironmentSelector
Compact dropdown for selecting active environment.

```jsx
import EnvironmentSelector from './components/api-client/EnvironmentSelector';

<EnvironmentSelector
  activeEnvironment={activeEnvironment}
  onEnvironmentChange={handleEnvironmentChange}
  compact={true}
  showVariables={false}
/>
```

### 3. VariableAutocomplete
Input field with environment variable autocomplete.

```jsx
import { VariableAutocomplete } from './components/api-client/EnvironmentSelector';

<VariableAutocomplete
  value={requestUrl}
  onChange={setRequestUrl}
  activeEnvironment={activeEnvironment}
  environments={environments}
  label="Request URL"
  placeholder="Enter URL or {{BASE_URL}}/endpoint"
/>
```

### 4. EnvironmentContainer
Container component that provides all environment functionality.

```jsx
import EnvironmentContainer from './components/api-client/EnvironmentContainer';

<EnvironmentContainer showManager={true} showSelector={true}>
  <YourApiClientComponent />
</EnvironmentContainer>
```

## Hooks

### useEnvironments
Custom hook for environment state management.

```jsx
import { useEnvironments } from './hooks/useEnvironments';

const {
  environments,
  activeEnvironment,
  loading,
  error,
  saveEnvironment,
  deleteEnvironment,
  setActiveEnvironment,
  exportEnvironment,
  importEnvironment,
  substituteVariables,
  getVariableSuggestions,
} = useEnvironments();
```

## Services

### EnvironmentApiService
Service for API communication and utilities.

```jsx
import EnvironmentApiService from './services/environmentApiService';

// Substitute variables in text
const processedUrl = EnvironmentApiService.substituteVariables(
  '{{BASE_URL}}/api/users',
  { BASE_URL: 'https://api.example.com' }
);

// Convert to/from Postman format
const postmanFormat = EnvironmentApiService.toPostmanFormat(environment);
const environment = EnvironmentApiService.fromPostmanFormat(postmanData);
```

## Environment Variable Format

Environments are stored in Postman v2.1 compatible format:

```json
{
  "id": "env_123456789",
  "name": "Development",
  "values": [
    {
      "key": "BASE_URL",
      "value": "https://api-dev.example.com",
      "enabled": true,
      "type": "text"
    },
    {
      "key": "API_KEY",
      "value": "dev-api-key-123",
      "enabled": true,
      "type": "text"
    }
  ],
  "_postman_variable_scope": "environment",
  "_postman_exported_at": "2025-08-19T10:30:00.000Z",
  "_postman_exported_using": "AI Workflow Utils"
}
```

## File Storage

Each environment is stored as a separate JSON file in:
```
~/.ai-workflow-utils/environments/
├── env_123456789.json  (Development)
├── env_987654321.json  (Production)
└── env_456789123.json  (Staging)
```

## Usage Examples

### Creating an Environment
```jsx
const environmentData = {
  name: 'Development',
  variables: {
    BASE_URL: 'https://api-dev.example.com',
    API_KEY: 'dev-key-123',
    TIMEOUT: '5000'
  }
};

await saveEnvironment(environmentData);
```

### Using Variables in Requests
```jsx
// In your request URL field
const url = '{{BASE_URL}}/api/users';

// Process the URL with active environment
const processedUrl = substituteVariables(url);
// Result: 'https://api-dev.example.com/api/users'
```

### Exporting Environment
```jsx
const exportData = await exportEnvironment(environmentId);
// Download as JSON file
const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
  type: 'application/json' 
});
// ... download logic
```

### Importing Environment
```jsx
// From file upload
const fileContent = await file.text();
const importData = JSON.parse(fileContent);
await importEnvironment(importData);
```

## Variable Syntax

Use double curly braces to reference variables:
- `{{VARIABLE_NAME}}` - Substitute with variable value
- `{{BASE_URL}}/endpoint` - Combine with static text
- `Bearer {{ACCESS_TOKEN}}` - Use in headers

## API Endpoints

The following endpoints are available for environment management:

- `GET /api/api-client/environments` - Get all environments
- `POST /api/api-client/environments` - Create environment
- `PUT /api/api-client/environments/:id` - Update environment
- `DELETE /api/api-client/environments/:id` - Delete environment
- `GET /api/api-client/environments/active` - Get active environment
- `PUT /api/api-client/environments/:id/activate` - Set active environment
- `GET /api/api-client/environments/:id/export` - Export environment
- `POST /api/api-client/environments/import` - Import environment
- `GET /api/api-client/environments/export/all` - Export all environments

## Integration with API Client

To integrate with your existing API client:

1. Add environment selector to your request form
2. Use VariableAutocomplete for URL and header inputs
3. Process variables before making requests
4. Show active environment status in UI

```jsx
// Example integration
const ApiRequestForm = () => {
  const { activeEnvironment, substituteVariables } = useEnvironments();
  const [url, setUrl] = useState('');
  
  const handleSubmit = async () => {
    const processedUrl = substituteVariables(url);
    // Make API request with processed URL
    await fetch(processedUrl);
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <EnvironmentSelector compact />
      <VariableAutocomplete
        value={url}
        onChange={setUrl}
        activeEnvironment={activeEnvironment}
        label="Request URL"
      />
      <button type="submit">Send Request</button>
    </form>
  );
};
```

This system provides a complete environment management solution similar to Postman's environment system but integrated into your API client application.
