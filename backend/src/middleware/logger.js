const morgan = require('morgan');
const winston = require('winston');

// Create logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/access.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

// Custom morgan format
const morganFormat = ':method :url :status :res[content-length] - :response-time ms';

// Create morgan middleware
const morganMiddleware = morgan(morganFormat, {
  stream: {
    write: (message) => {
      logger.info(message.trim());
    }
  }
});

module.exports = morganMiddleware;
