const verificationService = require('./verification.service');
const logger = require('../../services/logger/logger.service');
const VerificationUtils = require('../../shared/utils/verification.utils');

/**
 * Verification Controller
 * Handles HTTP requests for document verification
 */
class VerificationController {
  /**
   * Verify document by code (Public endpoint)
   * GET /api/v1/verify/:code
   */
  async verifyDocument(req, res, next) {
    try {
      const { code } = req.params;
      const metadata = VerificationUtils.extractVerificationMetadata(req);

      const result = await verificationService.verifyDocument(code, metadata);

      logger.info('Verification request successful', {
        verificationCode: code,
        ipAddress: metadata.ipAddress,
      });

      res.status(200).json({
        success: true,
        message: 'Document verified successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get QR code for verification
   * GET /api/v1/verify/:code/qrcode
   */
  async getQRCode(req, res, next) {
    try {
      const { code } = req.params;
      const { width, format = 'png' } = req.query;

      const options = {};
      if (width) options.width = parseInt(width);

      const qrCode = await verificationService.getQRCode(code, options);

      // If requesting PNG buffer (for download)
      if (format === 'buffer') {
        const buffer = await verificationService.getQRCodeBuffer(code, options);
        res.setHeader('Content-Type', 'image/png');
        res.setHeader(
          'Content-Disposition',
          `attachment; filename="qrcode-${code}.png"`
        );
        return res.send(buffer);
      }

      // Return as data URL (default)
      res.status(200).json({
        success: true,
        data: {
          qrCode,
          verificationCode: code,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get verification details by document ID (Private)
   * GET /api/v1/documents/:documentId/verification
   */
  async getVerificationByDocumentId(req, res, next) {
    try {
      const { documentId } = req.params;
      const userId = req.user.userId;

      const verification =
        await verificationService.getVerificationByDocumentId(documentId, userId);

      res.status(200).json({
        success: true,
        data: verification,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Regenerate QR code for document (Private)
   * POST /api/v1/documents/:documentId/verification/regenerate-qr
   */
  async regenerateQRCode(req, res, next) {
    try {
      const { documentId } = req.params;
      const userId = req.user.userId;

      const verification = await verificationService.regenerateQRCode(
        documentId,
        userId
      );

      logger.info('QR code regeneration request successful', {
        userId,
        documentId,
      });

      res.status(200).json({
        success: true,
        message: 'QR code regenerated successfully',
        data: verification,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get verification statistics (Admin only)
   * GET /api/v1/admin/verification/stats
   */
  async getVerificationStatistics(req, res, next) {
    try {
      const { startDate, endDate } = req.query;

      const stats = await verificationService.getVerificationStatistics({
        startDate,
        endDate,
      });

      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create verification for document (Internal/Private)
   * POST /api/v1/documents/:documentId/verification
   */
  async createVerification(req, res, next) {
    try {
      const { documentId } = req.params;
      const userId = req.user.userId;

      // Verify document ownership
      const document = await require('../document/document.repository').findDocumentById(
        documentId,
        userId
      );

      if (!document) {
        return res.status(404).json({
          success: false,
          message: 'Document not found',
        });
      }

      const verification = await verificationService.createVerification(
        documentId
      );

      logger.info('Verification creation request successful', {
        userId,
        documentId,
      });

      res.status(201).json({
        success: true,
        message: 'Verification created successfully',
        data: verification,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Invalidate verification cache (Admin only)
   * DELETE /api/v1/admin/verification/:code/cache
   */
  async invalidateCache(req, res, next) {
    try {
      const { code } = req.params;

      await verificationService.invalidateCache(code);

      logger.info('Cache invalidation request successful', {
        verificationCode: code,
        adminId: req.user.userId,
      });

      res.status(200).json({
        success: true,
        message: 'Cache invalidated successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new VerificationController();
