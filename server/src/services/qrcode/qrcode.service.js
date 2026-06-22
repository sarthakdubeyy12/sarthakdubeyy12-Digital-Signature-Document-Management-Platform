const QRCode = require('qrcode');
const logger = require('../logger/logger.service');
const config = require('../../config');

/**
 * QR Code Service
 * Handles QR code generation for document verification
 */
class QRCodeService {
  /**
   * Generate QR code for verification URL
   * @param {string} verificationCode - Verification code
   * @param {Object} options - QR code options
   * @returns {Promise<string>} - Base64 QR code image
   */
  async generateQRCode(verificationCode, options = {}) {
    try {
      const verificationUrl = this.buildVerificationUrl(verificationCode);

      const qrOptions = {
        errorCorrectionLevel: 'H', // High error correction (30%)
        type: 'image/png',
        quality: 0.95,
        margin: 2,
        width: options.width || 300,
        color: {
          dark: options.darkColor || '#000000',
          light: options.lightColor || '#FFFFFF',
        },
        ...options,
      };

      // Generate QR code as base64 data URL
      const qrCodeDataUrl = await QRCode.toDataURL(verificationUrl, qrOptions);

      logger.info('QR code generated successfully', {
        verificationCode,
        size: qrOptions.width,
      });

      return qrCodeDataUrl;
    } catch (error) {
      logger.error('Failed to generate QR code', {
        verificationCode,
        error: error.message,
      });
      throw new Error('QR code generation failed');
    }
  }

  /**
   * Generate QR code as buffer (for PDF embedding)
   * @param {string} verificationCode - Verification code
   * @param {Object} options - QR code options
   * @returns {Promise<Buffer>} - QR code image buffer
   */
  async generateQRCodeBuffer(verificationCode, options = {}) {
    try {
      const verificationUrl = this.buildVerificationUrl(verificationCode);

      const qrOptions = {
        errorCorrectionLevel: 'H',
        type: 'png',
        quality: 0.95,
        margin: 2,
        width: options.width || 300,
        ...options,
      };

      // Generate QR code as buffer
      const buffer = await QRCode.toBuffer(verificationUrl, qrOptions);

      logger.info('QR code buffer generated successfully', {
        verificationCode,
        bufferSize: buffer.length,
      });

      return buffer;
    } catch (error) {
      logger.error('Failed to generate QR code buffer', {
        verificationCode,
        error: error.message,
      });
      throw new Error('QR code buffer generation failed');
    }
  }

  /**
   * Generate QR code as SVG
   * @param {string} verificationCode - Verification code
   * @param {Object} options - QR code options
   * @returns {Promise<string>} - SVG string
   */
  async generateQRCodeSVG(verificationCode, options = {}) {
    try {
      const verificationUrl = this.buildVerificationUrl(verificationCode);

      const qrOptions = {
        errorCorrectionLevel: 'H',
        type: 'svg',
        margin: 2,
        width: options.width || 300,
        ...options,
      };

      const svg = await QRCode.toString(verificationUrl, qrOptions);

      logger.info('QR code SVG generated successfully', {
        verificationCode,
      });

      return svg;
    } catch (error) {
      logger.error('Failed to generate QR code SVG', {
        verificationCode,
        error: error.message,
      });
      throw new Error('QR code SVG generation failed');
    }
  }

  /**
   * Build verification URL from code
   * @param {string} verificationCode - Verification code
   * @returns {string} - Full verification URL
   */
  buildVerificationUrl(verificationCode) {
    const baseUrl = config.app.frontendUrl || 'http://localhost:3000';
    return `${baseUrl}/verify/${verificationCode}`;
  }

  /**
   * Validate QR code format
   * @param {string} qrCodeData - QR code data
   * @returns {boolean} - Valid status
   */
  isValidQRCodeFormat(qrCodeData) {
    if (!qrCodeData) return false;

    // Check if it's a data URL
    if (qrCodeData.startsWith('data:image/png;base64,')) {
      return true;
    }

    // Check if it's SVG
    if (qrCodeData.includes('<svg')) {
      return true;
    }

    return false;
  }

  /**
   * Extract verification code from URL
   * @param {string} url - Verification URL
   * @returns {string|null} - Verification code or null
   */
  extractVerificationCode(url) {
    try {
      const match = url.match(/\/verify\/([A-Z0-9-]+)$/);
      return match ? match[1] : null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Generate multiple QR codes in batch
   * @param {Array<string>} verificationCodes - Array of codes
   * @param {Object} options - QR code options
   * @returns {Promise<Array<Object>>} - Array of {code, qrCode}
   */
  async generateBatchQRCodes(verificationCodes, options = {}) {
    try {
      const promises = verificationCodes.map(async (code) => {
        const qrCode = await this.generateQRCode(code, options);
        return { code, qrCode };
      });

      const results = await Promise.all(promises);

      logger.info('Batch QR codes generated', {
        count: results.length,
      });

      return results;
    } catch (error) {
      logger.error('Failed to generate batch QR codes', {
        error: error.message,
      });
      throw error;
    }
  }
}

module.exports = new QRCodeService();
