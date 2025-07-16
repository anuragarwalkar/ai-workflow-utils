import path from 'path';
import { fileURLToPath } from 'url';
import { createLogger, format, transports } from 'winston';
import fs from 'fs';

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure logs directory exists
const logsDir = path.join(__dirname, 'logs');
try {
    if (!fs.existsSync(logsDir)) {
        fs.mkdirSync(logsDir, { recursive: true });
    }
} catch (error) {
    console.warn('Warning: Could not create logs directory:', error.message);
}

// Create transports array with fallback
const logTransports = [new transports.Console()];

// Try to add file transports, fall back to console-only if there 0-are permission issues
try {
    logTransports.push(
        new transports.File({ filename: path.join(__dirname, 'logs/error.log'), level: 'error' }),
        new transports.File({ filename: path.join(__dirname, 'logs/combined.log') })
    );
} catch (error) {
    console.warn('Warning: Could not create file transports, using console only:', error.message);
}

const logger = createLogger({
    level: 'info',
    format: format.combine(
        format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        format.printf(({ timestamp, level, message }) => {
            const colorizer = format.colorize().colorize;
            return `${colorizer(level, timestamp)} [${colorizer(level, level.toUpperCase())}]: ${colorizer(level, message)}`;
        })
    ),
    transports: logTransports
});

export default logger;
