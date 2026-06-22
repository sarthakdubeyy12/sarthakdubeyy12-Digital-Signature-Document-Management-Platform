const authService = require('../modules/auth/auth.service');
const { AuthenticationError, AuthorizationError } = require('../shared/errors');
const { ERROR_MESSAGES } = require('../shared/constants');
const logger = require('../services/logger/logger.service');

const authenticate = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AuthenticationError(ERROR_MESSAGES.UNAUTHORIZED);
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const decoded = await authService.verifyAccessToken(token);

    // Attach user to request
    req.user = decoded;

    next();
  } catch (error) {
    logger.error('Authentication failed', error);

    if (error instanceof AuthenticationError) {
      return res.status(401).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(401).json({
      success: false,
      message: ERROR_MESSAGES.UNAUTHORIZED,
    });
  }
};

const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        throw new AuthenticationError(ERROR_MESSAGES.UNAUTHORIZED);
      }

      if (!allowedRoles.includes(req.user.role)) {
        logger.warn('Authorization failed', {
          userId: req.user.userId,
          role: req.user.role,
          requiredRoles: allowedRoles,
        });
        throw new AuthorizationError(ERROR_MESSAGES.FORBIDDEN);
      }

      next();
    } catch (error) {
      logger.error('Authorization failed', error);

      if (error instanceof AuthorizationError) {
        return res.status(403).json({
          success: false,
          message: error.message,
        });
      }

      return res.status(401).json({
        success: false,
        message: ERROR_MESSAGES.UNAUTHORIZED,
      });
    }
  };
};

const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = await authService.verifyAccessToken(token);
      req.user = decoded;
    }

    next();
  } catch (error) {
    // Silently continue without auth
    next();
  }
};

module.exports = {
  authenticate,
  authorize,
  optionalAuth,
};
