const adminRepository = require('./admin.repository');
const metricsService = require('../../services/metrics/metrics.service');
const cacheService = require('../../services/cache/cache.service');
const logger = require('../../services/logger/logger.service');
const { NotFoundError, ValidationError } = require('../../shared/errors');

/**
 * Admin Service
 * Handles all business logic for admin functionality
 */
class AdminService {
  /**
   * List all users
   * @param {Object} filters - Filter options
   * @returns {Promise<Object>} - Users with pagination
   */
  async listUsers(filters = {}) {
    logger.info('Admin listing users', { filters });

    // Check cache
    const cacheKey = `admin:users:${JSON.stringify(filters)}`;
    const cached = await cacheService.get(cacheKey);
    if (cached) {
      return cached;
    }

    const result = await adminRepository.listUsers(filters);

    // Cache for 5 minutes
    await cacheService.set(cacheKey, result, 300);

    return result;
  }

  /**
   * Get user by ID
   * @param {string} id - User ID
   * @returns {Promise<Object>} - User details
   */
  async getUserById(id) {
    logger.info('Admin getting user', { id });

    const user = await adminRepository.getUserById(id);

    if (!user) {
      throw new NotFoundError('User not found');
    }

    return user;
  }

  /**
   * Update user
   * @param {string} id - User ID
   * @param {Object} data - Update data
   * @returns {Promise<Object>} - Updated user
   */
  async updateUser(id, data) {
    logger.info('Admin updating user', { id, updates: Object.keys(data) });

    // Verify user exists
    const user = await adminRepository.getUserById(id);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Update user
    const updatedUser = await adminRepository.updateUser(id, data);

    // Invalidate cache
    await cacheService.deletePattern('admin:users:*');

    logger.info('User updated by admin', { userId: id });

    return updatedUser;
  }

  /**
   * List all documents
   * @param {Object} filters - Filter options
   * @returns {Promise<Object>} - Documents with pagination
   */
  async listDocuments(filters = {}) {
    logger.info('Admin listing documents', { filters });

    // Check cache
    const cacheKey = `admin:documents:${JSON.stringify(filters)}`;
    const cached = await cacheService.get(cacheKey);
    if (cached) {
      return cached;
    }

    const result = await adminRepository.listDocuments(filters);

    // Cache for 5 minutes
    await cacheService.set(cacheKey, result, 300);

    return result;
  }

  /**
   * List all signatures
   * @param {Object} filters - Filter options
   * @returns {Promise<Object>} - Signatures with pagination
   */
  async listSignatures(filters = {}) {
    logger.info('Admin listing signatures', { filters });

    // Check cache
    const cacheKey = `admin:signatures:${JSON.stringify(filters)}`;
    const cached = await cacheService.get(cacheKey);
    if (cached) {
      return cached;
    }

    const result = await adminRepository.listSignatures(filters);

    // Cache for 5 minutes
    await cacheService.set(cacheKey, result, 300);

    return result;
  }

  /**
   * Get dashboard statistics
   * @param {string} period - Time period (7d, 30d, 90d, 1y)
   * @returns {Promise<Object>} - Dashboard stats
   */
  async getDashboardStats(period = '30d') {
    logger.info('Admin getting dashboard stats', { period });

    // Check cache
    const cacheKey = `admin:dashboard:${period}`;
    const cached = await cacheService.get(cacheKey);
    if (cached) {
      return cached;
    }

    const stats = await adminRepository.getDashboardStats(period);

    // Cache for 10 minutes
    await cacheService.set(cacheKey, stats, 600);

    return stats;
  }

  /**
   * Get activity trends
   * @param {number} days - Number of days
   * @returns {Promise<Object>} - Activity trends
   */
  async getActivityTrends(days = 30) {
    logger.info('Admin getting activity trends', { days });

    // Check cache
    const cacheKey = `admin:trends:${days}`;
    const cached = await cacheService.get(cacheKey);
    if (cached) {
      return cached;
    }

    const trends = await adminRepository.getActivityTrends(days);

    // Cache for 1 hour
    await cacheService.set(cacheKey, trends, 3600);

    return trends;
  }

  /**
   * Get system health
   * @param {boolean} detailed - Include detailed metrics
   * @returns {Promise<Object>} - System health
   */
  async getSystemHealth(detailed = false) {
    logger.info('Admin getting system health', { detailed });

    const health = await metricsService.getHealthCheck(detailed);

    return health;
  }

  /**
   * Get system metrics
   * @returns {Object} - System metrics
   */
  getSystemMetrics() {
    logger.info('Admin getting system metrics');

    return metricsService.getSystemHealth(true);
  }

  /**
   * Get user statistics
   * @returns {Promise<Object>} - User statistics
   */
  async getUserStatistics() {
    logger.info('Admin getting user statistics');

    // Check cache
    const cacheKey = 'admin:stats:users';
    const cached = await cacheService.get(cacheKey);
    if (cached) {
      return cached;
    }

    const stats = await adminRepository.getUserStatistics();

    // Cache for 10 minutes
    await cacheService.set(cacheKey, stats, 600);

    return stats;
  }

  /**
   * Get document statistics
   * @returns {Promise<Object>} - Document statistics
   */
  async getDocumentStatistics() {
    logger.info('Admin getting document statistics');

    // Check cache
    const cacheKey = 'admin:stats:documents';
    const cached = await cacheService.get(cacheKey);
    if (cached) {
      return cached;
    }

    const stats = await adminRepository.getDocumentStatistics();

    // Cache for 10 minutes
    await cacheService.set(cacheKey, stats, 600);

    return stats;
  }

  /**
   * Get signature statistics
   * @returns {Promise<Object>} - Signature statistics
   */
  async getSignatureStatistics() {
    logger.info('Admin getting signature statistics');

    // Check cache
    const cacheKey = 'admin:stats:signatures';
    const cached = await cacheService.get(cacheKey);
    if (cached) {
      return cached;
    }

    const stats = await adminRepository.getSignatureStatistics();

    // Cache for 10 minutes
    await cacheService.set(cacheKey, stats, 600);

    return stats;
  }

  /**
   * Clear admin cache
   * @returns {Promise<boolean>} - Success status
   */
  async clearCache() {
    logger.info('Admin clearing cache');

    await cacheService.deletePattern('admin:*');

    return true;
  }

  /**
   * Get comprehensive overview
   * @returns {Promise<Object>} - Complete overview
   */
  async getOverview() {
    logger.info('Admin getting overview');

    const [
      userStats,
      documentStats,
      signatureStats,
      systemHealth,
    ] = await Promise.all([
      this.getUserStatistics(),
      this.getDocumentStatistics(),
      this.getSignatureStatistics(),
      this.getSystemHealth(false),
    ]);

    return {
      users: userStats,
      documents: documentStats,
      signatures: signatureStats,
      system: systemHealth,
      timestamp: new Date().toISOString(),
    };
  }
}

module.exports = new AdminService();
