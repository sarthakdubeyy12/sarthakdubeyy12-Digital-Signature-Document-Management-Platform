const { PDFDocument } = require('pdf-lib');
const logger = require('../logger/logger.service');
const { StorageError } = require('../../shared/errors');

/**
 * PDF Service
 * Handles PDF operations using pdf-lib
 */
class PDFService {
  /**
   * Load PDF from buffer
   * @param {Buffer} pdfBuffer - PDF file buffer
   * @returns {Promise<PDFDocument>} - Loaded PDF document
   */
  async loadPDF(pdfBuffer) {
    try {
      const pdfDoc = await PDFDocument.load(pdfBuffer);
      logger.info('PDF loaded successfully', {
        pageCount: pdfDoc.getPageCount(),
      });
      return pdfDoc;
    } catch (error) {
      logger.error('Failed to load PDF', { error: error.message });
      throw new StorageError('Failed to load PDF document');
    }
  }

  /**
   * Get PDF metadata
   * @param {Buffer} pdfBuffer - PDF file buffer
   * @returns {Promise<Object>} - PDF metadata
   */
  async getPDFMetadata(pdfBuffer) {
    try {
      const pdfDoc = await this.loadPDF(pdfBuffer);
      const pageCount = pdfDoc.getPageCount();
      const firstPage = pdfDoc.getPage(0);
      const { width, height } = firstPage.getSize();

      return {
        pageCount,
        width,
        height,
        title: pdfDoc.getTitle() || null,
        author: pdfDoc.getAuthor() || null,
        creator: pdfDoc.getCreator() || null,
      };
    } catch (error) {
      logger.error('Failed to get PDF metadata', { error: error.message });
      throw new StorageError('Failed to extract PDF metadata');
    }
  }

  /**
   * Embed image in PDF
   * @param {PDFDocument} pdfDoc - PDF document
   * @param {Buffer} imageBuffer - Image buffer
   * @param {string} imageType - Image type (png or jpg)
   * @returns {Promise<Object>} - Embedded image
   */
  async embedImage(pdfDoc, imageBuffer, imageType) {
    try {
      let image;
      if (imageType === 'png') {
        image = await pdfDoc.embedPng(imageBuffer);
      } else if (imageType === 'jpg' || imageType === 'jpeg') {
        image = await pdfDoc.embedJpg(imageBuffer);
      } else {
        throw new Error(`Unsupported image type: ${imageType}`);
      }

      logger.info('Image embedded in PDF', { imageType });
      return image;
    } catch (error) {
      logger.error('Failed to embed image in PDF', {
        error: error.message,
        imageType,
      });
      throw new StorageError('Failed to embed signature image in PDF');
    }
  }

  /**
   * Add signature to PDF page
   * @param {PDFDocument} pdfDoc - PDF document
   * @param {Object} image - Embedded image
   * @param {Object} position - Signature position
   * @returns {Promise<void>}
   */
  async addSignatureToPage(pdfDoc, image, position) {
    try {
      const { page: pageIndex, x, y, width, height } = position;

      // Get the page
      const page = pdfDoc.getPage(pageIndex);
      const pageHeight = page.getSize().height;

      // PDF coordinates start from bottom-left, adjust Y coordinate
      const adjustedY = pageHeight - y - height;

      // Draw image on page
      page.drawImage(image, {
        x,
        y: adjustedY,
        width,
        height,
      });

      logger.info('Signature added to PDF page', {
        page: pageIndex,
        x,
        y: adjustedY,
        width,
        height,
      });
    } catch (error) {
      logger.error('Failed to add signature to PDF page', {
        error: error.message,
      });
      throw new StorageError('Failed to place signature on PDF');
    }
  }

  /**
   * Save PDF to buffer
   * @param {PDFDocument} pdfDoc - PDF document
   * @returns {Promise<Buffer>} - PDF buffer
   */
  async savePDF(pdfDoc) {
    try {
      const pdfBytes = await pdfDoc.save();
      const buffer = Buffer.from(pdfBytes);
      
      logger.info('PDF saved to buffer', { size: buffer.length });
      return buffer;
    } catch (error) {
      logger.error('Failed to save PDF', { error: error.message });
      throw new StorageError('Failed to save signed PDF');
    }
  }

  /**
   * Add metadata to PDF
   * @param {PDFDocument} pdfDoc - PDF document
   * @param {Object} metadata - Metadata to add
   */
  addMetadata(pdfDoc, metadata) {
    try {
      if (metadata.title) pdfDoc.setTitle(metadata.title);
      if (metadata.author) pdfDoc.setAuthor(metadata.author);
      if (metadata.subject) pdfDoc.setSubject(metadata.subject);
      if (metadata.creator) pdfDoc.setCreator(metadata.creator);
      if (metadata.producer) pdfDoc.setProducer(metadata.producer);
      
      // Add creation date
      pdfDoc.setCreationDate(new Date());
      pdfDoc.setModificationDate(new Date());

      logger.info('Metadata added to PDF');
    } catch (error) {
      logger.error('Failed to add metadata to PDF', { error: error.message });
      // Non-critical, don't throw
    }
  }

  /**
   * Validate PDF buffer
   * @param {Buffer} pdfBuffer - PDF buffer
   * @returns {Promise<boolean>} - Valid status
   */
  async validatePDF(pdfBuffer) {
    try {
      await this.loadPDF(pdfBuffer);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get page count
   * @param {Buffer} pdfBuffer - PDF buffer
   * @returns {Promise<number>} - Number of pages
   */
  async getPageCount(pdfBuffer) {
    try {
      const pdfDoc = await this.loadPDF(pdfBuffer);
      return pdfDoc.getPageCount();
    } catch (error) {
      logger.error('Failed to get page count', { error: error.message });
      throw new StorageError('Failed to read PDF pages');
    }
  }
}

module.exports = new PDFService();
