# AI Workflow Utils - Startup Service

This document explains how to set up AI Workflow Utils to automatically start on system boot, similar to PM2's startup functionality.

## Overview

The startup service functionality allows you to:
- Install AI Workflow Utils as a system service
- Automatically start the service on system boot
- Manage the service (start, stop, status)
- Uninstall the service when no longer needed

## Supported Platforms

- **macOS**: Uses `launchctl` and LaunchAgents
- **Windows**: Uses Windows Service Manager (`sc` command)
- **Linux**: Uses `systemd`

## Installation

To install AI Workflow Utils as a startup service:

```bash
ai-workflow-utils startup install
```

This command will:
1. Create the appropriate service configuration for your platform
2. Register the service with the system
3. Enable automatic startup on boot
4. Start the service immediately

## Service Management

### Check Service Status
```bash
ai-workflow-utils startup status
```

### Start Service
```bash
ai-workflow-utils startup start
```

### Stop Service
```bash
ai-workflow-utils startup stop
```

### Uninstall Service
```bash
ai-workflow-utils startup uninstall
```

## Platform-Specific Details

### macOS (LaunchAgents)

The service is installed as a user LaunchAgent in `~/Library/LaunchAgents/ai-workflow-utils.plist`.

**Features:**
- Automatically starts on user login
- Keeps the service alive (restarts on crash)
- Logs to `~/Library/Logs/ai-workflow-utils.log`
- Error logs to `~/Library/Logs/ai-workflow-utils.error.log`

**Manual Management:**
```bash
# Load service
launchctl load ~/Library/LaunchAgents/ai-workflow-utils.plist

# Unload service
launchctl unload ~/Library/LaunchAgents/ai-workflow-utils.plist

# Check if service is running
launchctl list | grep ai-workflow-utils
```

### Windows (Windows Service)

The service is registered as a Windows Service using the Service Control Manager.

**Features:**
- Automatically starts on system boot
- Runs as a Windows Service
- Can be managed through Windows Services console
- Automatic restart on failure

**Manual Management:**
```cmd
# Start service
sc start "ai-workflow-utils"

# Stop service
sc stop "ai-workflow-utils"

# Check service status
sc query "ai-workflow-utils"

# Delete service
sc delete "ai-workflow-utils"
```

You can also manage the service through:
1. Windows Services console (`services.msc`)
2. Task Manager > Services tab
3. Computer Management > Services and Applications > Services

### Linux (systemd)

The service is installed as a systemd service in `/etc/systemd/system/ai-workflow-utils.service`.

**Features:**
- Automatically starts on system boot
- Integrates with systemd logging
- Automatic restart on failure
- Can be managed with standard systemd commands

**Manual Management:**
```bash
# Start service
sudo systemctl start ai-workflow-utils

# Stop service
sudo systemctl stop ai-workflow-utils

# Enable auto-start
sudo systemctl enable ai-workflow-utils

# Disable auto-start
sudo systemctl disable ai-workflow-utils

# Check status
sudo systemctl status ai-workflow-utils

# View logs
sudo journalctl -u ai-workflow-utils -f
```

## Service Configuration

The service runs with the following default configuration:

- **Port**: 3000
- **Environment**: production
- **Working Directory**: Package installation directory
- **Auto-restart**: Enabled (restarts on failure)

### Environment Variables

The service sets these environment variables:
- `NODE_ENV=production`
- `PORT=3000`

To modify the configuration, you may need to:

1. **macOS**: Edit the plist file and reload the service
2. **Windows**: Modify the service configuration or reinstall
3. **Linux**: Edit the systemd service file and reload systemd

## Accessing the Application

Once the service is running, you can access:

- **Main Application**: http://localhost:3000
- **Settings**: http://localhost:3000/settings/environment
- **API**: http://localhost:3000/api/

## Troubleshooting

### Service Won't Start

1. Check that the package is properly built:
   ```bash
   npm run build
   ```

2. Verify the service exists:
   ```bash
   ai-workflow-utils startup status
   ```

3. Check logs:
   - **macOS**: `~/Library/Logs/ai-workflow-utils.*.log`
   - **Windows**: Windows Event Viewer
   - **Linux**: `sudo journalctl -u ai-workflow-utils`

### Port Conflicts

If port 3000 is already in use, you may need to:

1. Stop the conflicting service
2. Modify the service configuration to use a different port
3. Update your application configuration accordingly

### Permission Issues

- **macOS**: Ensure you have write permissions to `~/Library/LaunchAgents/`
- **Windows**: Run Command Prompt as Administrator
- **Linux**: Use `sudo` for systemctl commands

### Service Not Auto-Starting

1. Verify the service is enabled for auto-start:
   - **macOS**: Check if plist file exists in LaunchAgents
   - **Windows**: Verify service start type is "Automatic"
   - **Linux**: Check if service is enabled with `systemctl is-enabled ai-workflow-utils`

2. Check system logs for startup errors
3. Ensure all dependencies are available at boot time

## Uninstalling

To completely remove the startup service:

```bash
ai-workflow-utils startup uninstall
```

This will:
1. Stop the running service
2. Disable auto-start
3. Remove service configuration files
4. Clean up any temporary files

## Security Considerations

- The service runs with the privileges of the installing user
- On Linux, the service runs as the specified user (not root)
- Logs may contain sensitive information - review log file permissions
- The web interface is accessible on localhost:3000 by default

## Support

For issues related to the startup service:

1. Check the troubleshooting section above
2. Review the platform-specific logs
3. Ensure your platform is supported
4. Verify you have the necessary permissions

## Examples

### Complete Setup Workflow

```bash
# Install the package globally
npm install -g ai-workflow-utils

# Install as startup service
ai-workflow-utils startup install

# Check that it's running
ai-workflow-utils startup status

# Access the web interface
open http://localhost:3000
```

### Temporary Stop and Restart

```bash
# Stop the service
ai-workflow-utils startup stop

# Make changes or updates
# ...

# Start the service again
ai-workflow-utils startup start
```

### Remove and Reinstall

```bash
# Remove the startup service
ai-workflow-utils startup uninstall

# Make changes to the package
# ...

# Reinstall the startup service
ai-workflow-utils startup install
```
