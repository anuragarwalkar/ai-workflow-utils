# AI Workflow Utils - Memory Bank

This memory bank contains comprehensive documentation about the AI Workflow Utils application, covering architecture, features, development patterns, and operational knowledge.

## Documentation Structure

### Core Documentation
- **[Application Architecture](./application-architecture.md)** - Current React + Node.js architecture overview
- **[API Documentation](./api-documentation.md)** - Complete API endpoints and usage
- **[Database Schema](./database-schema.md)** - Data models and storage patterns
- **[Component Library](./component-library.md)** - React component documentation

### Feature Documentation
- **[Jira Integration](./features/jira-integration.md)** - Jira issue creation and management
- **[Pull Request Management](./features/pr-management.md)** - PR creation and review workflows
- **[Template System](./features/template-system.md)** - Content template management
- **[Environment Settings](./features/environment-settings.md)** - Configuration management
- **[Email Integration](./features/email-integration.md)** - Email generation and sending
- **[Build System](./features/build-system.md)** - Build and deployment automation
- **[Chat Interface](./features/chat-interface.md)** - AI chat functionality

### Development Documentation
- **[Development Setup](./development/setup.md)** - Local development environment
- **[Coding Standards](./development/coding-standards.md)** - Code style and patterns
- **[Testing Strategy](./development/testing.md)** - Testing approaches and tools
- **[Deployment Guide](./development/deployment.md)** - Production deployment process

### Operational Documentation
- **[Troubleshooting](./operations/troubleshooting.md)** - Common issues and solutions
- **[Performance Monitoring](./operations/performance.md)** - Performance optimization
- **[Security Guidelines](./operations/security.md)** - Security best practices
- **[Backup & Recovery](./operations/backup-recovery.md)** - Data protection strategies

### Historical Documentation
- **[React Migration History](./react-migration-history.md)** - Migration from vanilla JS to React
- **[Feature Evolution](./historical/feature-evolution.md)** - Feature development timeline
- **[Technical Decisions](./historical/technical-decisions.md)** - Architecture decision records

## Quick Reference

### Key Technologies
- **Frontend**: React 19.1.0, Material-UI 7.2.0, Redux Toolkit, Vite
- **Backend**: Node.js, Express, File-based storage
- **AI Integration**: LangChain, OpenAI/Anthropic/Ollama support
- **External APIs**: Jira, Bitbucket, Email services

### Main Features
1. **AI-Powered Content Generation** - Jira issues, PRs, emails
2. **Template Management** - Customizable content templates
3. **Multi-Provider Support** - Various AI and service providers
4. **File Upload & Processing** - Image analysis and attachments
5. **Environment Configuration** - Flexible settings management
6. **Build Automation** - Deployment and release management

### Project Structure
```
ai-workflow-utils/
├── ui/                     # React frontend
├── server/                 # Node.js backend
├── memory-bank/           # Documentation
├── bin/                   # CLI tools
└── uploads/               # File storage
```

## Contributing to Memory Bank

When adding new documentation:
1. Follow the existing structure and naming conventions
2. Include practical examples and code snippets
3. Update this README with new document links
4. Keep documentation current with code changes
5. Use clear, technical language with proper formatting

## Last Updated
January 2025 - Comprehensive memory bank initialization
