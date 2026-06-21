// Document status
const DOCUMENT_STATUS = {
  UPLOADED: 'uploaded',
  SIGNING: 'signing',
  SIGNED: 'signed',
  FAILED: 'failed',
};

// User status
const USER_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  SUSPENDED: 'suspended',
};

// Token status
const TOKEN_STATUS = {
  ACTIVE: 'active',
  EXPIRED: 'expired',
  REVOKED: 'revoked',
};

module.exports = {
  DOCUMENT_STATUS,
  USER_STATUS,
  TOKEN_STATUS,
};
