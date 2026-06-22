const pdfService = require('./pdf.service');
const storageService = require('../storage/local.storage');
const logger = require('../logger/logger.service');
const ImageUtils = require('../../shared/utils/image.utils');
const { ValidationError, StorageError } = require('../../shared/errors');

/**
 * Signature Placer Service
 * Handles the complete signature placement workflow
 */
class SignaturePlacerService {
  /**
   * Apply signature to PDF document
   * @param {string} documentPath - Path to original PDF
   * @param {string} signatureData - Base64 signature or path
   * @param {Object} position - Signature position
   * @returns {Promise<Buffer>} - Signed PDF buffer
   */
  async applySignatureToPDF(documentPath, signatureData, position) {
    try {
      logger.info('Starting signature placement', {
        documentPath,
        position,
      });

      // 1. Load original PDF
      const originalPdfBuffer = await storageService.getFile(documentPath);
      const pdfDoc = await pdfService.loadPDF(originalPdfBuffer);

      // 2. Validate page number
      const pageCount = pdfDoc.getPageCount();
      if (position.page >= pageCount || position.page < 0) {
        throw new ValidationError(
          `Invalid page number. Document has ${pageCount} pages`
        );
      }

      // 3. Prepare signature image
      const { imageBuffer, imageType } = this.prepareSignatureImage(signatureData);

      // 4. Embed signature image in PDF
      const image = await pdfService.embedImage(pdfDoc, imageBuffer, imageType);

      // 5. Place signature on specified page and position
      await pdfService.addSignatureToPage(pdfDoc, image, position);

      // 6. Add metadata
      pdfService.addMetadata(pdfDoc, {
        title: 'Signed Document',
        creator: 'Digital Signature Platform',
        producer: 'Digital Signature Platform v1.0',
        subject: 'Electronically Signed Document',
      });

      // 7. Save and return signed PDF
      const signedPdfBuffer = await pdfService.savePDF(pdfDoc);

      logger.info('Signature placement completed successfully', {
        signedSize: signedPdfBuffer.length,
      });

      return signedPdfBuffer;
    } catch (error) {
      logger.error('Signature placement failed', {
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Prepare signature image from base64 or file path
   * @param {string} signatureData - Base64 data or file path
   * @returns {Object} - Image buffer and type
   */
  prepareSignatureImage(signatureData) {
    try {
      let imageBuffer;
      let imageType;

      // Check if it's base64 data
      if (signatureData.startsWith('data:image/')) {
        // Validate base64 image
        if (!ImageUtils.validateBase64Image(signatureData)) {
          throw new ValidationError('Invalid signature image format');
        }

        // Validate size (2MB max)
        if (!ImageUtils.validateSignatureSize(signatureData)) {
          throw new ValidationError('Signature image size exceeds 2MB');
        }

        // Extract image format and buffer
        imageType = ImageUtils.getImageFormat(signatureData);
        imageBuffer = ImageUtils.base64ToBuffer(signatureData);
      } else {
        // Assume it's a file path (for uploaded signatures)
        throw new ValidationError('File path signatures not yet implemented');
      }

      return { imageBuffer, imageType };
    } catch (error) {
      logger.error('Failed to prepare signature image', {
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Validate signature position
   * @param {Buffer} pdfBuffer - PDF buffer
   * @param {Object} position - Signature position
   * @returns {Promise<boolean>} - Valid status
   */
  async validatePosition(pdfBuffer, position) {
    try {
      const pdfDoc = await pdfService.loadPDF(pdfBuffer);
      const pageCount = pdfDoc.getPageCount();

      // Check page number
      if (position.page >= pageCount || position.page < 0) {
        throw new ValidationError(
          `Page ${position.page} does not exist. Document has ${pageCount} pages.`
        );
      }

      // Get page dimensions
      const page = pdfDoc.getPage(position.page);
      const { width: pageWidth, height: pageHeight } = page.getSize();

      // Check if signature fits within page boundaries
      if (
        position.x < 0 ||
        position.y < 0 ||
        position.x + position.width > pageWidth ||
        position.y + position.height > pageHeight
      ) {
        throw new ValidationError(
          `Signature position exceeds page boundaries. Page size: ${pageWidth}x${pageHeight}`
        );
      }

      return true;
    } catch (error) {
      logger.error('Position validation failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Calculate optimal signature size
   * @param {number} pageWidth - PDF page width
   * @param {number} pageHeight - PDF page height
   * @returns {Object} - Recommended width and height
   */
  calculateOptimalSize(pageWidth, pageHeight) {
    // Signature should be roughly 15% of page width
    const width = Math.floor(pageWidth * 0.15);
    // Maintain aspect ratio (typical signature is 3:1)
    const height = Math.floor(width / 3);

    return { width, height };
  }

  /**
   * Get available signature positions (predefined spots)
   * @param {number} pageWidth - Page width
   * @param {number} pageHeight - Page height
   * @returns {Array} - Array of position objects
   */
  getPresetPositions(pageWidth, pageHeight) {
    const { width, height } = this.calculateOptimalSize(pageWidth, pageHeight);
    const margin = 50;

    return [
      {
        name: 'Bottom Left',
        x: margin,
        y: pageHeight - height - margin,
        width,
        height,
      },
      {
        name: 'Bottom Center',
        x: (pageWidth - width) / 2,
        y: pageHeight - height - margin,
        width,
        height,
      },
      {
        name: 'Bottom Right',
        x: pageWidth - width - margin,
        y: pageHeight - height - margin,
        width,
        height,
      },
    ];
  }
}

module.exports = new SignaturePlacerService();
