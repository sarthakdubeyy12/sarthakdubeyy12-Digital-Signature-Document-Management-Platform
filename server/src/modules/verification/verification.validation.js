const { z } = require('zod');

// ============================================
// VALIDATION SCHEMAS
// ============================================

/**
 * Verify document by code validation
 */
const verifyDocumentSchema = z.object({
  params: z.object({
    code: z
      .string()
      .min(1, 'Verification code is required')
      .regex(
        /^VER-[A-Z0-9]{8,12}-[A-F0-9]{24,32}$/,
        'Invalid verification code format'
      ),
  }),
});

/**
 * Get verification statistics (Admin only)
 */
const getVerificationStatsSchema = z.object({
  query: z.object({
    startDate: z
      .string()
      .datetime()
      .optional(),
    endDate: z
      .string()
      .datetime()
      .optional(),
  }),
});

/**
 * Regenerate QR code
 */
const regenerateQRCodeSchema = z.object({
  params: z.object({
    documentId: z.string().min(1, 'Document ID is required'),
  }),
});

module.exports = {
  verifyDocumentSchema,
  getVerificationStatsSchema,
  regenerateQRCodeSchema,
};
