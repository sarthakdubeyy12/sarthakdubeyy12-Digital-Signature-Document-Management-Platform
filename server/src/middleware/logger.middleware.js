const morgan = require('morgan');
const logger = require('../services/logger/logger.service');

// Custom Morgan token for response time
morgan.token('response-time-ms', (req, res) => {
  if (!req._startAt) return '0';
  const diff = process.hrtime(req._startAt);
  return (diff[0] * 1e3 + diff[1] * 1e-6).toFixed(2);
});

// Morgan stream for Winston
const stream = {
  write: (message) => {
    logger.http(message.trim());
  },
};

// Morgan format
const morganFormat = ':method :url :status :response-time-ms ms - :res[content-length]';

// Logger middleware
const loggerMiddleware = morgan(morganFormat, { stream });

// Request start time middleware
const requestTimeMiddleware = (req, res, next) => {
  req._startAt = process.hrtime();
  next();
};

module.exports = {
  loggerMiddleware,
  requestTimeMiddleware,
};
