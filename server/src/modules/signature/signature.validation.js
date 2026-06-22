const { z } = require('zod');

// ============================================
// VALIDATION SCHEMAS
// ============================================

/**
 * Create signature validation
 * For both drawn and uploaded signatures
 */
const createSignatureSchema = z.object({
  body: z.object({
    name: z
      .string()
      .min(1, 'Signature name is required')
      .max(100, 'Name must be less than 100 characters')
      .trim(),
    isReusable: z
      .string()
      .transform((val) => val === 'true')
      .optional()
      .default('true'),
    // For base64 encoded drawn signatures
    signatureData: z
      .string()
      .optional()
      .refine(
        (val) => !val || val.startsWith('data:image/'),
        'Signature data must be a valid base64 image'
      ),
  }),
});

/**
 * Apply signature to document validation
 */
const applySignatureSchema = z.object({
  params: z.object({
    documentId: z.string().min(1, 'Document ID is required'),
  }),
  body: z.object({
    signatureId: z.string().min(1, 'Signature ID is required'),
    position: z.object({
      page: z
        .number()
        .int('Page must be an integer')
        .min(0, 'Page must be 0 or greater'),
      x: z.number().min(0, 'X coordinate must be positive'),
      y: z.number().min(0, 'Y coordinate must be positive'),
      width: z
        .number()
        .min(10, 'Width must be at least 10')
        .max(500, 'Width must not exceed 500'),
      height: z
        .number()
        .min(10, 'Height must be at least 10')
        .max(500, 'Height must not exceed 500'),
    }),
  }),
});

/**
 * Get signature by ID validation
 */
const getSignatureByIdSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Signature ID is required'),
  }),
});

/**
 * Delete signature validation
 */
const deleteSignatureSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Signature ID is required'),
  }),
});

/**
 * List signatures validation
 */
const listSignaturesSchema = z.object({
  query: z.object({
    page: z
      .string()
      .regex(/^\d+$/, 'Page must be a number')
      .transform(Number)
      .refine((val) => val > 0, 'Page must be greater than 0')
      .optional()
      .default('1'),
    limit: z
      .string()
      .regex(/^\d+$/, 'Limit must be a number')
      .transform(Number)
      .refine((val) => val > 0 && val <= 50, 'Limit must be between 1 and 50')
      .optional()
      .default('10'),
    isReusable: z
      .enum(['true', 'false'])
      .transform((val) => val === 'true')
      .optional(),
  }),
});

/**
 * Update signature validation
 */
const updateSignatureSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Signature ID is required'),
  }),
  body: z.object({
    name: z
      .string()
      .min(1, 'Name is required')
      .max(100, 'Name must be less than 100 characters')
      .optional(),
    isReusable: z.boolean().optional(),
  }),
});

module.exports = {
  createSignatureSchema,
  applySignatureSchema,
  getSignatureByIdSchema,
  deleteSignatureSchema,
  listSignaturesSchema,
  updateSignatureSchema,
};
