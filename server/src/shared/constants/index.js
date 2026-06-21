const { ROLES, ROLE_HIERARCHY } = require('./roles.constants');
const { DOCUMENT_STATUS, USER_STATUS, TOKEN_STATUS } = require('./status.constants');
const { AUDIT_ACTIONS, AUDIT_RESOURCES } = require('./audit.constants');
const { HTTP_STATUS, ERROR_MESSAGES, SUCCESS_MESSAGES } = require('./error.constants');

module.exports = {
  ROLES,
  ROLE_HIERARCHY,
  DOCUMENT_STATUS,
  USER_STATUS,
  TOKEN_STATUS,
  AUDIT_ACTIONS,
  AUDIT_RESOURCES,
  HTTP_STATUS,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
};
