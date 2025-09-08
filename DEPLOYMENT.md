# Deployment Guide

This document covers important deployment considerations for the AI Workflow Utils application, especially regarding permissions and file handling.

## File Upload Permissions

The application includes build script upload functionality that requires proper file system permissions.

### Directory Requirements

The application will attempt to create upload directories in this order:

1. **Custom Directory** (if `UPLOAD_DIR` environment variable is set)
   ```bash
   export UPLOAD_DIR=/path/to/custom/upload/directory
   ```

2. **Project Directory** (`./uploads/build-scripts/`)
   - Requires write permissions in the project directory
   - Preferred for development and when you control the deployment environment

3. **System Temp Directory** (fallback)
   - Uses OS temporary directory: `/tmp/ai-workflow-utils/build-scripts/` (Unix) or equivalent
   - Used when project directory is not writable

### Permission Setup

#### For Unix-like Systems (Linux, macOS)

```bash
# Ensure the project has write permissions
chmod 755 /path/to/ai-workflow-utils
mkdir -p /path/to/ai-workflow-utils/uploads/build-scripts
chmod 755 /path/to/ai-workflow-utils/uploads/build-scripts

# Or use a custom directory
export UPLOAD_DIR=/var/uploads/ai-workflow-utils
mkdir -p $UPLOAD_DIR/build-scripts
chmod 755 $UPLOAD_DIR/build-scripts
```

#### For Windows

```cmd
# Ensure the user has write permissions to the project directory
# Or set a custom upload directory
set UPLOAD_DIR=C:\uploads\ai-workflow-utils
mkdir "%UPLOAD_DIR%\build-scripts"
```

### Docker Deployment

When deploying with Docker, mount a volume for uploads:

```dockerfile
# In your Dockerfile
RUN mkdir -p /app/uploads/build-scripts && \
    chmod 755 /app/uploads/build-scripts

# In docker-compose.yml
volumes:
  - ./uploads:/app/uploads
```

Or use a named volume:

```yaml
# docker-compose.yml
services:
  app:
    environment:
      - UPLOAD_DIR=/uploads
    volumes:
      - uploads:/uploads

volumes:
  uploads:
```

### NPM Global Installation

When installed globally via NPM, the application will:

1. Try to create uploads in the current working directory
2. Fall back to system temp directory if no write permissions
3. Log appropriate warnings/info about directory selection

#### Recommended Setup for Global Installation

```bash
# Install globally
npm install -g ai-workflow-utils

# Create a dedicated directory for the app
mkdir ~/ai-workflow-utils
cd ~/ai-workflow-utils

# Set upload directory (optional)
export UPLOAD_DIR=~/ai-workflow-utils/uploads

# Run the application
ai-workflow-utils
```

## Security Considerations

### File Upload Security

- Only `.sh` (shell script) files are allowed
- File size limited to 5MB
- Uploaded files are stored with timestamp prefixes
- File names are sanitized to prevent directory traversal

### Script Execution

- Uploaded scripts are made executable on Unix-like systems
- Scripts run in the context of the application user
- Ensure the application user has appropriate permissions but not excessive privileges

### Recommended Security Setup

1. **Run with limited user permissions**
   ```bash
   # Create a dedicated user
   sudo useradd -r -s /bin/false ai-workflow-utils
   
   # Set ownership
   sudo chown -R ai-workflow-utils:ai-workflow-utils /path/to/app
   ```

2. **Use process managers with proper user context**
   ```bash
   # PM2 example
   pm2 start app.js --user ai-workflow-utils
   
   # systemd example
   # Set User=ai-workflow-utils in service file
   ```

3. **Firewall configuration**
   - Restrict access to the application port
   - Use reverse proxy (nginx, Apache) for production

## Troubleshooting

### Upload Directory Issues

If you see errors about upload directory creation:

1. Check file system permissions
2. Verify disk space availability
3. Check SELinux/AppArmor policies (Linux)
4. Set `UPLOAD_DIR` environment variable to a writable location

### Log Examples

```
INFO: Using project upload directory {"dir": "/app/uploads/build-scripts"}
WARN: Project upload directory not writable, using temp directory {"projectDir": "/app/uploads/build-scripts", "tempDir": "/tmp/ai-workflow-utils/build-scripts"}
ERROR: Failed to create temp upload directory {"error": "EACCES: permission denied"}
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `UPLOAD_DIR` | Custom upload directory | `./uploads` |
| `NODE_ENV` | Environment mode | `development` |
| `PORT` | Server port | `3001` |

## Production Checklist

- [ ] Set appropriate file system permissions
- [ ] Configure upload directory with `UPLOAD_DIR`
- [ ] Set up log rotation
- [ ] Configure reverse proxy
- [ ] Set up SSL/TLS certificates
- [ ] Configure firewall rules
- [ ] Test file upload functionality
- [ ] Monitor disk space usage
- [ ] Set up backup for uploaded scripts (if needed)
