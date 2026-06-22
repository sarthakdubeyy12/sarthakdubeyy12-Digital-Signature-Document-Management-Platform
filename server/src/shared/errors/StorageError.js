const AppError = require('./AppError');

/**
 * Storage Error
 * Thrown when storage operations fail
 */
class StorageError extends AppError {
  constructor(message = 'Storage operation failed', statusCode = 500) {
    super(message, statusCode);
    this.name = 'StorageError';
  }
}

module.exports = StorageError;
