const os = require('os');
const redis = require('../../config/redis');
const logger = require('../logger/logger.service');

/**
 * Metrics Service
 * Collects and provides system metrics for admin dashboard
 */
class MetricsService {
  /**
   * Get system health metrics
   * @param {boolean} detailed - Include detailed metrics
   * @returns {Object} - System health data
   */
  getSystemHealth(detailed = false) {
    const uptime = process.uptime();
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();

    const health = {
      status: 'healthy',
      uptime: {
        seconds: Math.floor(uptime),
        formatted: this.formatUptime(uptime),
      },
      timestamp: new Date().toISOString(),
      memory: {
        heapUsed: this.formatBytes(memoryUsage.heapUsed),
        heapTotal: this.formatBytes(memoryUsage.heapTotal),
        rss: this.formatBytes(memoryUsage.rss),
        external: this.formatBytes(memoryUsage.external),
        heapUsedPercentage: (
          (memoryUsage.heapUsed / memoryUsage.heapTotal) *
          100
        ).toFixed(2),
      },
      process: {
        pid: process.pid,
        version: process.version,
        platform: process.platform,
      },
    };

    if (detailed) {
      health.system = {
        hostname: os.hostname(),
        platform: os.platform(),
        arch: os.arch(),
        cpus: os.cpus().length,
        totalMemory: this.formatBytes(os.totalmem()),
        freeMemory: this.formatBytes(os.freemem()),
        loadAverage: os.loadavg(),
        uptime: this.formatUptime(os.uptime()),
      };

      health.cpu = {
        user: cpuUsage.user,
        system: cpuUsage.system,
      };
    }

    return health;
  }

  /**
   * Get Redis health
   * @returns {Promise<Object>} - Redis health status
   */
  async getRedisHealth() {
    try {
      if (!redis.client || !redis.client.isOpen) {
        return {
          status: 'disconnected',
          connected: false,
        };
      }

      // Test Redis with ping
      const pong = await redis.client.ping();

      // Get Redis info
      const info = await redis.client.info();
      const lines = info.split('\r\n');
      const redisVersion = lines.find((line) => line.startsWith('redis_version:'));
      const connectedClients = lines.find((line) =>
        line.startsWith('connected_clients:')
      );
      const usedMemory = lines.find((line) => line.startsWith('used_memory_human:'));

      return {
        status: 'connected',
        connected: true,
        ping: pong,
        version: redisVersion ? redisVersion.split(':')[1] : 'unknown',
        connectedClients: connectedClients
          ? connectedClients.split(':')[1]
          : 'unknown',
        usedMemory: usedMemory ? usedMemory.split(':')[1] : 'unknown',
      };
    } catch (error) {
      logger.error('Failed to get Redis health', { error: error.message });
      return {
        status: 'error',
        connected: false,
        error: error.message,
      };
    }
  }

  /**
   * Get database health
   * @returns {Promise<Object>} - Database health status
   */
  async getDatabaseHealth() {
    try {
      const prisma = require('../../database/prisma.client');

      // Test database connection with simple query
      await prisma.$queryRaw`SELECT 1`;

      return {
        status: 'connected',
        connected: true,
        type: 'MongoDB',
      };
    } catch (error) {
      logger.error('Failed to get database health', { error: error.message });
      return {
        status: 'error',
        connected: false,
        error: error.message,
      };
    }
  }

  /**
   * Get storage health
   * @returns {Object} - Storage health status
   */
  getStorageHealth() {
    const fs = require('fs');
    const path = require('path');
    const config = require('../../config');

    const storagePath = config.storage.localPath || './storage';

    try {
      // Check if storage directory exists and is writable
      const exists = fs.existsSync(storagePath);

      if (!exists) {
        return {
          status: 'error',
          accessible: false,
          error: 'Storage directory does not exist',
        };
      }

      // Check write permissions
      fs.accessSync(storagePath, fs.constants.W_OK);

      // Get storage size (simplified)
      const stats = fs.statSync(storagePath);

      return {
        status: 'accessible',
        accessible: true,
        path: storagePath,
        type: config.storage.type || 'local',
      };
    } catch (error) {
      logger.error('Failed to get storage health', { error: error.message });
      return {
        status: 'error',
        accessible: false,
        error: error.message,
      };
    }
  }

  /**
   * Get comprehensive health check
   * @param {boolean} detailed - Include detailed metrics
   * @returns {Promise<Object>} - Complete health check
   */
  async getHealthCheck(detailed = false) {
    const [redisHealth, databaseHealth] = await Promise.all([
      this.getRedisHealth(),
      this.getDatabaseHealth(),
    ]);

    const systemHealth = this.getSystemHealth(detailed);
    const storageHealth = this.getStorageHealth();

    // Determine overall status
    const allHealthy =
      systemHealth.status === 'healthy' &&
      redisHealth.status === 'connected' &&
      databaseHealth.status === 'connected' &&
      storageHealth.status === 'accessible';

    return {
      status: allHealthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      services: {
        api: systemHealth,
        redis: redisHealth,
        database: databaseHealth,
        storage: storageHealth,
      },
    };
  }

  /**
   * Format bytes to human readable
   * @param {number} bytes - Bytes
   * @returns {string} - Formatted string
   */
  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * Format uptime to human readable
   * @param {number} seconds - Uptime in seconds
   * @returns {string} - Formatted string
   */
  formatUptime(seconds) {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);

    return parts.join(' ');
  }

  /**
   * Get request metrics (from logger)
   * @returns {Object} - Request metrics
   */
  getRequestMetrics() {
    // This would typically come from a metrics store like Prometheus
    // For now, return placeholder
    return {
      totalRequests: 0,
      successRate: 0,
      averageResponseTime: 0,
      requests: {
        total: 0,
        success: 0,
        errors: 0,
      },
    };
  }
}

module.exports = new MetricsService();
