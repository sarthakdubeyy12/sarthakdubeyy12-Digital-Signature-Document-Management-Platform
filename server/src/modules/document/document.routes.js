const express = require('express');
const documentController = require('./document.controller');
const { authenticate } = require('../../middleware/auth.middleware');
const { validate } = require('../../middleware/validation.middleware');
const { uploadMiddleware } = require('../../middleware/upload.middleware');
const {
  uploadDocumentSchema,
  updateDocumentSchema,
  getDocumentByIdSchema,
  deleteDocumentSchema,
  listDocumentsSchema,
  downloadDocumentSchema,
} = require('./document.validation');

const router = express.Router();

/**
 * All document routes require authentication
 */
router.use(authenticate);

/**
 * @route   GET /api/v1/documents/stats
 * @desc    Get user document statistics
 * @access  Private
 */
router.get('/stats', documentController.getUserStats);

/**
 * @route   POST /api/v1/documents
 * @desc    Upload a new document
 * @access  Private
 */
router.post(
  '/',
  uploadMiddleware.single('document'),
  validate(uploadDocumentSchema),
  documentController.uploadDocument
);

/**
 * @route   GET /api/v1/documents
 * @desc    List user documents with pagination and filters
 * @access  Private
 */
router.get(
  '/',
  validate(listDocumentsSchema),
  documentController.listDocuments
);

/**
 * @route   GET /api/v1/documents/:id
 * @desc    Get document by ID
 * @access  Private
 */
router.get(
  '/:id',
  validate(getDocumentByIdSchema),
  documentController.getDocumentById
);

/**
 * @route   PATCH /api/v1/documents/:id
 * @desc    Update document metadata
 * @access  Private
 */
router.patch(
  '/:id',
  validate(updateDocumentSchema),
  documentController.updateDocument
);

/**
 * @route   DELETE /api/v1/documents/:id
 * @desc    Delete document
 * @access  Private
 */
router.delete(
  '/:id',
  validate(deleteDocumentSchema),
  documentController.deleteDocument
);

/**
 * @route   GET /api/v1/documents/:id/download
 * @desc    Download document (original or signed version)
 * @access  Private
 */
router.get(
  '/:id/download',
  validate(downloadDocumentSchema),
  documentController.downloadDocument
);

module.exports = router;
