const express = require('express');
const adminController = require('./admin.controller');
const { authenticate, authorize } = require('../../middleware/auth.middleware');
const { auditAdmin } = require('../../middleware/audit.middleware');
const { validate } = require('../../middleware/validation.middleware');
const {
  listUsersSchema,
  getUserByIdSchema,
  updateUserSchema,
  listDocumentsSchema,
  listSignaturesSchema,
  getDashboardStatsSchema,
  getSystemHealthSchema,
} = require('./admin.validation');

const router = express.Router();

/**
 * All admin routes require authentication and ADMIN role
 */
router.use(authenticate);
router.use(authorize('ADMIN'));

// ============================================
// DASHBOARD & OVERVIEW
// ============================================

/**
 * @route   GET /api/v1/admin/overview
 * @desc    Get comprehensive overview (main dashboard)
 * @access  Admin
 */
router.get('/overview', adminController.getOverview);

/**
 * @route   GET /api/v1/admin/dashboard
 * @desc    Get dashboard statistics
 * @access  Admin
 */
router.get(
  '/dashboard',
  validate(getDashboardStatsSchema),
  adminController.getDashboardStats
);

/**
 * @route   GET /api/v1/admin/trends
 * @desc    Get activity trends for charts
 * @access  Admin
 */
router.get('/trends', adminController.getActivityTrends);

// ============================================
// USER MANAGEMENT
// ============================================

/**
 * @route   GET /api/v1/admin/users
 * @desc    List all users with filters
 * @access  Admin
 */
router.get(
  '/users',
  validate(listUsersSchema),
  auditAdmin.viewUsers,
  adminController.listUsers
);

/**
 * @route   GET /api/v1/admin/users/:id
 * @desc    Get user by ID with full details
 * @access  Admin
 */
router.get(
  '/users/:id',
  validate(getUserByIdSchema),
  adminController.getUserById
);

/**
 * @route   PATCH /api/v1/admin/users/:id
 * @desc    Update user (role, status, etc.)
 * @access  Admin
 */
router.patch(
  '/users/:id',
  validate(updateUserSchema),
  adminController.updateUser
);

// ============================================
// DOCUMENT MANAGEMENT
// ============================================

/**
 * @route   GET /api/v1/admin/documents
 * @desc    List all documents with filters
 * @access  Admin
 */
router.get(
  '/documents',
  validate(listDocumentsSchema),
  auditAdmin.viewDocuments,
  adminController.listDocuments
);

// ============================================
// SIGNATURE MANAGEMENT
// ============================================

/**
 * @route   GET /api/v1/admin/signatures
 * @desc    List all signatures with filters
 * @access  Admin
 */
router.get(
  '/signatures',
  validate(listSignaturesSchema),
  adminController.listSignatures
);

// ============================================
// STATISTICS
// ============================================

/**
 * @route   GET /api/v1/admin/stats/users
 * @desc    Get user statistics
 * @access  Admin
 */
router.get('/stats/users', adminController.getUserStatistics);

/**
 * @route   GET /api/v1/admin/stats/documents
 * @desc    Get document statistics
 * @access  Admin
 */
router.get('/stats/documents', adminController.getDocumentStatistics);

/**
 * @route   GET /api/v1/admin/stats/signatures
 * @desc    Get signature statistics
 * @access  Admin
 */
router.get('/stats/signatures', adminController.getSignatureStatistics);

// ============================================
// SYSTEM MONITORING
// ============================================

/**
 * @route   GET /api/v1/admin/health
 * @desc    Get system health status
 * @access  Admin
 */
router.get(
  '/health',
  validate(getSystemHealthSchema),
  adminController.getSystemHealth
);

/**
 * @route   GET /api/v1/admin/metrics
 * @desc    Get system metrics
 * @access  Admin
 */
router.get('/metrics', adminController.getSystemMetrics);

// ============================================
// CACHE MANAGEMENT
// ============================================

/**
 * @route   DELETE /api/v1/admin/cache
 * @desc    Clear admin cache
 * @access  Admin
 */
router.delete('/cache', adminController.clearCache);

module.exports = router;
