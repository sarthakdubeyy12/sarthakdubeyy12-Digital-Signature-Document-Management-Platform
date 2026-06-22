const { z } = require('zod');

// ============================================
// VALIDATION SCHEMAS
// ============================================

/**
 * List audit logs validation
 */
const listAuditLogsSchema = z.object({
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
    userId: z.string().optional(),
    action: z
      .enum([
        'USER_REGISTER',
        'USER_LOGIN',
        'USER_LOGOUT',
        'USER_REFRESH_TOKEN',
        'PASSWORD_RESET_REQUEST',
        'PASSWORD_RESET_COMPLETE',
        'PASSWORD_CHANGE',
        'USER_UPDATE',
        'USER_DELETE',
        'USER_VIEW',
        'DOCUMENT_UPLOAD',
        'DOCUMENT_VIEW',
        'DOCUMENT_DOWNLOAD',
        'DOCUMENT_DELETE',
        'DOCUMENT_UPDATE',
        'SIGNATURE_CREATE',
        'SIGNATURE_APPLY',
        'SIGNATURE_DELETE',
        'DOCUMENT_SIGN',
        'DOCUMENT_VERIFY',
        'VERIFICATION_SUCCESS',
        'VERIFICATION_FAILED',
        'ADMIN_USER_VIEW',
        'ADMIN_DOCUMENT_VIEW',
        'ADMIN_AUDIT_VIEW',
      ])
      .optional(),
    resource: z.enum(['USER', 'DOCUMENT', 'SIGNATURE', 'VERIFICATION', 'SYSTEM']).optional(),
    success: z
      .enum(['true', 'false'])
      .transform((val) => val === 'true')
      .optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    ipAddress: z.string().optional(),
    sortBy: z.enum(['createdAt', 'action', 'resource']).optional().default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  }),
});

/**
 * Get audit log by ID validation
 */
const getAuditLogByIdSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Audit log ID is required'),
  }),
});

/**
 * Get user activity validation
 */
const getUserActivitySchema = z.object({
  params: z.object({
    userId: z.string().min(1, 'User ID is required'),
  }),
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
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
  }),
});

/**
 * Get audit statistics validation
 */
const getAuditStatsSchema = z.object({
  query: z.object({
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    groupBy: z.enum(['day', 'week', 'month']).optional().default('day'),
  }),
});

/**
 * Export audit logs validation
 */
const exportAuditLogsSchema = z.object({
  query: z.object({
    format: z.enum(['json', 'csv']).optional().default('json'),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    action: z.string().optional(),
    resource: z.string().optional(),
  }),
});

module.exports = {
  listAuditLogsSchema,
  getAuditLogByIdSchema,
  getUserActivitySchema,
  getAuditStatsSchema,
  exportAuditLogsSchema,
};
