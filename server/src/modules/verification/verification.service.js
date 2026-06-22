const verificationRepository = require('./verification.repository');
const documentRepository = require('../document/document.repository');
const qrcodeService = require('../../services/qrcode/qrcode.service');
const cacheService = require('../../services/cache/cache.service');
const logger = require('../../services/logger/logger.service');
const VerificationUtils = require('../../shared/utils/verification.utils');
const { NotFoundError, ValidationError } = require('../../shared/errors');

/**
 * Verification Service
 * Handles all business logic for document verification
 */
class VerificationService {
  /**
   * Create verification record for signed document
   * @param {string} documentId - Document ID
   * @param {string} verificationCode - Pre-generated code (optional)
   * @returns {Promise<Object>} - Verification record with QR code
   */
  async createVerification(documentId, verificationCode = null) {
    logger.info('Creating verification record', { documentId });

    try {
      // Check if verification already exists
      const existing = await verificationRepository.findByDocumentId(documentId);
      if (existing) {
        logger.warn('Verification already exists', { documentId });
        return this.getVerificationWithQRCode(existing);
      }

      // Get document
      const document = await documentRepository.findDocumentById(documentId);
      if (!document) {
        throw new NotFoundError('Document not found');
      }

      // Verify document is signed
      if (document.status !== 'SIGNED') {
        throw new ValidationError('Only signed documents can have verification');
      }

      // Generate verification code if not provided
      const code =
        verificationCode ||
        document.verificationCode ||
        VerificationUtils.generateVerificationCode(documentId);

      // Create verification record
      const verification = await verificationRepository.createVerification({
        documentId,
        verificationCode: code,
        verifiedCount: 0,
      });

      // Generate QR code
      const qrCode = await qrcodeService.generateQRCode(code);

      // Cache QR code
      await cacheService.cacheQRCode(code, qrCode);

      logger.info('Verification created successfully', {
        documentId,
        verificationCode: code,
      });

      return {
        ...verification,
        qrCode,
        verificationUrl: qrcodeService.buildVerificationUrl(code),
      };
    } catch (error) {
      logger.error('Failed to create verification', {
        documentId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Verify document by verification code (Public endpoint)
   * @param {string} verificationCode - Verification code
   * @param {Object} metadata - Request metadata (IP, user agent, etc.)
   * @returns {Promise<Object>} - Verification result
   */
  async verifyDocument(verificationCode, metadata = {}) {
    logger.info('Verifying document', { verificationCode });

    try {
      // Validate code format
      if (!VerificationUtils.isValidVerificationCode(verificationCode)) {
        throw new ValidationError('Invalid verification code format');
      }

      // Check rate limit
      const { allowed, remaining } = await cacheService.checkRateLimit(
        metadata.ipAddress || 'unknown',
        30, // 30 requests
        60  // per minute
      );

      if (!allowed) {
        logger.warn('Rate limit exceeded for verification', {
          ipAddress: metadata.ipAddress,
        });
        throw new ValidationError(
          'Too many verification attempts. Please try again later.'
        );
      }

      // Check cache first
      const cached = await cacheService.getCachedVerification(verificationCode);
      if (cached) {
        logger.debug('Verification cache hit', { verificationCode });
        // Still increment count even for cached results
        await verificationRepository.incrementVerificationCount(
          cached.id,
          metadata
        );
        return {
          ...cached,
          fromCache: true,
          rateLimit: { remaining },
        };
      }

      // Find verification record
      const verification =
        await verificationRepository.findByVerificationCode(verificationCode);

      if (!verification) {
        logger.warn('Verification not found', { verificationCode });
        throw new NotFoundError('Verification code not found or invalid');
      }

      // Check for suspicious activity
      const suspiciousCheck = VerificationUtils.checkSuspiciousActivity(
        verification,
        metadata
      );

      if (suspiciousCheck.suspicious) {
        logger.warn('Suspicious verification activity detected', {
          verificationCode,
          reasons: suspiciousCheck.reasons,
          metadata,
        });
      }

      // Increment verification count
      await verificationRepository.incrementVerificationCount(
        verification.id,
        metadata
      );

      // Format response
      const response = VerificationUtils.formatVerificationResponse(verification);

      // Sanitize for public display
      const sanitized = VerificationUtils.sanitizeForPublic(response);

      // Cache the result
      await cacheService.cacheVerification(verificationCode, sanitized, 1800); // 30 minutes

      logger.info('Document verified successfully', {
        verificationCode,
        documentId: verification.documentId,
      });

      return {
        ...sanitized,
        suspicious: suspiciousCheck.suspicious,
        suspiciousReasons: suspiciousCheck.reasons,
        rateLimit: { remaining },
      };
    } catch (error) {
      logger.error('Document verification failed', {
        verificationCode,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Get QR code for verification
   * @param {string} verificationCode - Verification code
   * @param {Object} options - QR code options
   * @returns {Promise<string>} - QR code data URL
   */
  async getQRCode(verificationCode, options = {}) {
    logger.info('Getting QR code', { verificationCode });

    try {
      // Check cache first
      const cached = await cacheService.getCachedQRCode(verificationCode);
      if (cached) {
        logger.debug('QR code cache hit', { verificationCode });
        return cached;
      }

      // Generate QR code
      const qrCode = await qrcodeService.generateQRCode(
        verificationCode,
        options
      );

      // Cache it
      await cacheService.cacheQRCode(verificationCode, qrCode);

      return qrCode;
    } catch (error) {
      logger.error('Failed to get QR code', {
        verificationCode,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Get QR code as buffer (for PDF embedding or download)
   * @param {string} verificationCode - Verification code
   * @param {Object} options - QR code options
   * @returns {Promise<Buffer>} - QR code buffer
   */
  async getQRCodeBuffer(verificationCode, options = {}) {
    logger.info('Getting QR code buffer', { verificationCode });

    try {
      return await qrcodeService.generateQRCodeBuffer(verificationCode, options);
    } catch (error) {
      logger.error('Failed to get QR code buffer', {
        verificationCode,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Regenerate QR code for document
   * @param {string} documentId - Document ID
   * @param {string} userId - User ID (for authorization)
   * @returns {Promise<Object>} - New verification with QR code
   */
  async regenerateQRCode(documentId, userId) {
    logger.info('Regenerating QR code', { documentId, userId });

    try {
      // Verify document ownership
      const document = await documentRepository.findDocumentById(
        documentId,
        userId
      );
      if (!document) {
        throw new NotFoundError('Document not found');
      }

      // Get existing verification
      const verification =
        await verificationRepository.findByDocumentId(documentId);
      if (!verification) {
        throw new NotFoundError('Verification not found for this document');
      }

      // Invalidate cache
      await cacheService.invalidateVerification(verification.verificationCode);
      await cacheService.delete(`qrcode:${verification.verificationCode}`);

      // Generate new QR code
      const qrCode = await qrcodeService.generateQRCode(
        verification.verificationCode
      );

      // Cache new QR code
      await cacheService.cacheQRCode(verification.verificationCode, qrCode);

      logger.info('QR code regenerated successfully', {
        documentId,
        verificationCode: verification.verificationCode,
      });

      return {
        ...verification,
        qrCode,
        verificationUrl: qrcodeService.buildVerificationUrl(
          verification.verificationCode
        ),
      };
    } catch (error) {
      logger.error('Failed to regenerate QR code', {
        documentId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Get verification statistics (Admin only)
   * @param {Object} filters - Date range filters
   * @returns {Promise<Object>} - Statistics
   */
  async getVerificationStatistics(filters = {}) {
    logger.info('Getting verification statistics', { filters });

    try {
      const stats = await verificationRepository.getVerificationStats(filters);
      const mostVerified =
        await verificationRepository.getMostVerifiedDocuments(10);

      return {
        ...stats,
        mostVerifiedDocuments: mostVerified,
      };
    } catch (error) {
      logger.error('Failed to get verification statistics', {
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Get verification details by document ID (Private)
   * @param {string} documentId - Document ID
   * @param {string} userId - User ID (for authorization)
   * @returns {Promise<Object>} - Verification details
   */
  async getVerificationByDocumentId(documentId, userId) {
    logger.info('Getting verification by document ID', { documentId, userId });

    try {
      // Verify document ownership
      const document = await documentRepository.findDocumentById(
        documentId,
        userId
      );
      if (!document) {
        throw new NotFoundError('Document not found');
      }

      const verification =
        await verificationRepository.findByDocumentId(documentId);
      if (!verification) {
        throw new NotFoundError('Verification not found for this document');
      }

      return await this.getVerificationWithQRCode(verification);
    } catch (error) {
      logger.error('Failed to get verification', {
        documentId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Helper: Get verification with QR code
   * @param {Object} verification - Verification record
   * @returns {Promise<Object>} - Verification with QR code
   */
  async getVerificationWithQRCode(verification) {
    const qrCode = await this.getQRCode(verification.verificationCode);
    return {
      ...verification,
      qrCode,
      verificationUrl: qrcodeService.buildVerificationUrl(
        verification.verificationCode
      ),
    };
  }

  /**
   * Invalidate verification cache
   * @param {string} verificationCode - Verification code
   */
  async invalidateCache(verificationCode) {
    logger.info('Invalidating verification cache', { verificationCode });

    try {
      await cacheService.invalidateVerification(verificationCode);
      await cacheService.delete(`qrcode:${verificationCode}`);
      return true;
    } catch (error) {
      logger.error('Failed to invalidate cache', {
        verificationCode,
        error: error.message,
      });
      return false;
    }
  }
}

module.exports = new VerificationService();
