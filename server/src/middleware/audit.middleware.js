const auditService = require('../modules/audit/audit.service');
const logger = require('../services/logger/logger.service');

/**
 * Audit Middleware
 * Automatically logs important actions to audit log
 */

/**
 * Extract client IP address from request
 */
const getClientIP = (req) => {
  return (
    req.headers['x-forwarded-for']?.split(',')[0].trim() ||
    req.headers['x-real-ip'] ||
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    req.connection?.socket?.remoteAddress ||
    'Unknown'
  );
};

/**
 * Audit middleware - logs actions after response is sent
 */
const auditAction = (action, resource, options = {}) => {
  return (req, res, next) => {
    // Store original response methods
    const originalJson = res.json.bind(res);
    const originalSend = res.send.bind(res);

    // Track if audit has been logged
    let auditLogged = false;

    // Override res.json to capture response
    res.json = function (data) {
      if (!auditLogged) {
        logAudit(req, res, data, action, resource, options);
        auditLogged = true;
      }
      return originalJson(data);
    };

    // Override res.send to capture response
    res.send = function (data) {
      if (!auditLogged) {
        logAudit(req, res, data, action, resource, options);
        auditLogged = true;
      }
      return originalSend(data);
    };

    next();
  };
};

/**
 * Log audit entry
 */
const logAudit = async (req, res, responseData, action, resource, options) => {
  try {
    // Only log successful operations (2xx status codes)
    if (res.statusCode < 200 || res.statusCode >= 300) {
      // Log failed operations with error message
      if (res.statusCode >= 400) {
        await auditService.createAuditLog({
          userId: req.user?.userId || null,
          action,
          resource,
          resourceId: options.getResourceId?.(req, responseData) || null,
          metadata: {
            ...options.metadata,
            method: req.method,
            url: req.originalUrl,
            statusCode: res.statusCode,
          },
          ipAddress: getClientIP(req),
          userAgent: req.get('user-agent') || 'Unknown',
          success: false,
          errorMessage:
            typeof responseData === 'object'
              ? responseData.message || 'Operation failed'
              : 'Operation failed',
        });
      }
      return;
    }

    // Extract resource ID from response or request
    const resourceId = options.getResourceId
      ? options.getResourceId(req, responseData)
      : null;

    // Build metadata
    const metadata = {
      method: req.method,
      url: req.originalUrl,
      ...options.metadata,
    };

    // Add custom metadata from response if specified
    if (options.getMetadata) {
      Object.assign(metadata, options.getMetadata(req, responseData));
    }

    // Create audit log entry
    await auditService.createAuditLog({
      userId: req.user?.userId || null,
      action,
      resource,
      resourceId,
      metadata,
      ipAddress: getClientIP(req),
      userAgent: req.get('user-agent') || 'Unknown',
      success: true,
    });
  } catch (error) {
    // Don't fail the request if audit logging fails
    logger.error('Failed to create audit log', {
      action,
      resource,
      error: error.message,
    });
  }
};

/**
 * Conditional audit - only logs if condition is met
 */
const auditIf = (condition, action, resource, options = {}) => {
  return (req, res, next) => {
    if (condition(req, res)) {
      return auditAction(action, resource, options)(req, res, next);
    }
    next();
  };
};

/**
 * Pre-defined audit middleware for common actions
 */
const auditAuth = {
  // User registration
  register: auditAction('USER_REGISTER', 'USER', {
    getResourceId: (req, res) => res?.data?.user?.id,
    getMetadata: (req) => ({
      email: req.body?.email,
      role: req.body?.role || 'USER',
    }),
  }),

  // User login
  login: auditAction('USER_LOGIN', 'USER', {
    getResourceId: (req) => req.user?.userId,
    getMetadata: (req) => ({
      email: req.body?.email,
    }),
  }),

  // User logout
  logout: auditAction('USER_LOGOUT', 'USER', {
    getResourceId: (req) => req.user?.userId,
  }),

  // Password reset request
  passwordResetRequest: auditAction('PASSWORD_RESET_REQUEST', 'USER', {
    getResourceId: (req, res) => null,
    getMetadata: (req) => ({
      email: req.body?.email,
    }),
  }),

  // Password reset complete
  passwordResetComplete: auditAction('PASSWORD_RESET_COMPLETE', 'USER', {
    getResourceId: (req) => null,
    getMetadata: (req) => ({
      email: req.body?.email,
    }),
  }),

  // Password change
  passwordChange: auditAction('PASSWORD_CHANGE', 'USER', {
    getResourceId: (req) => req.user?.userId,
  }),

  // Token refresh
  refreshToken: auditAction('USER_REFRESH_TOKEN', 'USER', {
    getResourceId: (req) => req.user?.userId,
  }),
};

const auditDocument = {
  // Document upload
  upload: auditAction('DOCUMENT_UPLOAD', 'DOCUMENT', {
    getResourceId: (req, res) => res?.data?.id,
    getMetadata: (req, res) => ({
      title: res?.data?.title,
      fileName: res?.data?.fileName,
      fileSize: res?.data?.fileSize,
    }),
  }),

  // Document view
  view: auditAction('DOCUMENT_VIEW', 'DOCUMENT', {
    getResourceId: (req) => req.params?.id,
  }),

  // Document download
  download: auditAction('DOCUMENT_DOWNLOAD', 'DOCUMENT', {
    getResourceId: (req) => req.params?.id,
    getMetadata: (req) => ({
      version: req.query?.version || 'original',
    }),
  }),

  // Document update
  update: auditAction('DOCUMENT_UPDATE', 'DOCUMENT', {
    getResourceId: (req) => req.params?.id,
    getMetadata: (req) => ({
      updates: Object.keys(req.body),
    }),
  }),

  // Document delete
  delete: auditAction('DOCUMENT_DELETE', 'DOCUMENT', {
    getResourceId: (req) => req.params?.id,
  }),
};

const auditSignature = {
  // Signature create
  create: auditAction('SIGNATURE_CREATE', 'SIGNATURE', {
    getResourceId: (req, res) => res?.data?.id,
    getMetadata: (req, res) => ({
      name: res?.data?.name,
      isReusable: res?.data?.isReusable,
    }),
  }),

  // Signature apply (document signing)
  apply: auditAction('DOCUMENT_SIGN', 'DOCUMENT', {
    getResourceId: (req) => req.params?.documentId,
    getMetadata: (req, res) => ({
      signatureId: req.body?.signatureId,
      position: req.body?.position,
    }),
  }),

  // Signature delete
  delete: auditAction('SIGNATURE_DELETE', 'SIGNATURE', {
    getResourceId: (req) => req.params?.id,
  }),
};

const auditVerification = {
  // Document verification
  verify: auditAction('DOCUMENT_VERIFY', 'VERIFICATION', {
    getResourceId: (req, res) => res?.data?.document?.id,
    getMetadata: (req, res) => ({
      verificationCode: req.params?.code,
      verifiedCount: res?.data?.verifiedCount,
      suspicious: res?.data?.suspicious,
    }),
  }),

  // Verification success
  verifySuccess: auditAction('VERIFICATION_SUCCESS', 'VERIFICATION', {
    getResourceId: (req) => req.params?.code,
  }),
};

const auditAdmin = {
  // Admin viewing users
  viewUsers: auditAction('ADMIN_USER_VIEW', 'USER', {
    getMetadata: (req) => ({
      filters: req.query,
    }),
  }),

  // Admin viewing documents
  viewDocuments: auditAction('ADMIN_DOCUMENT_VIEW', 'DOCUMENT', {
    getMetadata: (req) => ({
      filters: req.query,
    }),
  }),

  // Admin viewing audit logs
  viewAuditLogs: auditAction('ADMIN_AUDIT_VIEW', 'SYSTEM', {
    getMetadata: (req) => ({
      filters: req.query,
    }),
  }),
};

module.exports = {
  auditAction,
  auditIf,
  auditAuth,
  auditDocument,
  auditSignature,
  auditVerification,
  auditAdmin,
  getClientIP,
};
