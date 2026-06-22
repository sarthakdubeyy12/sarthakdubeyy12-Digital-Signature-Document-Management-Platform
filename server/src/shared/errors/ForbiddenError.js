const AppError = require('./AppError');

/**
 * Forbidden Error
 * Thrown when user doesn't have permission
 */
class ForbiddenError extends AppError {
  constructor(message = 'Access forbidden', statusCode = 403) {
    super(message, statusCode);
    this.name = 'ForbiddenError';
  }
}

module.exports = ForbiddenError;
