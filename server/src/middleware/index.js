const { loggerMiddleware, requestTimeMiddleware } = require('./logger.middleware');
const { errorHandler, notFoundHandler, asyncHandler } = require('./error.middleware');
const { generalLimiter, authLimiter, uploadLimiter } = require('./rateLimit.middleware');
const { uploadSingle, uploadMultiple, uploadFields } = require('./upload.middleware');

module.exports = {
  // Logger
  loggerMiddleware,
  requestTimeMiddleware,

  // Error handlers
  errorHandler,
  notFoundHandler,
  asyncHandler,

  // Rate limiters
  generalLimiter,
  authLimiter,
  uploadLimiter,

  // Upload
  uploadSingle,
  uploadMultiple,
  uploadFields,
};
