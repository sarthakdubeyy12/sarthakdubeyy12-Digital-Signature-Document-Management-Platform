const signatureService = require('./signature.service');
const logger = require('../../services/logger/logger.service');

/**
 * Signature Controller
 * Handles HTTP requests for signature operations
 */
class SignatureController {
  /**
   * Create signature
   * POST /api/v1/signatures
   */
  async createSignature(req, res, next) {
    try {
      const userId = req.user.userId;
      const data = req.body;
      const file = req.file;

      const signature = await signatureService.createSignature(
        userId,
        data,
        file
      );

      logger.info('Signature creation request successful', {
        userId,
        signatureId: signature.id,
      });

      res.status(201).json({
        success: true,
        message: 'Signature created successfully',
        data: signature,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Apply signature to document
   * POST /api/v1/signatures/apply/:documentId
   */
  async applySignature(req, res, next) {
    try {
      const userId = req.user.userId;
      const { documentId } = req.params;
      const { signatureId, position } = req.body;

      const result = await signatureService.applySignatureToDocument(
        userId,
        documentId,
        signatureId,
        position
      );

      logger.info('Signature application request successful', {
        userId,
        documentId,
        signatureId,
      });

      res.status(200).json({
        success: true,
        message: 'Signature applied successfully',
        data: {
          document: result.document,
          signature: result.signature,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get signature by ID
   * GET /api/v1/signatures/:id
   */
  async getSignatureById(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user.userId;
      const isAdmin = req.user.role === 'ADMIN';

      const signature = await signatureService.getSignatureById(
        id,
        userId,
        isAdmin
      );

      res.status(200).json({
        success: true,
        data: signature,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * List user signatures
   * GET /api/v1/signatures
   */
  async listSignatures(req, res, next) {
    try {
      const userId = req.user.userId;
      const filters = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 10,
        isReusable: req.query.isReusable,
      };

      const result = await signatureService.listUserSignatures(userId, filters);

      res.status(200).json({
        success: true,
        data: result.signatures,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update signature
   * PATCH /api/v1/signatures/:id
   */
  async updateSignature(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user.userId;
      const updates = req.body;

      const signature = await signatureService.updateSignature(
        id,
        userId,
        updates
      );

      logger.info('Signature update request successful', {
        userId,
        signatureId: id,
      });

      res.status(200).json({
        success: true,
        message: 'Signature updated successfully',
        data: signature,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete signature
   * DELETE /api/v1/signatures/:id
   */
  async deleteSignature(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user.userId;
      const isAdmin = req.user.role === 'ADMIN';

      const result = await signatureService.deleteSignature(id, userId, isAdmin);

      logger.info('Signature delete request successful', {
        userId,
        signatureId: id,
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
   * Get reusable signatures
   * GET /api/v1/signatures/reusable
   */
  async getReusableSignatures(req, res, next) {
    try {
      const userId = req.user.userId;

      const signatures = await signatureService.getReusableSignatures(userId);

      res.status(200).json({
        success: true,
        data: signatures,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new SignatureController();
