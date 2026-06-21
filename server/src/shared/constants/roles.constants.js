// User roles
const ROLES = {
  USER: 'user',
  ADMIN: 'admin',
};

// Role hierarchy for permission checks
const ROLE_HIERARCHY = {
  [ROLES.ADMIN]: [ROLES.ADMIN, ROLES.USER],
  [ROLES.USER]: [ROLES.USER],
};

module.exports = {
  ROLES,
  ROLE_HIERARCHY,
};
