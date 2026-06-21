const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const loggerConfig = require('../../config/logger');

const { combine, timestamp, errors, json, printf, colorize } = winston.format;

// Custom format for console
const consoleFormat = printf(({ level, message, timestamp: ts, stack, ...metadata }) => {
  let msg = `${ts} [${level}]: ${message}`;
  
  if (Object.keys(metadata).length > 0) {
    msg += ` ${JSON.stringify(metadata)}`;
  }
  
  if (stack) {
    msg += `\n${stack}`;
  }
  
  return msg;
});

// Error log transport
const errorTransport = new DailyRotateFile({
  filename: loggerConfig.errorFile,
  datePattern: loggerConfig.datePattern,
  maxSize: loggerConfig.maxSize,
  maxFiles: loggerConfig.maxFiles,
  level: 'error',
  format: combine(timestamp(), errors({ stack: true }), json()),
});

// Combined log transport
const combinedTransport = new DailyRotateFile({
  filename: loggerConfig.combinedFile,
  datePattern: loggerConfig.datePattern,
  maxSize: loggerConfig.maxSize,
  maxFiles: loggerConfig.maxFiles,
  format: combine(timestamp(), errors({ stack: true }), json()),
});

// Audit log transport
const auditTransport = new DailyRotateFile({
  filename: loggerConfig.auditFile,
  datePattern: loggerConfig.datePattern,
  maxSize: loggerConfig.maxSize,
  maxFiles: loggerConfig.maxFiles,
  format: combine(timestamp(), json()),
});

// Console transport
const consoleTransport = new winston.transports.Console({
  format: combine(
    colorize(),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    errors({ stack: true }),
    consoleFormat
  ),
});

// Create logger
const logger = winston.createLogger({
  level: loggerConfig.level,
  format: combine(timestamp(), errors({ stack: true }), json()),
  defaultMeta: { service: 'digital-signature-platform' },
  transports: [errorTransport, combinedTransport],
  exceptionHandlers: [
    new winston.transports.File({ filename: 'logs/exceptions.log' }),
  ],
  rejectionHandlers: [
    new winston.transports.File({ filename: 'logs/rejections.log' }),
  ],
});

// Add console transport in development
if (process.env.NODE_ENV !== 'production') {
  logger.add(consoleTransport);
}

// Create audit logger
const auditLogger = winston.createLogger({
  level: 'info',
  format: combine(timestamp(), json()),
  defaultMeta: { service: 'audit' },
  transports: [auditTransport],
});

module.exports = { logger, auditLogger };
