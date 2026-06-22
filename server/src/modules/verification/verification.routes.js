const express = require('express');
const verificationController = require('./verification.controller');
const { authenticate, authorize } = require('../../middleware/auth.middleware');
const { validate } = require('../../middleware/validation.middleware');
const {
  verifyDocumentSchema,
  getVerificationStatsSchema,
  regenerateQRCodeSchema,
} = require('./verification.validation');

const router = express.Router();

// ============================================
// PUBLIC ROUTES (No authentication required)
// ============================================

/**
 * @route   GET /api/v1/verify/:code
 * @desc    Verify document by verification code (Public)
 * @access  Public
 */
router.get(
  '/:code',
  validate(verifyDocumentSchema),
  verificationController.verifyDocument
);

/**
 * @route   GET /api/v1/verify/:code/qrcode
 * @desc    Get QR code for verification (Public)
 * @access  Public
 */
router.get('/:code/qrcode', verificationController.getQRCode);

// ============================================
// PRIVATE ROUTES (Authentication required)
// ============================================

/**
 * @route   GET /api/v1/documents/:documentId/verification
 * @desc    Get verification details for user's document
 * @access  Private
 */
router.get(
  '/document/:documentId',
  authenticate,
  verificationController.getVerificationByDocumentId
);

/**
 * @route   POST /api/v1/documents/:documentId/verification
 * @desc    Create verification for document
 * @access  Private
 */
router.post(
  '/document/:documentId',
  authenticate,
  verificationController.createVerification
);

/**
 * @route   POST /api/v1/documents/:documentId/verification/regenerate-qr
 * @desc    Regenerate QR code for document
 * @access  Private
 */
router.post(
  '/document/:documentId/regenerate-qr',
  authenticate,
  validate(regenerateQRCodeSchema),
  verificationController.regenerateQRCode
);

// ============================================
// ADMIN ROUTES (Admin only)
// ============================================

/**
 * @route   GET /api/v1/admin/verification/stats
 * @desc    Get verification statistics
 * @access  Admin
 */
router.get(
  '/admin/stats',
  authenticate,
  authorize('ADMIN'),
  validate(getVerificationStatsSchema),
  verificationController.getVerificationStatistics
);

/**
 * @route   DELETE /api/v1/admin/verification/:code/cache
 * @desc    Invalidate verification cache
 * @access  Admin
 */
router.delete(
  '/admin/:code/cache',
  authenticate,
  authorize('ADMIN'),
  verificationController.invalidateCache
);

module.exports = router;
