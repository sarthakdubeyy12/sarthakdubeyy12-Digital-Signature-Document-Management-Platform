// HTTP status codes with messages
const HTTP_STATUS = {
  OK: { code: 200, message: 'Success' },
  CREATED: { code: 201, message: 'Created' },
  ACCEPTED: { code: 202, message: 'Accepted' },
  NO_CONTENT: { code: 204, message: 'No Content' },
  BAD_REQUEST: { code: 400, message: 'Bad Request' },
  UNAUTHORIZED: { code: 401, message: 'Unauthorized' },
  FORBIDDEN: { code: 403, message: 'Forbidden' },
  NOT_FOUND: { code: 404, message: 'Not Found' },
  CONFLICT: { code: 409, message: 'Conflict' },
  UNPROCESSABLE_ENTITY: { code: 422, message: 'Unprocessable Entity' },
  TOO_MANY_REQUESTS: { code: 429, message: 'Too Many Requests' },
  INTERNAL_SERVER_ERROR: { code: 500, message: 'Internal Server Error' },
  SERVICE_UNAVAILABLE: { code: 503, message: 'Service Unavailable' },
};

// Error messages
const ERROR_MESSAGES = {
  // Auth
  INVALID_CREDENTIALS: 'Invalid email or password',
  UNAUTHORIZED: 'Authentication required',
  FORBIDDEN: 'Access denied',
  TOKEN_INVALID: 'Invalid token',
  TOKEN_EXPIRED: 'Token expired',
  EMAIL_EXISTS: 'Email already registered',
  USER_NOT_FOUND: 'User not found',
  
  // Documents
  DOCUMENT_NOT_FOUND: 'Document not found',
  INVALID_FILE_TYPE: 'Invalid file type',
  FILE_TOO_LARGE: 'File size exceeds limit',
  UPLOAD_FAILED: 'File upload failed',
  
  // Signatures
  SIGNATURE_NOT_FOUND: 'Signature not found',
  SIGNATURE_APPLY_FAILED: 'Failed to apply signature',
  
  // Verification
  VERIFICATION_FAILED: 'Document verification failed',
  INVALID_VERIFICATION_CODE: 'Invalid verification code',
  
  // General
  VALIDATION_ERROR: 'Validation error',
  INTERNAL_ERROR: 'Internal server error',
  RESOURCE_NOT_FOUND: 'Resource not found',
};

// Success messages
const SUCCESS_MESSAGES = {
  // Auth
  REGISTER_SUCCESS: 'Registration successful',
  LOGIN_SUCCESS: 'Login successful',
  LOGOUT_SUCCESS: 'Logout successful',
  PASSWORD_RESET_SENT: 'Password reset email sent',
  PASSWORD_RESET_SUCCESS: 'Password reset successful',
  PASSWORD_CHANGE_SUCCESS: 'Password changed successfully',
  
  // Documents
  DOCUMENT_UPLOADED: 'Document uploaded successfully',
  DOCUMENT_DELETED: 'Document deleted successfully',
  DOCUMENT_SIGNED: 'Document signed successfully',
  
  // Signatures
  SIGNATURE_CREATED: 'Signature created successfully',
  SIGNATURE_DELETED: 'Signature deleted successfully',
  SIGNATURE_APPLIED: 'Signature applied successfully',
  
  // Verification
  VERIFICATION_SUCCESS: 'Document verified successfully',
  
  // User
  PROFILE_UPDATED: 'Profile updated successfully',
  ACCOUNT_DELETED: 'Account deleted successfully',
};

module.exports = {
  HTTP_STATUS,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
};
