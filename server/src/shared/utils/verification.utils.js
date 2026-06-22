const crypto = require('crypto');

/**
 * Verification Utilities
 * Helper functions for document verification
 */
class VerificationUtils {
  /**
   * Generate unique verification code
   * Format: VER-{RANDOM8}-{HASH24}
   * @param {string} documentId - Document ID
   * @returns {string} - Verification code
   */
  static generateVerificationCode(documentId) {
    // Generate random 8-character alphanumeric
    const random = crypto
      .randomBytes(6)
      .toString('base64')
      .replace(/[^A-Z0-9]/gi, '')
      .substring(0, 8)
      .toUpperCase();

    // Generate hash from document ID + timestamp
    const data = `${documentId}-${Date.now()}-${Math.random()}`;
    const hash = crypto
      .createHash('sha256')
      .update(data)
      .digest('hex')
      .substring(0, 24)
      .toUpperCase();

    return `VER-${random}-${hash}`;
  }

  /**
   * Validate verification code format
   * @param {string} code - Verification code
   * @returns {boolean} - Valid status
   */
  static isValidVerificationCode(code) {
    if (!code || typeof code !== 'string') return false;

    // Format: VER-{8 chars}-{24 hex chars}
    const regex = /^VER-[A-Z0-9]{8}-[A-F0-9]{24}$/;
    return regex.test(code);
  }

  /**
   * Extract components from verification code
   * @param {string} code - Verification code
   * @returns {Object} - {prefix, random, hash}
   */
  static parseVerificationCode(code) {
    if (!this.isValidVerificationCode(code)) {
      return null;
    }

    const parts = code.split('-');
    return {
      prefix: parts[0], // VER
      random: parts[1], // Random 8 chars
      hash: parts[2], // Hash 24 chars
      full: code,
    };
  }

  /**
   * Generate verification hash for tamper detection
   * @param {Object} data - Document data
   * @returns {string} - SHA256 hash
   */
  static generateVerificationHash(data) {
    const { documentId, userId, fileName, fileSize, signedAt } = data;

    const hashData = [
      documentId,
      userId,
      fileName,
      fileSize,
      signedAt?.toISOString() || '',
    ].join('|');

    return crypto.createHash('sha256').update(hashData).digest('hex');
  }

  /**
   * Verify document integrity hash
   * @param {Object} data - Document data
   * @param {string} expectedHash - Expected hash
   * @returns {boolean} - Match status
   */
  static verifyIntegrityHash(data, expectedHash) {
    const computedHash = this.generateVerificationHash(data);
    return computedHash === expectedHash;
  }

  /**
   * Generate short verification URL
   * @param {string} code - Verification code
   * @param {string} baseUrl - Base URL
   * @returns {string} - Verification URL
   */
  static generateVerificationUrl(code, baseUrl) {
    return `${baseUrl}/verify/${code}`;
  }

  /**
   * Generate verification metadata
   * @param {Object} req - Express request object
   * @returns {Object} - Metadata
   */
  static extractVerificationMetadata(req) {
    return {
      ipAddress: this.getClientIP(req),
      userAgent: req.get('user-agent') || 'Unknown',
      timestamp: new Date(),
      referer: req.get('referer') || null,
      acceptLanguage: req.get('accept-language') || null,
    };
  }

  /**
   * Get client IP address
   * @param {Object} req - Express request
   * @returns {string} - IP address
   */
  static getClientIP(req) {
    return (
      req.headers['x-forwarded-for']?.split(',')[0].trim() ||
      req.headers['x-real-ip'] ||
      req.connection?.remoteAddress ||
      req.socket?.remoteAddress ||
      req.connection?.socket?.remoteAddress ||
      'Unknown'
    );
  }

  /**
   * Check if verification is suspicious
   * @param {Object} verification - Verification record
   * @param {Object} metadata - Current verification metadata
   * @returns {Object} - {suspicious: boolean, reasons: Array}
   */
  static checkSuspiciousActivity(verification, metadata) {
    const reasons = [];
    let suspicious = false;

    // Check 1: Too many verifications in short time
    if (verification.verifiedCount > 100) {
      const timeSinceCreation =
        (new Date() - new Date(verification.createdAt)) / 1000 / 60; // minutes
      const verificationsPerMinute = verification.verifiedCount / timeSinceCreation;

      if (verificationsPerMinute > 1) {
        suspicious = true;
        reasons.push('High verification frequency detected');
      }
    }

    // Check 2: Rapid successive verifications (potential bot)
    if (verification.lastVerifiedAt) {
      const timeSinceLastVerification =
        (new Date() - new Date(verification.lastVerifiedAt)) / 1000; // seconds

      if (timeSinceLastVerification < 5) {
        suspicious = true;
        reasons.push('Rapid successive verifications');
      }
    }

    // Check 3: Same IP making too many requests
    if (
      verification.lastVerifiedBy === metadata.ipAddress &&
      verification.verifiedCount > 50
    ) {
      suspicious = true;
      reasons.push('Multiple verifications from same IP');
    }

    return { suspicious, reasons };
  }

  /**
   * Format verification response
   * @param {Object} verification - Verification record
   * @returns {Object} - Formatted response
   */
  static formatVerificationResponse(verification) {
    const { document } = verification;

    return {
      verificationCode: verification.verificationCode,
      verified: true,
      verifiedCount: verification.verifiedCount,
      lastVerifiedAt: verification.lastVerifiedAt,
      document: {
        id: document.id,
        title: document.title,
        fileName: document.originalName,
        status: document.status,
        signedAt: document.signedAt,
        fileSize: document.fileSize,
        metadata: document.metadata,
      },
      signer: {
        name: `${document.user.firstName} ${document.user.lastName}`,
        email: document.user.email,
      },
      signatures: document.signatures.map((sig) => ({
        id: sig.id,
        name: sig.name,
        appliedAt: sig.appliedAt,
        position: sig.position,
        signer: {
          name: `${sig.user.firstName} ${sig.user.lastName}`,
          email: sig.user.email,
        },
      })),
      verifiedAt: new Date(),
    };
  }

  /**
   * Sanitize verification data for public display
   * @param {Object} data - Verification data
   * @returns {Object} - Sanitized data
   */
  static sanitizeForPublic(data) {
    // Remove sensitive information
    const sanitized = { ...data };

    // Partially hide email addresses
    if (sanitized.signer?.email) {
      sanitized.signer.email = this.maskEmail(sanitized.signer.email);
    }

    if (sanitized.signatures) {
      sanitized.signatures = sanitized.signatures.map((sig) => ({
        ...sig,
        signer: {
          ...sig.signer,
          email: this.maskEmail(sig.signer.email),
        },
      }));
    }

    return sanitized;
  }

  /**
   * Mask email address
   * @param {string} email - Email address
   * @returns {string} - Masked email
   */
  static maskEmail(email) {
    if (!email) return '';

    const [local, domain] = email.split('@');
    if (!domain) return email;

    const visibleChars = Math.min(3, Math.floor(local.length / 2));
    const masked = local.substring(0, visibleChars) + '***';

    return `${masked}@${domain}`;
  }

  /**
   * Generate verification badge data
   * @param {Object} verification - Verification record
   * @returns {Object} - Badge data
   */
  static generateBadgeData(verification) {
    return {
      status: 'verified',
      color: '#10B981', // Green
      verifiedCount: verification.verifiedCount,
      lastVerified: verification.lastVerifiedAt,
      icon: '✓',
      text: 'Verified Document',
    };
  }
}

module.exports = VerificationUtils;
