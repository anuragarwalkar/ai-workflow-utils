# Email Module

The Email module provides a comprehensive system for generating formatted email content from wiki data with Jira integration. It follows a modular architecture with clear separation of concerns.

## Architecture

### Controllers
- **EmailController**: Main orchestrator that coordinates the email generation workflow

### Models
- **EmailRequest**: Data validation and structure for email generation requests

### Services
- **WikiService**: Handles wiki content fetching and initial processing
- **JiraIntegrationService**: Manages Jira data integration and enhancement
- **EmailContentService**: Generates final email content with formatting

### Processors
- **TableExtractor**: Extracts table data from HTML content
- **HtmlFormatter**: Formats table data into styled HTML email content

### Utils
- **ErrorHandler**: Centralized error handling and response formatting
- **Constants**: Centralized configuration and constant values

## Usage

### Basic Usage
```javascript
import { EmailController } from './controllers/email/index.js';

// In your route handler
router.post('/send', async (req, res) => {
  await EmailController.sendEmail(req, res);
});
```

### Individual Service Usage
```javascript
import { 
  WikiService, 
  JiraIntegrationService, 
  EmailContentService 
} from './controllers/email/index.js';

// Fetch wiki content
const content = await WikiService.fetchWikiContent(url, auth);

// Extract table data
const tableData = await WikiService.extractTableData(content, version);

// Enhance with Jira data
const enhanced = await JiraIntegrationService.enhanceWithJiraSummaries(tableData);

// Generate email content
const emailBody = EmailContentService.generateEmailBody(enhanced, metadata);
```

### Processor Usage
```javascript
import { TableExtractor, HtmlFormatter } from './controllers/email/index.js';

// Extract table from HTML
const tableData = await TableExtractor.extractTableAsArray(html, buildNumber);

// Format as HTML
const formattedHtml = HtmlFormatter.formatTableByGroup(tableData);
```

## API Endpoints

### POST /api/email/send
Generates formatted email content from wiki data.

**Request:**
```json
{
  "wikiUrl": "https://wiki.example.com/page",
  "wikiBasicAuth": "base64-encoded-credentials"
}
```

**Query Parameters:**
- `version`: Build version to extract data for

**Response:**
```json
{
  "success": true,
  "data": "<html>...</html>"
}
```

## Configuration

The module uses constants defined in `utils/constants.js`:

- **Table Processing**: Columns to remove, grouping fields
- **HTML Styling**: CSS styles for email formatting
- **Validation**: Patterns for URL, version, and Jira key validation
- **Error Messages**: Standardized error messages
- **Time-based Greetings**: Dynamic greeting generation

## Error Handling

The module provides comprehensive error handling:

- **Validation Errors**: 400 - Invalid input data
- **Authentication Errors**: 401 - Invalid credentials
- **Authorization Errors**: 403 - Insufficient permissions
- **Not Found Errors**: 404 - Resource not found
- **Service Errors**: 503 - External service unavailable
- **Internal Errors**: 500 - Unexpected server errors

Each error includes:
- Error ID for tracking
- Timestamp
- Context information
- Safe error messages (production mode)

## Data Flow

1. **Request Validation**: Validate input parameters and structure
2. **Wiki Content Fetch**: Retrieve HTML content from wiki URL
3. **Table Extraction**: Parse HTML and extract relevant table data
4. **Jira Enhancement**: Fetch and merge Jira issue summaries
5. **Content Generation**: Format data into styled HTML email
6. **Response**: Return formatted email content

## Validation

### Email Request Validation
- Required fields: `version`, `wikiUrl`, `wikiBasicAuth`
- URL format validation
- Version format validation
- Authentication token validation

### Table Data Validation
- Must be non-empty array
- All rows must be arrays
- Headers and data consistency checks

## Dependencies

- **JSDOM**: HTML parsing and DOM manipulation
- **Express**: Web framework integration
- **Winston Logger**: Logging and monitoring
- **Jira Controller**: Integration with existing Jira functionality

## Security Considerations

- Basic authentication tokens are not logged
- Error messages sanitized in production
- Input validation and sanitization
- Safe HTML generation (no script injection)

## Performance

- Efficient table processing with filtered column handling
- Minimal DOM manipulation operations
- Optimized HTML generation
- Error boundaries to prevent cascade failures

## Testing

The module is designed to be easily testable:

- Static methods for stateless operations
- Clear separation of concerns
- Dependency injection friendly
- Mock-friendly external service calls

## Migration from Legacy

The module maintains backward compatibility with the existing email controller while providing a cleaner, more maintainable architecture. The old controller can be gradually replaced by updating route imports:

```javascript
// Old way
import emailController from '../controllers/emailController.js';

// New way
import { EmailController } from '../controllers/email/index.js';
// Then use EmailController.sendEmail instead of emailController
```
