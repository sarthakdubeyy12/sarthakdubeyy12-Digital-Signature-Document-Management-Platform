const { z } = require('zod');

// ============================================
// VALIDATION SCHEMAS
// ============================================

/**
 * Upload document validation
 * File validation done in middleware
 */
const uploadDocumentSchema = z.object({
  body: z.object({
    title: z
      .string()
      .min(1, 'Title is required')
      .max(255, 'Title must be less than 255 characters')
      .trim(),
    description: z
      .string()
      .max(1000, 'Description must be less than 1000 characters')
      .optional(),
  }),
});

/**
 * Update document metadata validation
 */
const updateDocumentSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Document ID is required'),
  }),
  body: z.object({
    title: z
      .string()
      .min(1, 'Title is required')
      .max(255, 'Title must be less than 255 characters')
      .trim()
      .optional(),
    description: z
      .string()
      .max(1000, 'Description must be less than 1000 characters')
      .optional(),
  }),
});

/**
 * Get document by ID validation
 */
const getDocumentByIdSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Document ID is required'),
  }),
});

/**
 * Delete document validation
 */
const deleteDocumentSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Document ID is required'),
  }),
});

/**
 * List documents with pagination and filters
 */
const listDocumentsSchema = z.object({
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
      .refine((val) => val > 0 && val <= 100, 'Limit must be between 1 and 100')
      .optional()
      .default('10'),
    status: z
      .enum(['UPLOADED', 'SIGNING', 'SIGNED', 'FAILED'])
      .optional(),
    sortBy: z
      .enum(['createdAt', 'updatedAt', 'title', 'status'])
      .optional()
      .default('createdAt'),
    sortOrder: z
      .enum(['asc', 'desc'])
      .optional()
      .default('desc'),
    search: z
      .string()
      .max(255, 'Search term must be less than 255 characters')
      .optional(),
  }),
});

/**
 * Download document validation
 */
const downloadDocumentSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Document ID is required'),
  }),
  query: z.object({
    version: z.enum(['original', 'signed']).optional().default('original'),
  }),
});

module.exports = {
  uploadDocumentSchema,
  updateDocumentSchema,
  getDocumentByIdSchema,
  deleteDocumentSchema,
  listDocumentsSchema,
  downloadDocumentSchema,
};
