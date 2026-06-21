const AppError = require('./AppError');

class ValidationError extends AppError {
  constructor(message = 'Validation failed', errors = null) {
    super(message, 400, errors);
    this.name = 'ValidationError';
  }
}

module.exports = ValidationError;
