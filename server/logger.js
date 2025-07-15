import path from 'path';
import { fileURLToPath } from 'url';
import { createLogger, format, transports } from 'winston';

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const logger = createLogger({
    level: 'info',
    format: format.combine(
        format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        format.printf(({ timestamp, level, message }) => {
            const colorizer = format.colorize().colorize;
            return `${colorizer(level, timestamp)} [${colorizer(level, level.toUpperCase())}]: ${colorizer(level, message)}`;
        })
    ),
    transports: [
        new transports.Console(),
        new transports.File({ filename: path.join(__dirname, 'logs/error.log'), level: 'error' }), // Updated path
        new transports.File({ filename: path.join(__dirname, 'logs/combined.log') }) // Updated path
    ]
});

export default logger;
