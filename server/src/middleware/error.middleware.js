const logger = require('../services/logger/logger.service');
const config = require('../config');

// Error handler middleware
const errorHandler = (err, req, res, next) => {
  // Log error
  logger.error('Error occurred', err, {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userId: req.user?.id,
  });

  // Default error
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let errors = err.errors || null;

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation Error';
    errors = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    statusCode = 409;
    message = 'Duplicate field value';
    const field = Object.keys(err.keyPattern)[0];
    errors = [{ field, message: `${field} already exists` }];
  }

  // Mongoose CastError
  if (err.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid ID format';
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  }

  // Multer file upload errors
  if (err.name === 'MulterError') {
    statusCode = 400;
    if (err.code === 'LIMIT_FILE_SIZE') {
      message = 'File size too large';
    } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      message = 'Unexpected file field';
    } else {
      message = err.message;
    }
  }

  // Send response
  const response = {
    success: false,
    message,
    ...(errors && { errors }),
    ...(config.env === 'development' && { stack: err.stack }),
  };

  res.status(statusCode).json(response);
};

// 404 Not Found handler
const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
};

// Async error wrapper
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = {
  errorHandler,
  notFoundHandler,
  asyncHandler,
};
