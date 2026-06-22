const auditService = require('./audit.service');
const logger = require('../../services/logger/logger.service');

/**
 * Audit Controller
 * Handles HTTP requests for audit logging
 */
class AuditController {
  /**
   * List audit logs (Admin only)
   * GET /api/v1/admin/audit
   */
  async listAuditLogs(req, res, next) {
    try {
      const filters = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 20,
        userId: req.query.userId,
        action: req.query.action,
        resource: req.query.resource,
        success: req.query.success,
        startDate: req.query.startDate,
        endDate: req.query.endDate,
        ipAddress: req.query.ipAddress,
        sortBy: req.query.sortBy || 'createdAt',
        sortOrder: req.query.sortOrder || 'desc',
      };

      const result = await auditService.listAuditLogs(filters);

      res.status(200).json({
        success: true,
        data: result.logs,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get audit log by ID (Admin only)
   * GET /api/v1/admin/audit/:id
   */
  async getAuditLogById(req, res, next) {
    try {
      const { id } = req.params;

      const auditLog = await auditService.getAuditLogById(id);

      res.status(200).json({
        success: true,
        data: auditLog,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get user activity (Admin or own activity)
   * GET /api/v1/audit/user/:userId
   */
  async getUserActivity(req, res, next) {
    try {
      const { userId } = req.params;
      const currentUserId = req.user.userId;
      const isAdmin = req.user.role === 'ADMIN';

      // Users can only view their own activity unless they're admin
      if (!isAdmin && userId !== currentUserId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied',
        });
      }

      const filters = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 20,
        startDate: req.query.startDate,
        endDate: req.query.endDate,
      };

      const result = await auditService.getUserActivity(userId, filters);

      res.status(200).json({
        success: true,
        data: result.logs,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get audit statistics (Admin only)
   * GET /api/v1/admin/audit/stats
   */
  async getAuditStatistics(req, res, next) {
    try {
      const filters = {
        startDate: req.query.startDate,
        endDate: req.query.endDate,
        groupBy: req.query.groupBy || 'day',
      };

      const stats = await auditService.getAuditStatistics(filters);

      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get suspicious activities (Admin only)
   * GET /api/v1/admin/audit/suspicious
   */
  async getSuspiciousActivities(req, res, next) {
    try {
      const limit = parseInt(req.query.limit) || 20;

      const activities = await auditService.getSuspiciousActivities(limit);

      logger.info('Suspicious activities request', {
        adminId: req.user.userId,
        limit,
      });

      res.status(200).json({
        success: true,
        data: activities,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Export audit logs (Admin only)
   * GET /api/v1/admin/audit/export
   */
  async exportAuditLogs(req, res, next) {
    try {
      const filters = {
        startDate: req.query.startDate,
        endDate: req.query.endDate,
        action: req.query.action,
        resource: req.query.resource,
      };

      const format = req.query.format || 'json';

      const data = await auditService.exportAuditLogs(filters, format);

      logger.info('Audit logs exported', {
        adminId: req.user.userId,
        format,
        filters,
      });

      if (format === 'csv') {
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader(
          'Content-Disposition',
          `attachment; filename="audit-logs-${Date.now()}.csv"`
        );
        return res.send(data);
      }

      res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get activity timeline (Admin only)
   * GET /api/v1/admin/audit/timeline
   */
  async getActivityTimeline(req, res, next) {
    try {
      const filters = {
        startDate: req.query.startDate,
        endDate: req.query.endDate,
        groupBy: req.query.groupBy || 'day',
      };

      const timeline = await auditService.getActivityTimeline(filters);

      res.status(200).json({
        success: true,
        data: timeline,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get recent activity (Admin dashboard)
   * GET /api/v1/admin/audit/recent
   */
  async getRecentActivity(req, res, next) {
    try {
      const limit = parseInt(req.query.limit) || 10;

      const activity = await auditService.getRecentActivity(limit);

      res.status(200).json({
        success: true,
        data: activity,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get own activity
   * GET /api/v1/audit/my-activity
   */
  async getMyActivity(req, res, next) {
    try {
      const userId = req.user.userId;

      const filters = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 20,
        startDate: req.query.startDate,
        endDate: req.query.endDate,
      };

      const result = await auditService.getUserActivity(userId, filters);

      res.status(200).json({
        success: true,
        data: result.logs,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get own login history
   * GET /api/v1/audit/my-login-history
   */
  async getMyLoginHistory(req, res, next) {
    try {
      const userId = req.user.userId;
      const limit = parseInt(req.query.limit) || 10;

      const history = await auditService.getUserLoginHistory(userId, limit);

      res.status(200).json({
        success: true,
        data: history,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuditController();
