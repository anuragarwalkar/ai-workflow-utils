const { createLogger, format, transports } = require('winston');

const logger = createLogger({
    level: 'info', // Default log level
    format: format.combine(
        format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        format.printf(({ timestamp, level, message }) => {
            const colorizer = format.colorize().colorize;
            return `${colorizer(level, timestamp)} [${colorizer(level, level.toUpperCase())}]: ${colorizer(level, message)}`;
        })
    ),
    transports: [
        new transports.Console(), // Log to console with colorized output
        new transports.File({ filename: 'logs/error.log', level: 'error' }), // Log errors to a file
        new transports.File({ filename: 'logs/combined.log' }) // Log all levels to a file
    ]
});

module.exports = logger;
