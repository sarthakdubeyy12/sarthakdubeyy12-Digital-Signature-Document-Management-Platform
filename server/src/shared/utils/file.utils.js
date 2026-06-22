const crypto = require('crypto');
const path = require('path');

/**
 * File utility functions
 */
class FileUtils {
  /**
   * Generate unique filename
   * @param {string} originalName - Original filename
   * @returns {string} - Unique filename
   */
  static generateUniqueFilename(originalName) {
    const ext = path.extname(originalName);
    const timestamp = Date.now();
    const randomString = crypto.randomBytes(8).toString('hex');
    return `${timestamp}-${randomString}${ext}`;
  }

  /**
   * Generate verification code
   * @returns {string} - Unique verification code
   */
  static generateVerificationCode() {
    const timestamp = Date.now().toString(36);
    const randomPart = crypto.randomBytes(12).toString('hex');
    return `VER-${timestamp}-${randomPart}`.toUpperCase();
  }

  /**
   * Validate file extension
   * @param {string} filename - Filename to validate
   * @param {string[]} allowedExtensions - Allowed extensions
   * @returns {boolean} - Valid status
   */
  static validateFileExtension(filename, allowedExtensions = ['.pdf']) {
    const ext = path.extname(filename).toLowerCase();
    return allowedExtensions.includes(ext);
  }

  /**
   * Validate file size
   * @param {number} size - File size in bytes
   * @param {number} maxSize - Maximum size in bytes
   * @returns {boolean} - Valid status
   */
  static validateFileSize(size, maxSize = 10 * 1024 * 1024) {
    return size > 0 && size <= maxSize;
  }

  /**
   * Format file size for display
   * @param {number} bytes - File size in bytes
   * @returns {string} - Formatted size
   */
  static formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * Sanitize filename
   * Remove dangerous characters
   * @param {string} filename - Filename to sanitize
   * @returns {string} - Sanitized filename
   */
  static sanitizeFilename(filename) {
    return filename
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .replace(/_{2,}/g, '_')
      .substring(0, 255);
  }

  /**
   * Get file extension
   * @param {string} filename - Filename
   * @returns {string} - Extension without dot
   */
  static getFileExtension(filename) {
    return path.extname(filename).toLowerCase().substring(1);
  }

  /**
   * Get filename without extension
   * @param {string} filename - Filename
   * @returns {string} - Filename without extension
   */
  static getFilenameWithoutExtension(filename) {
    return path.basename(filename, path.extname(filename));
  }

  /**
   * Validate mime type
   * @param {string} mimeType - Mime type to validate
   * @param {string[]} allowedTypes - Allowed mime types
   * @returns {boolean} - Valid status
   */
  static validateMimeType(mimeType, allowedTypes = ['application/pdf']) {
    return allowedTypes.includes(mimeType);
  }
}

module.exports = FileUtils;
