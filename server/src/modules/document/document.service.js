const documentRepository = require('./document.repository');
const storageService = require('../../services/storage/local.storage');
const logger = require('../../services/logger/logger.service');
const FileUtils = require('../../shared/utils/file.utils');
const {
  NotFoundError,
  ValidationError,
  ForbiddenError,
  StorageError,
} = require('../../shared/errors');

/**
 * Document Service
 * Handles all business logic for document operations
 */
class DocumentService {
  /**
   * Upload a new document
   */
  async uploadDocument(userId, file, metadata) {
    logger.info('Document upload initiated', {
      userId,
      originalName: file.originalname,
      size: file.size,
    });

    try {
      // Validate file
      this.validateFile(file);

      // Generate unique filename and verification code
      const uniqueFilename = FileUtils.generateUniqueFilename(file.originalname);
      const verificationCode = FileUtils.generateVerificationCode();

      // Save file to storage
      const filePath = await storageService.saveFile(
        file.buffer,
        uniqueFilename,
        'documents/original'
      );

      // Create document record
      const document = await documentRepository.createDocument({
        userId,
        title: metadata.title || file.originalname,
        originalName: file.originalname,
        fileName: uniqueFilename,
        filePath,
        fileSize: file.size,
        mimeType: file.mimetype,
        verificationCode,
        status: 'UPLOADED',
        metadata: {
          description: metadata.description || null,
        },
      });

      logger.info('Document uploaded successfully', {
        documentId: document.id,
        userId,
        verificationCode,
      });

      // Remove sensitive data
      return this.sanitizeDocument(document);
    } catch (error) {
      logger.error('Document upload failed', {
        userId,
        error: error.message,
        stack: error.stack,
      });

      // Clean up file if storage succeeded but DB failed
      if (error.name !== 'StorageError') {
        // Attempt to clean up
        try {
          const uniqueFilename = FileUtils.generateUniqueFilename(file.originalname);
          await storageService.deleteFile(`documents/original/${uniqueFilename}`);
        } catch (cleanupError) {
          logger.error('Failed to clean up file after error', {
            error: cleanupError.message,
          });
        }
      }

      throw error;
    }
  }

  /**
   * Get document by ID
   */
  async getDocumentById(documentId, userId, isAdmin = false) {
    logger.info('Fetching document', { documentId, userId });

    const document = await documentRepository.findDocumentById(
      documentId,
      isAdmin ? null : userId
    );

    if (!document) {
      throw new NotFoundError('Document not found');
    }

    // Non-admin users can only access their own documents
    if (!isAdmin && document.userId !== userId) {
      throw new ForbiddenError('Access denied to this document');
    }

    return this.sanitizeDocument(document);
  }

  /**
   * List user documents
   */
  async listUserDocuments(userId, filters) {
    logger.info('Listing documents', { userId, filters });

    const result = await documentRepository.listDocuments(userId, filters);

    return {
      documents: result.documents.map((doc) => this.sanitizeDocument(doc)),
      pagination: result.pagination,
    };
  }

  /**
   * Update document metadata
   */
  async updateDocument(documentId, userId, updates) {
    logger.info('Updating document', { documentId, userId, updates });

    // Check if document exists and user owns it
    const existingDocument = await documentRepository.findDocumentById(
      documentId,
      userId
    );

    if (!existingDocument) {
      throw new NotFoundError('Document not found');
    }

    // Only allow updating certain fields
    const allowedUpdates = {};
    if (updates.title) allowedUpdates.title = updates.title;
    if (updates.description !== undefined) {
      allowedUpdates.metadata = {
        ...existingDocument.metadata,
        description: updates.description,
      };
    }

    const document = await documentRepository.updateDocument(
      documentId,
      userId,
      allowedUpdates
    );

    logger.info('Document updated successfully', { documentId });

    return this.sanitizeDocument(document);
  }

  /**
   * Delete document
   */
  async deleteDocument(documentId, userId, isAdmin = false) {
    logger.info('Deleting document', { documentId, userId });

    // Check if document exists
    const document = await documentRepository.findDocumentById(
      documentId,
      isAdmin ? null : userId
    );

    if (!document) {
      throw new NotFoundError('Document not found');
    }

    // Non-admin users can only delete their own documents
    if (!isAdmin && document.userId !== userId) {
      throw new ForbiddenError('Access denied to delete this document');
    }

    // Soft delete document
    await documentRepository.deleteDocument(documentId, userId);

    // Delete physical files (async, don't wait)
    this.deletePhysicalFiles(document).catch((error) => {
      logger.error('Failed to delete physical files', {
        documentId,
        error: error.message,
      });
    });

    logger.info('Document deleted successfully', { documentId });

    return { message: 'Document deleted successfully' };
  }

  /**
   * Download document
   */
  async downloadDocument(documentId, userId, version = 'original', isAdmin = false) {
    logger.info('Document download requested', {
      documentId,
      userId,
      version,
    });

    // Get document
    const document = await documentRepository.findDocumentById(
      documentId,
      isAdmin ? null : userId
    );

    if (!document) {
      throw new NotFoundError('Document not found');
    }

    // Non-admin users can only download their own documents
    if (!isAdmin && document.userId !== userId) {
      throw new ForbiddenError('Access denied to download this document');
    }

    // Determine which file to download
    let filePath;
    let filename;

    if (version === 'signed' && document.status === 'SIGNED') {
      if (!document.signedFilePath) {
        throw new ValidationError('Signed version not available');
      }
      filePath = document.signedFilePath;
      filename = `signed_${document.originalName}`;
    } else {
      filePath = document.filePath;
      filename = document.originalName;
    }

    // Get file from storage
    const fileBuffer = await storageService.getFile(filePath);

    logger.info('Document downloaded successfully', { documentId, version });

    return {
      buffer: fileBuffer,
      filename,
      mimeType: document.mimeType,
      size: fileBuffer.length,
    };
  }

  /**
   * Get document statistics for user
   */
  async getUserStats(userId) {
    logger.info('Fetching user document stats', { userId });

    const stats = await documentRepository.getUserDocumentStats(userId);

    return stats;
  }

  /**
   * Validate uploaded file
   */
  validateFile(file) {
    if (!file) {
      throw new ValidationError('No file provided');
    }

    // Validate file type
    if (!FileUtils.validateMimeType(file.mimetype, ['application/pdf'])) {
      throw new ValidationError('Only PDF files are allowed');
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024;
    if (!FileUtils.validateFileSize(file.size, maxSize)) {
      throw new ValidationError(
        `File size must not exceed ${FileUtils.formatFileSize(maxSize)}`
      );
    }

    // Validate file extension
    if (!FileUtils.validateFileExtension(file.originalname, ['.pdf'])) {
      throw new ValidationError('File must have .pdf extension');
    }

    return true;
  }

  /**
   * Delete physical files
   */
  async deletePhysicalFiles(document) {
    const filesToDelete = [document.filePath];

    if (document.signedFilePath) {
      filesToDelete.push(document.signedFilePath);
    }

    for (const filePath of filesToDelete) {
      try {
        await storageService.deleteFile(filePath);
        logger.info('Physical file deleted', { filePath });
      } catch (error) {
        logger.error('Failed to delete physical file', {
          filePath,
          error: error.message,
        });
      }
    }
  }

  /**
   * Sanitize document data
   * Remove sensitive information
   */
  sanitizeDocument(document) {
    if (!document) return null;

    const sanitized = { ...document };

    // Remove internal paths, keep only metadata
    delete sanitized.filePath;
    delete sanitized.signedFilePath;

    // Add computed fields
    sanitized.fileSize = FileUtils.formatFileSize(document.fileSize);

    return sanitized;
  }
}

module.exports = new DocumentService();
