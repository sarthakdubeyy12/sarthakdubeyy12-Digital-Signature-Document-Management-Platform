// Audit action types
const AUDIT_ACTIONS = {
  // Auth actions
  USER_REGISTER: 'user.register',
  USER_LOGIN: 'user.login',
  USER_LOGOUT: 'user.logout',
  USER_REFRESH_TOKEN: 'user.refresh_token',
  PASSWORD_RESET_REQUEST: 'password.reset_request',
  PASSWORD_RESET_COMPLETE: 'password.reset_complete',
  PASSWORD_CHANGE: 'password.change',

  // User actions
  USER_UPDATE: 'user.update',
  USER_DELETE: 'user.delete',
  USER_VIEW: 'user.view',

  // Document actions
  DOCUMENT_UPLOAD: 'document.upload',
  DOCUMENT_VIEW: 'document.view',
  DOCUMENT_DOWNLOAD: 'document.download',
  DOCUMENT_DELETE: 'document.delete',
  DOCUMENT_UPDATE: 'document.update',

  // Signature actions
  SIGNATURE_CREATE: 'signature.create',
  SIGNATURE_APPLY: 'signature.apply',
  SIGNATURE_DELETE: 'signature.delete',
  DOCUMENT_SIGN: 'document.sign',

  // Verification actions
  DOCUMENT_VERIFY: 'document.verify',
  VERIFICATION_SUCCESS: 'verification.success',
  VERIFICATION_FAILED: 'verification.failed',

  // Admin actions
  ADMIN_USER_VIEW: 'admin.user.view',
  ADMIN_DOCUMENT_VIEW: 'admin.document.view',
  ADMIN_AUDIT_VIEW: 'admin.audit.view',
};

// Resource types
const AUDIT_RESOURCES = {
  USER: 'user',
  DOCUMENT: 'document',
  SIGNATURE: 'signature',
  VERIFICATION: 'verification',
  SYSTEM: 'system',
};

module.exports = {
  AUDIT_ACTIONS,
  AUDIT_RESOURCES,
};
