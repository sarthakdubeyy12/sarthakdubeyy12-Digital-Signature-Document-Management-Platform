const documentService = require('./document.service');
const logger = require('../../services/logger/logger.service');

/**
 * Document Controller
 * Handles HTTP requests for document operations
 */
class DocumentController {
  /**
   * Upload document
   * POST /api/v1/documents
   */
  async uploadDocument(req, res, next) {
    try {
      const userId = req.user.userId;
      const file = req.file;
      const metadata = req.body;

      const document = await documentService.uploadDocument(
        userId,
        file,
        metadata
      );

      logger.info('Document upload request successful', {
        userId,
        documentId: document.id,
      });

      res.status(201).json({
        success: true,
        message: 'Document uploaded successfully',
        data: document,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get document by ID
   * GET /api/v1/documents/:id
   */
  async getDocumentById(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user.userId;
      const isAdmin = req.user.role === 'ADMIN';

      const document = await documentService.getDocumentById(
        id,
        userId,
        isAdmin
      );

      res.status(200).json({
        success: true,
        data: document,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * List user documents
   * GET /api/v1/documents
   */
  async listDocuments(req, res, next) {
    try {
      const userId = req.user.userId;
      const filters = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 10,
        status: req.query.status,
        sortBy: req.query.sortBy || 'createdAt',
        sortOrder: req.query.sortOrder || 'desc',
        search: req.query.search,
      };

      const result = await documentService.listUserDocuments(userId, filters);

      res.status(200).json({
        success: true,
        data: result.documents,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update document metadata
   * PATCH /api/v1/documents/:id
   */
  async updateDocument(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user.userId;
      const updates = req.body;

      const document = await documentService.updateDocument(
        id,
        userId,
        updates
      );

      logger.info('Document update request successful', {
        userId,
        documentId: id,
      });

      res.status(200).json({
        success: true,
        message: 'Document updated successfully',
        data: document,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete document
   * DELETE /api/v1/documents/:id
   */
  async deleteDocument(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user.userId;
      const isAdmin = req.user.role === 'ADMIN';

      const result = await documentService.deleteDocument(id, userId, isAdmin);

      logger.info('Document delete request successful', {
        userId,
        documentId: id,
      });

      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Download document
   * GET /api/v1/documents/:id/download
   */
  async downloadDocument(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user.userId;
      const version = req.query.version || 'original';
      const isAdmin = req.user.role === 'ADMIN';

      const result = await documentService.downloadDocument(
        id,
        userId,
        version,
        isAdmin
      );

      // Set response headers for file download
      res.set({
        'Content-Type': result.mimeType,
        'Content-Length': result.size,
        'Content-Disposition': `attachment; filename="${result.filename}"`,
        'Cache-Control': 'no-cache',
      });

      logger.info('Document download request successful', {
        userId,
        documentId: id,
        version,
      });

      res.send(result.buffer);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get user document statistics
   * GET /api/v1/documents/stats
   */
  async getUserStats(req, res, next) {
    try {
      const userId = req.user.userId;

      const stats = await documentService.getUserStats(userId);

      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new DocumentController();
