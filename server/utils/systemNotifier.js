import { exec } from 'child_process';
import os from 'os';
import logger from '../logger.js';

function escapeAppleScript(str) {
  if (!str) return '';
  return String(str).replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, ' ');
}

function escapePowerShell(str) {
  if (!str) return '';
  return String(str).replace(/`/g, '``').replace(/"/g, '`"').replace(/\$/g, '`$');
}

function escapeShell(str) {
  if (!str) return '';
  return String(str).replace(/"/g, '\\"');
}

class SystemNotifier {
  /**
   * Send a system-native desktop notification from the server process
   * Works on macOS, Windows, and Linux even when all browser tabs are closed.
   */
  notify({ title = 'AI Workflow Notification', message = '', subtitle = '' }) {
    const platform = os.platform();

    try {
      if (platform === 'darwin') {
        const safeTitle = escapeAppleScript(title);
        const safeMessage = escapeAppleScript(message);
        const safeSubtitle = escapeAppleScript(subtitle);

        let script = `display notification "${safeMessage}" with title "${safeTitle}"`;
        if (safeSubtitle) {
          script += ` subtitle "${safeSubtitle}"`;
        }

        exec(`osascript -e '${script}'`, (err) => {
          if (err) {
            logger.warn(`macOS system notification error: ${err.message}`);
          } else {
            logger.info(`macOS system notification sent: "${title}"`);
          }
        });
      } else if (platform === 'win32') {
        const safeTitle = this._escapePowerShell(title);
        const safeMessage = this._escapePowerShell(message);

        // Windows balloon / notification via PowerShell
        const psCommand = `powershell -Command "[reflection.assembly]::loadwithpartialname('System.Windows.Forms'); [reflection.assembly]::loadwithpartialname('System.Drawing'); $notify = new-object system.windows.forms.notifyicon; $notify.icon = [system.drawing.systemicons]::Information; $notify.visible = $true; $notify.showballoontip(10000, '${safeTitle}', '${safeMessage}', [system.windows.forms.tooltipicon]::Info);"`;

        exec(psCommand, (err) => {
          if (err) {
            logger.warn(`Windows system notification error: ${err.message}`);
          } else {
            logger.info(`Windows system notification sent: "${title}"`);
          }
        });
      } else if (platform === 'linux') {
        const safeTitle = this._escapeShell(title);
        const safeMessage = this._escapeShell(message);

        exec(`notify-send "${safeTitle}" "${safeMessage}"`, (err) => {
          if (err) {
            logger.warn(`Linux system notification error: ${err.message}`);
          } else {
            logger.info(`Linux system notification sent: "${title}"`);
          }
        });
      }
    } catch (err) {
      logger.error(`Error sending system notification: ${err.message}`);
    }
  }
}

export default new SystemNotifier();
