const express = require('express');
const signatureController = require('./signature.controller');
const { authenticate } = require('../../middleware/auth.middleware');
const { validate } = require('../../middleware/validation.middleware');
const { uploadMiddleware } = require('../../middleware/upload.middleware');
const {
  createSignatureSchema,
  applySignatureSchema,
  getSignatureByIdSchema,
  deleteSignatureSchema,
  listSignaturesSchema,
  updateSignatureSchema,
} = require('./signature.validation');

const router = express.Router();

/**
 * All signature routes require authentication
 */
router.use(authenticate);

/**
 * @route   GET /api/v1/signatures/reusable
 * @desc    Get reusable signatures for user
 * @access  Private
 */
router.get('/reusable', signatureController.getReusableSignatures);

/**
 * @route   POST /api/v1/signatures
 * @desc    Create a new signature (drawn or uploaded)
 * @access  Private
 */
router.post(
  '/',
  uploadMiddleware.single('signature'),
  validate(createSignatureSchema),
  signatureController.createSignature
);

/**
 * @route   POST /api/v1/signatures/apply/:documentId
 * @desc    Apply signature to a document
 * @access  Private
 */
router.post(
  '/apply/:documentId',
  validate(applySignatureSchema),
  signatureController.applySignature
);

/**
 * @route   GET /api/v1/signatures
 * @desc    List user signatures with pagination
 * @access  Private
 */
router.get(
  '/',
  validate(listSignaturesSchema),
  signatureController.listSignatures
);

/**
 * @route   GET /api/v1/signatures/:id
 * @desc    Get signature by ID
 * @access  Private
 */
router.get(
  '/:id',
  validate(getSignatureByIdSchema),
  signatureController.getSignatureById
);

/**
 * @route   PATCH /api/v1/signatures/:id
 * @desc    Update signature
 * @access  Private
 */
router.patch(
  '/:id',
  validate(updateSignatureSchema),
  signatureController.updateSignature
);

/**
 * @route   DELETE /api/v1/signatures/:id
 * @desc    Delete signature
 * @access  Private
 */
router.delete(
  '/:id',
  validate(deleteSignatureSchema),
  signatureController.deleteSignature
);

module.exports = router;
