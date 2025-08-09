# Template Controller Module

This module provides comprehensive template management functionality for the AI Workflow Utils application. It follows a modular architecture with clear separation of concerns.

## Architecture

### Directory Structure
```
server/controllers/template/
├── template-controller.js          # Main orchestrator (delegates to services)
├── index.js                        # Clean module exports
├── README.md                      # Module documentation
├── models/
│   ├── template.js                # Template data model with validation
│   └── template-settings.js       # Settings data model
├── services/
│   ├── template-database-service.js   # Database operations
│   └── template-validation-service.js # Input validation
├── processors/
│   └── template-export-import-processor.js # Data transformation
└── utils/
    ├── constants.js               # Module constants
    └── template-error-handler.js  # Error handling utilities
```

### Module Responsibilities

#### Controllers
- **template-controller.js**: Orchestrates operations, handles HTTP requests/responses, delegates to services

#### Services
- **template-database-service.js**: Contains database interaction logic, manages template CRUD operations
- **template-validation-service.js**: Handles input validation, business rule validation

#### Processors
- **template-export-import-processor.js**: Transforms data for import/export, processes search/filtering

#### Models
- **template.js**: Template data structure, validation, and payload generation
- **template-settings.js**: Settings data structure and validation

#### Utils
- **constants.js**: Module-specific constants, error messages, validation patterns
- **template-error-handler.js**: Centralized error handling, API error responses

## API Endpoints

### Template Management
- `GET /api/templates` - Get all templates
- `GET /api/templates/type/:issueType` - Get templates by issue type
- `GET /api/templates/active/:issueType` - Get active template for issue type
- `POST /api/templates` - Create new template
- `PUT /api/templates/:id` - Update template
- `DELETE /api/templates/:id` - Delete template
- `POST /api/templates/duplicate/:id` - Duplicate template

### Template Configuration
- `PUT /api/templates/active/:issueType/:templateId` - Set active template
- `GET /api/templates/settings` - Get template settings
- `PUT /api/templates/settings` - Update template settings
- `POST /api/templates/reset` - Reset to default templates

### Import/Export
- `GET /api/templates/export` - Export user templates
- `POST /api/templates/import` - Import templates

### Additional Features
- `GET /api/templates/search` - Search templates with filters

## Usage Examples

### Import the Full Controller
```javascript
import { TemplateController } from './controllers/template/index.js';
```

### Import Specific Services
```javascript
import { 
  TemplateDatabaseService, 
  TemplateValidationService 
} from './controllers/template/index.js';
```

### Import Individual Processors
```javascript
import { TemplateExportImportProcessor } from './controllers/template/index.js';
```

### Import Models and Utils
```javascript
import { 
  Template, 
  TemplateSettings,
  TemplateErrorHandler,
  TEMPLATE_CONSTANTS 
} from './controllers/template/index.js';
```

## Data Models

### Template Model
```javascript
{
  id: string,           // UUID
  name: string,         // Template name (max 100 chars)
  issueType: string,    // Issue type (alphanumeric, _, -)
  content: string,      // Template content (max 10000 chars)
  isDefault: boolean,   // Whether it's a default template
  isActive: boolean,    // Whether it's the active template for its type
  createdAt: string,    // ISO timestamp
  updatedAt: string,    // ISO timestamp
  variables: string[]   // Extracted variables from content
}
```

### Template Settings Model
```javascript
{
  version: string,                    // Settings version
  lastUpdated: string,               // ISO timestamp
  defaultIssueTypes: string[],       // Default issue types
  maxTemplatesPerType: number,       // Max templates per type (1-50)
  allowCustomIssueTypes: boolean,    // Allow custom issue types
  autoBackup: boolean,               // Enable auto backup
  backupRetentionDays: number        // Backup retention (1-365 days)
}
```

## Error Handling

The module uses centralized error handling with appropriate HTTP status codes:

- **400 Bad Request**: Validation errors, invalid input
- **403 Forbidden**: Permission errors (modifying/deleting default templates)
- **404 Not Found**: Template or resource not found
- **500 Internal Server Error**: Unexpected server errors

## Validation

### Template Validation
- Name: Required, max 100 characters
- Issue Type: Required, alphanumeric with underscores and hyphens
- Content: Required, max 10000 characters

### Settings Validation
- maxTemplatesPerType: 1-50
- backupRetentionDays: 1-365
- defaultIssueTypes: Must be array

## Features

### Template Management
- Create, read, update, delete templates
- Duplicate existing templates
- Set active templates per issue type
- Protect default templates from modification/deletion

### Import/Export
- Export user-created templates to JSON
- Import templates from JSON with validation
- Preserve template metadata during import/export

### Search and Filtering
- Filter by issue type, name, active status
- Sort by various fields (name, createdAt, etc.)
- Search with partial name matching

### Settings Management
- Configure default issue types
- Set limits and preferences
- Backup configuration

## Constants

All module constants are defined in `utils/constants.js`:
- Validation limits and patterns
- Default values
- Error and success messages
- HTTP status codes
- Supported formats and versions

## Development Guidelines

### Adding New Features
1. Determine appropriate module (service, processor, model, util)
2. Follow existing patterns and naming conventions
3. Add comprehensive error handling
4. Update exports in index.js
5. Document changes in this README

### Testing Considerations
- Models: Test validation and data transformation
- Services: Test business logic and database operations
- Processors: Test data transformation and filtering
- Controllers: Test HTTP request/response handling
- Error Handler: Test error categorization and responses

### Performance Notes
- Database operations are centralized in services
- Validation is performed before database operations
- Large datasets are processed in chunks where applicable
- Export operations stream data to prevent memory issues
