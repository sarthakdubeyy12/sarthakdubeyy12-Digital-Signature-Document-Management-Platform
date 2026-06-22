const AppError = require('./AppError');
const ValidationError = require('./ValidationError');
const AuthenticationError = require('./AuthenticationError');
const AuthorizationError = require('./AuthorizationError');
const NotFoundError = require('./NotFoundError');
const StorageError = require('./StorageError');
const ForbiddenError = require('./ForbiddenError');

module.exports = {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  StorageError,
  ForbiddenError,
};
