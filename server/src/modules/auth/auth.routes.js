const express = require('express');
const authController = require('./auth.controller');
const { validate } = require('../../middleware/validation.middleware');
const { authenticate } = require('../../middleware/auth.middleware');
const { auditAuth } = require('../../middleware/audit.middleware');
const { authLimiter } = require('../../middleware/rateLimit.middleware');
const { asyncHandler } = require('../../middleware/error.middleware');
const {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
} = require('./auth.validation');

const router = express.Router();

// Public routes with rate limiting
router.post(
  '/register',
  authLimiter,
  validate(registerSchema),
  auditAuth.register,
  asyncHandler(authController.register.bind(authController))
);

router.post(
  '/login',
  authLimiter,
  validate(loginSchema),
  auditAuth.login,
  asyncHandler(authController.login.bind(authController))
);

router.post(
  '/refresh',
  validate(refreshTokenSchema),
  auditAuth.refreshToken,
  asyncHandler(authController.refreshToken.bind(authController))
);

router.post(
  '/forgot-password',
  authLimiter,
  validate(forgotPasswordSchema),
  auditAuth.passwordResetRequest,
  asyncHandler(authController.forgotPassword.bind(authController))
);

router.post(
  '/reset-password',
  authLimiter,
  validate(resetPasswordSchema),
  auditAuth.passwordResetComplete,
  asyncHandler(authController.resetPassword.bind(authController))
);

// Protected routes
router.post(
  '/logout',
  authenticate,
  auditAuth.logout,
  asyncHandler(authController.logout.bind(authController))
);

router.post(
  '/change-password',
  authenticate,
  validate(changePasswordSchema),
  auditAuth.passwordChange,
  asyncHandler(authController.changePassword.bind(authController))
);

router.get('/me', authenticate, asyncHandler(authController.me.bind(authController)));

module.exports = router;
