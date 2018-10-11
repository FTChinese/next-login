const winston = require('winston');
const logDir = process.env.LOG_DIR || '.';
const prefix = 'next-user';

const logger = winston.createLogger({
  level: 'info',
  // It seems the order matters.
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.label({label: 'user'}),
    winston.format.json(),
  ),
  transports: [
    new winston.transports.File({ filename: `${logDir}/${prefix}error.log`, level: 'error', maxsize: 1000000}),
    new winston.transports.File({ filename: `${logDir}/${prefix}combined.log`, maxsize: 1000000})
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize({ all: true }),
      winston.format.simple()
    )
  }));
}

module.exports = logger;
