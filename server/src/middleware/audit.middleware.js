const prisma = require('../database/prisma.client');
const logger = require('../services/logger/logger.service');

const auditLog = async (req, res, next) => {
  // Store original send
  const originalSend = res.send;

  // Override send
  res.send = function (data) {
    // Restore original send
    res.send = originalSend;

    // Log audit if req.auditLog is set
    if (req.auditLog) {
      const { action, resource, resourceId, metadata } = req.auditLog;

      // Don't wait for audit log to complete
      prisma.auditLog
        .create({
          data: {
            userId: req.user?.userId || null,
            action,
            resource,
            resourceId,
            metadata: metadata || {},
            ipAddress: req.ip || req.connection.remoteAddress,
            userAgent: req.get('user-agent') || 'unknown',
            success: res.statusCode < 400,
            errorMessage: res.statusCode >= 400 ? data : null,
          },
        })
        .catch((error) => {
          logger.error('Failed to create audit log', error);
        });
    }

    // Send response
    return originalSend.call(this, data);
  };

  next();
};

module.exports = {
  auditLog,
};
