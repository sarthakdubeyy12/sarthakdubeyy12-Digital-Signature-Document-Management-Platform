const auditRepository = require('./audit.repository');
const logger = require('../../services/logger/logger.service');
const { NotFoundError } = require('../../shared/errors');

/**
 * Audit Service
 * Handles all business logic for audit logging
 */
class AuditService {
  /**
   * Create audit log entry
   * @param {Object} data - Audit log data
   * @returns {Promise<Object>} - Created audit log
   */
  async createAuditLog(data) {
    try {
      const auditLog = await auditRepository.createAuditLog(data);

      // Log to Winston for additional tracking
      logger.audit(data.action, {
        userId: data.userId,
        resource: data.resource,
        resourceId: data.resourceId,
        ipAddress: data.ipAddress,
        success: data.success,
        metadata: data.metadata,
      });

      return auditLog;
    } catch (error) {
      logger.error('Failed to create audit log', {
        data,
        error: error.message,
      });
      // Don't throw - audit logging should not break the application
      return null;
    }
  }

  /**
   * Get audit log by ID
   * @param {string} id - Audit log ID
   * @returns {Promise<Object>} - Audit log
   */
  async getAuditLogById(id) {
    logger.info('Getting audit log by ID', { id });

    const auditLog = await auditRepository.findAuditLogById(id);

    if (!auditLog) {
      throw new NotFoundError('Audit log not found');
    }

    return auditLog;
  }

  /**
   * List audit logs with filters
   * @param {Object} filters - Filter options
   * @returns {Promise<Object>} - Audit logs with pagination
   */
  async listAuditLogs(filters = {}) {
    logger.info('Listing audit logs', { filters });

    const result = await auditRepository.listAuditLogs(filters);

    return {
      logs: result.logs.map((log) => this.sanitizeAuditLog(log)),
      pagination: result.pagination,
    };
  }

  /**
   * Get user activity
   * @param {string} userId - User ID
   * @param {Object} filters - Filter options
   * @returns {Promise<Object>} - User activity logs
   */
  async getUserActivity(userId, filters = {}) {
    logger.info('Getting user activity', { userId, filters });

    const result = await auditRepository.getUserActivity(userId, filters);

    return {
      logs: result.logs.map((log) => this.sanitizeAuditLog(log)),
      pagination: result.pagination,
    };
  }

  /**
   * Get audit statistics
   * @param {Object} filters - Filter options
   * @returns {Promise<Object>} - Statistics
   */
  async getAuditStatistics(filters = {}) {
    logger.info('Getting audit statistics', { filters });

    const stats = await auditRepository.getAuditStatistics(filters);
    const activityByDate = await auditRepository.getActivityByDateRange(filters);

    return {
      ...stats,
      activityTimeline: activityByDate,
    };
  }

  /**
   * Get suspicious activities
   * @param {number} limit - Number of records to return
   * @returns {Promise<Object>} - Suspicious activities
   */
  async getSuspiciousActivities(limit = 20) {
    logger.info('Getting suspicious activities', { limit });

    const activities = await auditRepository.getSuspiciousActivities(limit);

    return {
      failedLogins: activities.failedLogins.map((log) =>
        this.sanitizeAuditLog(log)
      ),
      suspiciousIPs: activities.suspiciousIPs,
      summary: {
        totalFailedLogins: activities.failedLogins.length,
        totalSuspiciousIPs: activities.suspiciousIPs.length,
      },
    };
  }

  /**
   * Export audit logs
   * @param {Object} filters - Export filters
   * @param {string} format - Export format (json or csv)
   * @returns {Promise<any>} - Exported data
   */
  async exportAuditLogs(filters = {}, format = 'json') {
    logger.info('Exporting audit logs', { filters, format });

    const logs = await auditRepository.exportAuditLogs(filters);

    if (format === 'csv') {
      return this.convertToCSV(logs);
    }

    return logs.map((log) => this.sanitizeAuditLog(log));
  }

  /**
   * Delete old audit logs (data retention)
   * @param {number} daysToKeep - Number of days to keep
   * @returns {Promise<number>} - Number of deleted logs
   */
  async deleteOldAuditLogs(daysToKeep = 90) {
    logger.info('Deleting old audit logs', { daysToKeep });

    const deletedCount = await auditRepository.deleteOldAuditLogs(daysToKeep);

    logger.info('Old audit logs deleted', { deletedCount, daysToKeep });

    return deletedCount;
  }

  /**
   * Get activity timeline
   * @param {Object} filters - Filter options
   * @returns {Promise<Array>} - Activity timeline
   */
  async getActivityTimeline(filters = {}) {
    logger.info('Getting activity timeline', { filters });

    return await auditRepository.getActivityByDateRange(filters);
  }

  /**
   * Sanitize audit log for response
   * @param {Object} log - Audit log
   * @returns {Object} - Sanitized log
   */
  sanitizeAuditLog(log) {
    if (!log) return null;

    const sanitized = {
      id: log.id,
      userId: log.userId,
      action: log.action,
      resource: log.resource,
      resourceId: log.resourceId,
      ipAddress: log.ipAddress,
      userAgent: log.userAgent,
      success: log.success,
      errorMessage: log.errorMessage,
      metadata: log.metadata,
      createdAt: log.createdAt,
    };

    // Add user info if available
    if (log.user) {
      sanitized.user = {
        id: log.user.id,
        email: log.user.email,
        name: `${log.user.firstName} ${log.user.lastName}`,
        role: log.user.role,
      };
    }

    return sanitized;
  }

  /**
   * Convert audit logs to CSV format
   * @param {Array} logs - Audit logs
   * @returns {string} - CSV string
   */
  convertToCSV(logs) {
    if (logs.length === 0) {
      return '';
    }

    // CSV headers
    const headers = [
      'ID',
      'Timestamp',
      'User ID',
      'User Email',
      'User Name',
      'Action',
      'Resource',
      'Resource ID',
      'IP Address',
      'User Agent',
      'Success',
      'Error Message',
      'Metadata',
    ];

    // CSV rows
    const rows = logs.map((log) => [
      log.id,
      log.createdAt.toISOString(),
      log.userId || '',
      log.user?.email || '',
      log.user ? `${log.user.firstName} ${log.user.lastName}` : '',
      log.action,
      log.resource,
      log.resourceId || '',
      log.ipAddress,
      log.userAgent,
      log.success ? 'Yes' : 'No',
      log.errorMessage || '',
      JSON.stringify(log.metadata || {}),
    ]);

    // Combine headers and rows
    const csvContent = [
      headers.join(','),
      ...rows.map((row) =>
        row
          .map((cell) => {
            // Escape quotes and wrap in quotes if contains comma
            const cellStr = String(cell).replace(/"/g, '""');
            return cellStr.includes(',') ? `"${cellStr}"` : cellStr;
          })
          .join(',')
      ),
    ].join('\n');

    return csvContent;
  }

  /**
   * Get recent activity for dashboard
   * @param {number} limit - Number of recent logs
   * @returns {Promise<Array>} - Recent activity
   */
  async getRecentActivity(limit = 10) {
    logger.info('Getting recent activity', { limit });

    const result = await auditRepository.listAuditLogs({
      page: 1,
      limit,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });

    return result.logs.map((log) => this.sanitizeAuditLog(log));
  }

  /**
   * Get user login history
   * @param {string} userId - User ID
   * @param {number} limit - Number of records
   * @returns {Promise<Array>} - Login history
   */
  async getUserLoginHistory(userId, limit = 10) {
    logger.info('Getting user login history', { userId, limit });

    const result = await auditRepository.listAuditLogs({
      userId,
      action: 'USER_LOGIN',
      page: 1,
      limit,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });

    return result.logs.map((log) => this.sanitizeAuditLog(log));
  }
}

module.exports = new AuditService();
