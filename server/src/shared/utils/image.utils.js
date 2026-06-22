/**
 * Image utility functions
 */
class ImageUtils {
  /**
   * Validate base64 image data
   * @param {string} base64Data - Base64 encoded image
   * @returns {boolean} - Valid status
   */
  static validateBase64Image(base64Data) {
    if (!base64Data) return false;
    
    // Check if it starts with data:image/
    const base64Pattern = /^data:image\/(png|jpeg|jpg|gif|webp);base64,/;
    return base64Pattern.test(base64Data);
  }

  /**
   * Extract image format from base64 data
   * @param {string} base64Data - Base64 encoded image
   * @returns {string|null} - Image format (png, jpeg, etc.)
   */
  static getImageFormat(base64Data) {
    const match = base64Data.match(/^data:image\/([a-zA-Z]+);base64,/);
    return match ? match[1] : null;
  }

  /**
   * Convert base64 to buffer
   * @param {string} base64Data - Base64 encoded image
   * @returns {Buffer} - Image buffer
   */
  static base64ToBuffer(base64Data) {
    // Remove data:image/...;base64, prefix
    const base64String = base64Data.replace(/^data:image\/[a-z]+;base64,/, '');
    return Buffer.from(base64String, 'base64');
  }

  /**
   * Get base64 data size in bytes
   * @param {string} base64Data - Base64 encoded data
   * @returns {number} - Size in bytes
   */
  static getBase64Size(base64Data) {
    const buffer = this.base64ToBuffer(base64Data);
    return buffer.length;
  }

  /**
   * Validate image dimensions
   * @param {number} width - Image width
   * @param {number} height - Image height
   * @param {number} maxWidth - Maximum width
   * @param {number} maxHeight - Maximum height
   * @returns {boolean} - Valid status
   */
  static validateDimensions(width, height, maxWidth = 1000, maxHeight = 1000) {
    return width > 0 && height > 0 && width <= maxWidth && height <= maxHeight;
  }

  /**
   * Calculate aspect ratio
   * @param {number} width - Image width
   * @param {number} height - Image height
   * @returns {number} - Aspect ratio
   */
  static calculateAspectRatio(width, height) {
    return width / height;
  }

  /**
   * Validate signature image size
   * @param {string} base64Data - Base64 encoded image
   * @param {number} maxSize - Maximum size in bytes (default 2MB)
   * @returns {boolean} - Valid status
   */
  static validateSignatureSize(base64Data, maxSize = 2 * 1024 * 1024) {
    const size = this.getBase64Size(base64Data);
    return size > 0 && size <= maxSize;
  }
}

module.exports = ImageUtils;
