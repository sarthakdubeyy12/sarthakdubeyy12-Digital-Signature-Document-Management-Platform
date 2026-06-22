const express = require('express');
const auditController = require('./audit.controller');
const { authenticate, authorize } = require('../../middleware/auth.middleware');
const { auditAdmin } = require('../../middleware/audit.middleware');
const { validate } = require('../../middleware/validation.middleware');
const {
  listAuditLogsSchema,
  getAuditLogByIdSchema,
  getUserActivitySchema,
  getAuditStatsSchema,
  exportAuditLogsSchema,
} = require('./audit.validation');

const router = express.Router();

// ============================================
// USER ROUTES (Authenticated)
// ============================================

/**
 * @route   GET /api/v1/audit/my-activity
 * @desc    Get own activity logs
 * @access  Private
 */
router.get('/my-activity', authenticate, auditController.getMyActivity);

/**
 * @route   GET /api/v1/audit/my-login-history
 * @desc    Get own login history
 * @access  Private
 */
router.get(
  '/my-login-history',
  authenticate,
  auditController.getMyLoginHistory
);

/**
 * @route   GET /api/v1/audit/user/:userId
 * @desc    Get user activity (Admin or own)
 * @access  Private
 */
router.get(
  '/user/:userId',
  authenticate,
  validate(getUserActivitySchema),
  auditController.getUserActivity
);

// ============================================
// ADMIN ROUTES
// ============================================

/**
 * @route   GET /api/v1/admin/audit
 * @desc    List all audit logs with filters
 * @access  Admin
 */
router.get(
  '/admin',
  authenticate,
  authorize('ADMIN'),
  validate(listAuditLogsSchema),
  auditAdmin.viewAuditLogs,
  auditController.listAuditLogs
);

/**
 * @route   GET /api/v1/admin/audit/stats
 * @desc    Get audit statistics
 * @access  Admin
 */
router.get(
  '/admin/stats',
  authenticate,
  authorize('ADMIN'),
  validate(getAuditStatsSchema),
  auditController.getAuditStatistics
);

/**
 * @route   GET /api/v1/admin/audit/timeline
 * @desc    Get activity timeline
 * @access  Admin
 */
router.get(
  '/admin/timeline',
  authenticate,
  authorize('ADMIN'),
  validate(getAuditStatsSchema),
  auditController.getActivityTimeline
);

/**
 * @route   GET /api/v1/admin/audit/recent
 * @desc    Get recent activity for dashboard
 * @access  Admin
 */
router.get(
  '/admin/recent',
  authenticate,
  authorize('ADMIN'),
  auditController.getRecentActivity
);

/**
 * @route   GET /api/v1/admin/audit/suspicious
 * @desc    Get suspicious activities
 * @access  Admin
 */
router.get(
  '/admin/suspicious',
  authenticate,
  authorize('ADMIN'),
  auditController.getSuspiciousActivities
);

/**
 * @route   GET /api/v1/admin/audit/export
 * @desc    Export audit logs (JSON or CSV)
 * @access  Admin
 */
router.get(
  '/admin/export',
  authenticate,
  authorize('ADMIN'),
  validate(exportAuditLogsSchema),
  auditController.exportAuditLogs
);

/**
 * @route   GET /api/v1/admin/audit/:id
 * @desc    Get audit log by ID
 * @access  Admin
 */
router.get(
  '/admin/:id',
  authenticate,
  authorize('ADMIN'),
  validate(getAuditLogByIdSchema),
  auditController.getAuditLogById
);

module.exports = router;
