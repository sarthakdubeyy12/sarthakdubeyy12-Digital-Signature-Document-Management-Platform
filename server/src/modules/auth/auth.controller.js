const authService = require('./auth.service');
const ResponseUtil = require('../../shared/utils/response.util');
const logger = require('../../services/logger/logger.service');
const { SUCCESS_MESSAGES } = require('../../shared/constants');
const { AUDIT_ACTIONS, AUDIT_RESOURCES } = require('../../shared/constants');

class AuthController {
  async register(req, res) {
    const { email, password, firstName, lastName } = req.body;

    const result = await authService.register({
      email,
      password,
      firstName,
      lastName,
    });

    // Log audit
    req.auditLog = {
      action: AUDIT_ACTIONS.USER_REGISTER,
      resource: AUDIT_RESOURCES.USER,
      resourceId: result.user.id,
      metadata: { email: result.user.email },
    };

    return ResponseUtil.created(res, result, SUCCESS_MESSAGES.REGISTER_SUCCESS);
  }

  async login(req, res) {
    const { email, password } = req.body;

    const result = await authService.login(email, password);

    // Log audit
    req.auditLog = {
      action: AUDIT_ACTIONS.USER_LOGIN,
      resource: AUDIT_RESOURCES.USER,
      resourceId: result.user.id,
      metadata: { email: result.user.email },
    };

    return ResponseUtil.success(res, result, SUCCESS_MESSAGES.LOGIN_SUCCESS);
  }

  async refreshToken(req, res) {
    const { refreshToken } = req.body;

    const result = await authService.refreshToken(refreshToken);

    // Log audit
    req.auditLog = {
      action: AUDIT_ACTIONS.USER_REFRESH_TOKEN,
      resource: AUDIT_RESOURCES.SYSTEM,
    };

    return ResponseUtil.success(res, result, 'Token refreshed successfully');
  }

  async logout(req, res) {
    const { refreshToken } = req.body;

    const result = await authService.logout(refreshToken);

    // Log audit
    req.auditLog = {
      action: AUDIT_ACTIONS.USER_LOGOUT,
      resource: AUDIT_RESOURCES.USER,
      resourceId: req.user?.userId,
    };

    return ResponseUtil.success(res, result, SUCCESS_MESSAGES.LOGOUT_SUCCESS);
  }

  async forgotPassword(req, res) {
    const { email } = req.body;

    const result = await authService.forgotPassword(email);

    // Log audit
    req.auditLog = {
      action: AUDIT_ACTIONS.PASSWORD_RESET_REQUEST,
      resource: AUDIT_RESOURCES.USER,
      metadata: { email },
    };

    return ResponseUtil.success(res, result, SUCCESS_MESSAGES.PASSWORD_RESET_SENT);
  }

  async resetPassword(req, res) {
    const { token, password } = req.body;

    const result = await authService.resetPassword(token, password);

    // Log audit
    req.auditLog = {
      action: AUDIT_ACTIONS.PASSWORD_RESET_COMPLETE,
      resource: AUDIT_RESOURCES.USER,
    };

    return ResponseUtil.success(res, result, SUCCESS_MESSAGES.PASSWORD_RESET_SUCCESS);
  }

  async changePassword(req, res) {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.userId;

    const result = await authService.changePassword(userId, currentPassword, newPassword);

    // Log audit
    req.auditLog = {
      action: AUDIT_ACTIONS.PASSWORD_CHANGE,
      resource: AUDIT_RESOURCES.USER,
      resourceId: userId,
    };

    return ResponseUtil.success(res, result, SUCCESS_MESSAGES.PASSWORD_CHANGE_SUCCESS);
  }

  async me(req, res) {
    const userId = req.user.userId;

    // User data is already available from auth middleware
    const userData = {
      id: userId,
      email: req.user.email,
      role: req.user.role,
    };

    return ResponseUtil.success(res, userData, 'User profile retrieved');
  }
}

module.exports = new AuthController();
