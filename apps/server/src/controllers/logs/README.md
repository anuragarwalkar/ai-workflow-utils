# Logs Controller Module

This module provides comprehensive log management capabilities for the AI Workflow Utils application, following the modular architecture pattern established in the project.

## Overview

The Logs Controller module handles reading, processing, filtering, and managing application logs with a clean separation of concerns across different components.

## Architecture

```
logs/
├── logs-controller.js          # Main orchestrator (delegates to services)
├── index.js                   # Clean module exports
├── README.md                  # This documentation
├── models/
│   └── log-entry.js          # Data models with validation
├── services/
│   └── logs-service.js       # File system operations and business logic
├── processors/
│   └── logs-processor.js     # Data transformation and filtering
└── utils/
    ├── logs-config.js        # Configuration management
    └── error-handler.js      # Error handling utilities
```

## Components

### Controller (`logs-controller.js`)
- **Purpose**: Main orchestrator for log operations
- **Responsibilities**: 
  - Handle HTTP requests/responses
  - Coordinate between services and processors
  - Manage API endpoints
- **Methods**:
  - `getLogs()` - Retrieve filtered and paginated logs
  - `downloadLogs()` - Export all logs as text file
  - `clearLogs()` - Clear all log files
  - `getLogStats()` - Get log statistics

### Service (`services/logs-service.js`)
- **Purpose**: Handle file system operations and business logic
- **Responsibilities**:
  - Read log files from disk
  - Write/clear log files
  - Export log data
  - Generate statistics
- **Methods**:
  - `fetchLogs()` - Read all logs from files
  - `exportAllLogs()` - Combine all logs for export
  - `clearAllLogs()` - Clear all log files
  - `getLogStatistics()` - Calculate log statistics

### Processor (`processors/logs-processor.js`)
- **Purpose**: Transform and filter log data
- **Responsibilities**:
  - Filter logs by level and search terms
  - Sort and paginate results
  - Calculate statistics
  - Format log entries
- **Methods**:
  - `processLogs()` - Main processing pipeline
  - `calculateStats()` - Generate statistics
  - `formatLogEntry()` - Format for display
  - `groupLogsByTime()` - Group logs by time periods

### Models (`models/log-entry.js`)
- **Purpose**: Data validation and structure definition
- **Classes**:
  - `LogEntry` - Represents a single log entry
  - `LogQuery` - Represents query parameters
- **Features**:
  - Validation of log data
  - Display formatting
  - Search matching
  - Level filtering

### Utils
- **`logs-config.js`**: Configuration constants and helpers
- **`error-handler.js`**: Centralized error handling

## Usage Examples

### Import the Full Controller
```javascript
import { LogsController } from './controllers/logs/index.js';
```

### Import Specific Services
```javascript
import { LogsService, LogsProcessor } from './controllers/logs/index.js';
```

### Import Models and Utils
```javascript
import { LogEntry, LogQuery, LogsConfig } from './controllers/logs/index.js';
```

## API Endpoints

### GET `/api/logs`
Retrieve logs with filtering and pagination.

**Query Parameters:**
- `level` (string): Filter by log level ('all', 'error', 'warn', 'info', 'debug')
- `search` (string): Search term for message/module content
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 25, max: 100)

**Response:**
```json
{
  "success": true,
  "data": {
    "logs": [...],
    "total": 150,
    "stats": {
      "error": 10,
      "warn": 25,
      "info": 100,
      "debug": 15
    },
    "page": 1,
    "limit": 25,
    "totalPages": 6
  }
}
```

### GET `/api/logs/download`
Download all logs as a text file.

### DELETE `/api/logs/clear`
Clear all log files.

### GET `/api/logs/stats`
Get log statistics.

## Configuration

The module uses configuration from `utils/logs-config.js`:

- **Logs Directory**: `./logs/` (relative to project root)
- **Supported Extensions**: `.log`, `.txt`
- **Max File Size**: 10MB
- **Default Pagination**: 25 items per page
- **Max Pagination**: 100 items per page

## Error Handling

The module includes comprehensive error handling:

- **File System Errors**: ENOENT, EACCES, EMFILE
- **Validation Errors**: Invalid parameters
- **Memory Errors**: Large file handling
- **JSON Parsing Errors**: Malformed log entries

## Log Format Support

The module supports both:
1. **JSON Logs**: Structured log entries with timestamp, level, message, etc.
2. **Plain Text**: Unstructured log lines (treated as info level)

## Features

- **Real-time Filtering**: By log level and search terms
- **Pagination**: Efficient handling of large log files
- **Statistics**: Level-based log counts
- **Export**: Download all logs as text
- **Clear**: Safely clear all log files
- **Multi-file Support**: Reads from multiple log files
- **Error Recovery**: Handles corrupted or missing files gracefully

## Performance Considerations

- Files are read on-demand (not cached)
- Large files are processed in chunks
- Memory usage is optimized for pagination
- Invalid JSON lines are handled gracefully

## Security

- File access is restricted to the logs directory
- Path traversal protection
- Input validation for all parameters
- Safe file operations with proper error handling

## Future Enhancements

- Real-time log streaming via WebSocket
- Log archiving and rotation
- Advanced search with regex support
- Log level configuration
- Custom log format support
- Performance metrics and monitoring
