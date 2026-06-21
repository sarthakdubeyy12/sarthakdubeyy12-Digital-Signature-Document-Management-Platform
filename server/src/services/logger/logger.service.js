const { logger, auditLogger } = require('./winston.config');

class LoggerService {
  // General logging
  debug(message, meta = {}) {
    logger.debug(message, meta);
  }

  info(message, meta = {}) {
    logger.info(message, meta);
  }

  warn(message, meta = {}) {
    logger.warn(message, meta);
  }

  error(message, error = null, meta = {}) {
    if (error instanceof Error) {
      logger.error(message, {
        ...meta,
        error: {
          message: error.message,
          stack: error.stack,
          name: error.name,
        },
      });
    } else {
      logger.error(message, { ...meta, error });
    }
  }

  // Audit logging
  audit(action, userId, resource, resourceId, metadata = {}) {
    auditLogger.info('Audit Log', {
      action,
      userId,
      resource,
      resourceId,
      metadata,
      timestamp: new Date().toISOString(),
    });
  }

  // HTTP request logging
  http(message, meta = {}) {
    logger.http(message, meta);
  }
}

module.exports = new LoggerService();
