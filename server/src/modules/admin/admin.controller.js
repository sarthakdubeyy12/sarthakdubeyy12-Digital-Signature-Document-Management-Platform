const adminService = require('./admin.service');
const logger = require('../../services/logger/logger.service');

/**
 * Admin Controller
 * Handles HTTP requests for admin functionality
 */
class AdminController {
  /**
   * List all users
   * GET /api/v1/admin/users
   */
  async listUsers(req, res, next) {
    try {
      const filters = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 20,
        search: req.query.search,
        role: req.query.role,
        isActive: req.query.isActive,
        isEmailVerified: req.query.isEmailVerified,
        sortBy: req.query.sortBy || 'createdAt',
        sortOrder: req.query.sortOrder || 'desc',
      };

      const result = await adminService.listUsers(filters);

      res.status(200).json({
        success: true,
        data: result.users,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get user by ID
   * GET /api/v1/admin/users/:id
   */
  async getUserById(req, res, next) {
    try {
      const { id } = req.params;

      const user = await adminService.getUserById(id);

      res.status(200).json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update user
   * PATCH /api/v1/admin/users/:id
   */
  async updateUser(req, res, next) {
    try {
      const { id } = req.params;
      const updates = req.body;

      const user = await adminService.updateUser(id, updates);

      logger.info('User updated by admin', {
        adminId: req.user.userId,
        userId: id,
        updates: Object.keys(updates),
      });

      res.status(200).json({
        success: true,
        message: 'User updated successfully',
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * List all documents
   * GET /api/v1/admin/documents
   */
  async listDocuments(req, res, next) {
    try {
      const filters = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 20,
        userId: req.query.userId,
        status: req.query.status,
        search: req.query.search,
        sortBy: req.query.sortBy || 'createdAt',
        sortOrder: req.query.sortOrder || 'desc',
      };

      const result = await adminService.listDocuments(filters);

      res.status(200).json({
        success: true,
        data: result.documents,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * List all signatures
   * GET /api/v1/admin/signatures
   */
  async listSignatures(req, res, next) {
    try {
      const filters = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 20,
        userId: req.query.userId,
        documentId: req.query.documentId,
        isReusable: req.query.isReusable,
        sortBy: req.query.sortBy || 'createdAt',
        sortOrder: req.query.sortOrder || 'desc',
      };

      const result = await adminService.listSignatures(filters);

      res.status(200).json({
        success: true,
        data: result.signatures,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get dashboard statistics
   * GET /api/v1/admin/dashboard
   */
  async getDashboardStats(req, res, next) {
    try {
      const period = req.query.period || '30d';

      const stats = await adminService.getDashboardStats(period);

      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get activity trends
   * GET /api/v1/admin/trends
   */
  async getActivityTrends(req, res, next) {
    try {
      const days = parseInt(req.query.days) || 30;

      const trends = await adminService.getActivityTrends(days);

      res.status(200).json({
        success: true,
        data: trends,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get system health
   * GET /api/v1/admin/health
   */
  async getSystemHealth(req, res, next) {
    try {
      const detailed = req.query.detailed === 'true';

      const health = await adminService.getSystemHealth(detailed);

      res.status(200).json({
        success: true,
        data: health,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get system metrics
   * GET /api/v1/admin/metrics
   */
  async getSystemMetrics(req, res, next) {
    try {
      const metrics = adminService.getSystemMetrics();

      res.status(200).json({
        success: true,
        data: metrics,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get user statistics
   * GET /api/v1/admin/stats/users
   */
  async getUserStatistics(req, res, next) {
    try {
      const stats = await adminService.getUserStatistics();

      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get document statistics
   * GET /api/v1/admin/stats/documents
   */
  async getDocumentStatistics(req, res, next) {
    try {
      const stats = await adminService.getDocumentStatistics();

      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get signature statistics
   * GET /api/v1/admin/stats/signatures
   */
  async getSignatureStatistics(req, res, next) {
    try {
      const stats = await adminService.getSignatureStatistics();

      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get comprehensive overview
   * GET /api/v1/admin/overview
   */
  async getOverview(req, res, next) {
    try {
      const overview = await adminService.getOverview();

      res.status(200).json({
        success: true,
        data: overview,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Clear admin cache
   * DELETE /api/v1/admin/cache
   */
  async clearCache(req, res, next) {
    try {
      await adminService.clearCache();

      logger.info('Admin cache cleared', {
        adminId: req.user.userId,
      });

      res.status(200).json({
        success: true,
        message: 'Cache cleared successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AdminController();
