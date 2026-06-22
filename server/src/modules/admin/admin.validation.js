const { z } = require('zod');

// ============================================
// VALIDATION SCHEMAS
// ============================================

/**
 * List users validation
 */
const listUsersSchema = z.object({
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
      .default('20'),
    search: z.string().optional(),
    role: z.enum(['USER', 'ADMIN']).optional(),
    isActive: z
      .enum(['true', 'false'])
      .transform((val) => val === 'true')
      .optional(),
    isEmailVerified: z
      .enum(['true', 'false'])
      .transform((val) => val === 'true')
      .optional(),
    sortBy: z.enum(['createdAt', 'email', 'firstName', 'lastName']).optional().default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  }),
});

/**
 * Get user by ID validation
 */
const getUserByIdSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'User ID is required'),
  }),
});

/**
 * Update user validation
 */
const updateUserSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'User ID is required'),
  }),
  body: z.object({
    firstName: z.string().min(1).max(50).optional(),
    lastName: z.string().min(1).max(50).optional(),
    role: z.enum(['USER', 'ADMIN']).optional(),
    isActive: z.boolean().optional(),
    isEmailVerified: z.boolean().optional(),
  }),
});

/**
 * List documents validation
 */
const listDocumentsSchema = z.object({
  query: z.object({
    page: z
      .string()
      .regex(/^\d+$/)
      .transform(Number)
      .optional()
      .default('1'),
    limit: z
      .string()
      .regex(/^\d+$/)
      .transform(Number)
      .optional()
      .default('20'),
    userId: z.string().optional(),
    status: z.enum(['UPLOADED', 'SIGNING', 'SIGNED', 'FAILED']).optional(),
    search: z.string().optional(),
    sortBy: z.enum(['createdAt', 'title', 'fileSize', 'signedAt']).optional().default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  }),
});

/**
 * List signatures validation
 */
const listSignaturesSchema = z.object({
  query: z.object({
    page: z
      .string()
      .regex(/^\d+$/)
      .transform(Number)
      .optional()
      .default('1'),
    limit: z
      .string()
      .regex(/^\d+$/)
      .transform(Number)
      .optional()
      .default('20'),
    userId: z.string().optional(),
    documentId: z.string().optional(),
    isReusable: z
      .enum(['true', 'false'])
      .transform((val) => val === 'true')
      .optional(),
    sortBy: z.enum(['createdAt', 'appliedAt']).optional().default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  }),
});

/**
 * Dashboard stats validation
 */
const getDashboardStatsSchema = z.object({
  query: z.object({
    period: z.enum(['7d', '30d', '90d', '1y']).optional().default('30d'),
  }),
});

/**
 * System health validation
 */
const getSystemHealthSchema = z.object({
  query: z.object({
    detailed: z
      .enum(['true', 'false'])
      .transform((val) => val === 'true')
      .optional()
      .default('false'),
  }),
});

module.exports = {
  listUsersSchema,
  getUserByIdSchema,
  updateUserSchema,
  listDocumentsSchema,
  listSignaturesSchema,
  getDashboardStatsSchema,
  getSystemHealthSchema,
};
