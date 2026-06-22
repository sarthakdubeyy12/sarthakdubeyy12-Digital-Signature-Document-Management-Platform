const signatureRepository = require('./signature.repository');
const documentRepository = require('../document/document.repository');
const storageService = require('../../services/storage/local.storage');
const signaturePlacerService = require('../../services/pdf/signature-placer');
const logger = require('../../services/logger/logger.service');
const FileUtils = require('../../shared/utils/file.utils');
const ImageUtils = require('../../shared/utils/image.utils');
const {
  NotFoundError,
  ValidationError,
  ForbiddenError,
} = require('../../shared/errors');

/**
 * Signature Service
 * Handles all business logic for signature operations
 */
class SignatureService {
  /**
   * Create a new signature
   */
  async createSignature(userId, data, file = null) {
    logger.info('Creating signature', { userId, name: data.name });

    try {
      let signatureData;

      // Handle uploaded file
      if (file) {
        this.validateSignatureFile(file);
        
        // Save signature image to storage
        const uniqueFilename = FileUtils.generateUniqueFilename(file.originalname);
        const filePath = await storageService.saveFile(
          file.buffer,
          uniqueFilename,
          'signatures'
        );
        
        signatureData = filePath;
      }
      // Handle base64 drawn signature
      else if (data.signatureData) {
        this.validateBase64Signature(data.signatureData);
        signatureData = data.signatureData;
      } else {
        throw new ValidationError('Either signature file or data is required');
      }

      // Create signature record
      const signature = await signatureRepository.createSignature({
        userId,
        name: data.name,
        signatureData,
        isReusable: data.isReusable !== false,
      });

      logger.info('Signature created successfully', {
        signatureId: signature.id,
        userId,
      });

      return this.sanitizeSignature(signature);
    } catch (error) {
      logger.error('Failed to create signature', {
        userId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Apply signature to document
   */
  async applySignatureToDocument(userId, documentId, signatureId, position) {
    logger.info('Applying signature to document', {
      userId,
      documentId,
      signatureId,
      position,
    });

    try {
      // 1. Get and validate document
      const document = await documentRepository.findDocumentById(documentId, userId);
      if (!document) {
        throw new NotFoundError('Document not found');
      }

      if (document.status === 'SIGNED') {
        throw new ValidationError('Document is already signed');
      }

      // 2. Get and validate signature
      const signature = await signatureRepository.findSignatureById(
        signatureId,
        userId
      );
      if (!signature) {
        throw new NotFoundError('Signature not found');
      }

      // 3. Validate position
      const originalPdfBuffer = await storageService.getFile(document.filePath);
      await signaturePlacerService.validatePosition(originalPdfBuffer, position);

      // 4. Apply signature to PDF
      const signedPdfBuffer = await signaturePlacerService.applySignatureToPDF(
        document.filePath,
        signature.signatureData,
        position
      );

      // 5. Save signed PDF
      const signedFilename = `signed_${document.fileName}`;
      const signedFilePath = await storageService.saveFile(
        signedPdfBuffer,
        signedFilename,
        'documents/signed'
      );

      // 6. Update document status
      const updatedDocument = await documentRepository.updateDocumentStatus(
        documentId,
        'SIGNED',
        {
          signedFilePath,
          signedAt: new Date(),
        }
      );

      // 7. Link signature to document
      const updatedSignature = await signatureRepository.linkSignatureToDocument(
        signatureId,
        documentId,
        position
      );

      // 8. Create verification record
      await this.createVerificationRecord(documentId);

      logger.info('Signature applied successfully', {
        documentId,
        signatureId,
      });

      return {
        document: updatedDocument,
        signature: updatedSignature,
        signedFilePath,
      };
    } catch (error) {
      logger.error('Failed to apply signature', {
        documentId,
        signatureId,
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Get signature by ID
   */
  async getSignatureById(signatureId, userId, isAdmin = false) {
    logger.info('Fetching signature', { signatureId, userId });

    const signature = await signatureRepository.findSignatureById(
      signatureId,
      isAdmin ? null : userId
    );

    if (!signature) {
      throw new NotFoundError('Signature not found');
    }

    if (!isAdmin && signature.userId !== userId) {
      throw new ForbiddenError('Access denied to this signature');
    }

    return this.sanitizeSignature(signature);
  }

  /**
   * List user signatures
   */
  async listUserSignatures(userId, filters) {
    logger.info('Listing signatures', { userId, filters });

    const result = await signatureRepository.listSignatures(userId, filters);

    return {
      signatures: result.signatures.map((sig) => this.sanitizeSignature(sig)),
      pagination: result.pagination,
    };
  }

  /**
   * Update signature
   */
  async updateSignature(signatureId, userId, updates) {
    logger.info('Updating signature', { signatureId, userId });

    const existingSignature = await signatureRepository.findSignatureById(
      signatureId,
      userId
    );

    if (!existingSignature) {
      throw new NotFoundError('Signature not found');
    }

    // Don't allow updating if signature is already applied to a document
    if (existingSignature.documentId) {
      throw new ValidationError('Cannot update signature that has been applied');
    }

    const signature = await signatureRepository.updateSignature(
      signatureId,
      userId,
      updates
    );

    logger.info('Signature updated successfully', { signatureId });

    return this.sanitizeSignature(signature);
  }

  /**
   * Delete signature
   */
  async deleteSignature(signatureId, userId, isAdmin = false) {
    logger.info('Deleting signature', { signatureId, userId });

    const signature = await signatureRepository.findSignatureById(
      signatureId,
      isAdmin ? null : userId
    );

    if (!signature) {
      throw new NotFoundError('Signature not found');
    }

    if (!isAdmin && signature.userId !== userId) {
      throw new ForbiddenError('Access denied to delete this signature');
    }

    // Don't allow deleting if signature is applied to a document
    if (signature.documentId) {
      throw new ValidationError(
        'Cannot delete signature that has been applied to a document'
      );
    }

    await signatureRepository.deleteSignature(signatureId, userId);

    // Delete physical file if it's a file path (not base64)
    if (
      signature.signatureData &&
      !signature.signatureData.startsWith('data:image/')
    ) {
      this.deletePhysicalFile(signature.signatureData).catch((error) => {
        logger.error('Failed to delete signature file', {
          signatureId,
          error: error.message,
        });
      });
    }

    logger.info('Signature deleted successfully', { signatureId });

    return { message: 'Signature deleted successfully' };
  }

  /**
   * Get reusable signatures for user
   */
  async getReusableSignatures(userId) {
    logger.info('Fetching reusable signatures', { userId });

    const signatures = await signatureRepository.findReusableSignatures(userId);

    return signatures.map((sig) => this.sanitizeSignature(sig));
  }

  /**
   * Validate signature file
   */
  validateSignatureFile(file) {
    if (!file) {
      throw new ValidationError('No signature file provided');
    }

    // Validate file type (images only)
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg'];
    if (!allowedTypes.includes(file.mimetype)) {
      throw new ValidationError('Only PNG and JPEG images are allowed');
    }

    // Validate file size (2MB max)
    const maxSize = 2 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new ValidationError('Signature image must not exceed 2MB');
    }

    return true;
  }

  /**
   * Validate base64 signature
   */
  validateBase64Signature(base64Data) {
    if (!ImageUtils.validateBase64Image(base64Data)) {
      throw new ValidationError('Invalid signature image format');
    }

    if (!ImageUtils.validateSignatureSize(base64Data)) {
      throw new ValidationError('Signature image size exceeds 2MB');
    }

    return true;
  }

  /**
   * Create verification record for signed document
   */
  async createVerificationRecord(documentId) {
    try {
      const prisma = require('../../database/prisma.client');
      const document = await documentRepository.findDocumentById(documentId);

      await prisma.verification.create({
        data: {
          documentId,
          verificationCode: document.verificationCode,
          verifiedCount: 0,
        },
      });

      logger.info('Verification record created', { documentId });
    } catch (error) {
      // If verification record already exists, ignore error
      logger.warn('Verification record creation skipped', {
        documentId,
        error: error.message,
      });
    }
  }

  /**
   * Delete physical signature file
   */
  async deletePhysicalFile(filePath) {
    try {
      await storageService.deleteFile(filePath);
      logger.info('Physical signature file deleted', { filePath });
    } catch (error) {
      logger.error('Failed to delete physical signature file', {
        filePath,
        error: error.message,
      });
    }
  }

  /**
   * Sanitize signature data
   */
  sanitizeSignature(signature) {
    if (!signature) return null;

    const sanitized = { ...signature };

    // Don't expose full base64 data in list responses
    if (
      sanitized.signatureData &&
      sanitized.signatureData.startsWith('data:image/')
    ) {
      sanitized.signatureData = 'base64-image';
      sanitized.type = 'drawn';
    } else {
      sanitized.type = 'uploaded';
    }

    return sanitized;
  }
}

module.exports = new SignatureService();
