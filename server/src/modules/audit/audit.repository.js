const prisma = require('../../database/prisma.client');

/**
 * Audit Repository
 * Handles all database operations for audit logs
 */
class AuditRepository {
  /**
   * Create audit log entry
   */
  async createAuditLog(data) {
    return await prisma.auditLog.create({
      data: {
        ...data,
        metadata: data.metadata || {},
      },
    });
  }

  /**
   * Find audit log by ID
   */
  async findAuditLogById(id) {
    return await prisma.auditLog.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
    });
  }

  /**
   * List audit logs with filters and pagination
   */
  async listAuditLogs(filters = {}) {
    const {
      page = 1,
      limit = 20,
      userId,
      action,
      resource,
      success,
      startDate,
      endDate,
      ipAddress,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = filters;

    const skip = (page - 1) * limit;

    // Build where clause
    const where = {};

    if (userId) where.userId = userId;
    if (action) where.action = action;
    if (resource) where.resource = resource;
    if (success !== undefined) where.success = success;
    if (ipAddress) where.ipAddress = { contains: ipAddress };

    // Date range filter
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    // Execute queries
    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          [sortBy]: sortOrder,
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              role: true,
            },
          },
        },
      }),
      prisma.auditLog.count({ where }),
    ]);

    return {
      logs,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    };
  }

  /**
   * Get user activity logs
   */
  async getUserActivity(userId, filters = {}) {
    const { page = 1, limit = 20, startDate, endDate } = filters;

    const skip = (page - 1) * limit;

    const where = { userId };

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.auditLog.count({ where }),
    ]);

    return {
      logs,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    };
  }

  /**
   * Get audit statistics
   */
  async getAuditStatistics(filters = {}) {
    const { startDate, endDate } = filters;

    const where = {};

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const [
      totalLogs,
      successCount,
      failureCount,
      actionCounts,
      resourceCounts,
      uniqueUsers,
      recentFailures,
    ] = await Promise.all([
      // Total logs
      prisma.auditLog.count({ where }),

      // Success count
      prisma.auditLog.count({
        where: { ...where, success: true },
      }),

      // Failure count
      prisma.auditLog.count({
        where: { ...where, success: false },
      }),

      // Count by action
      prisma.auditLog.groupBy({
        by: ['action'],
        where,
        _count: { action: true },
        orderBy: {
          _count: {
            action: 'desc',
          },
        },
        take: 10,
      }),

      // Count by resource
      prisma.auditLog.groupBy({
        by: ['resource'],
        where,
        _count: { resource: true },
        orderBy: {
          _count: {
            resource: 'desc',
          },
        },
      }),

      // Unique users
      prisma.auditLog.groupBy({
        by: ['userId'],
        where,
        _count: { userId: true },
      }),

      // Recent failures
      prisma.auditLog.findMany({
        where: { ...where, success: false },
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      }),
    ]);

    return {
      totalLogs,
      successCount,
      failureCount,
      successRate:
        totalLogs > 0 ? ((successCount / totalLogs) * 100).toFixed(2) : 0,
      actionBreakdown: actionCounts.map((item) => ({
        action: item.action,
        count: item._count.action,
      })),
      resourceBreakdown: resourceCounts.map((item) => ({
        resource: item.resource,
        count: item._count.resource,
      })),
      uniqueUserCount: uniqueUsers.filter((u) => u.userId !== null).length,
      recentFailures,
    };
  }

  /**
   * Get activity by date range (for charts)
   */
  async getActivityByDateRange(filters = {}) {
    const { startDate, endDate, groupBy = 'day' } = filters;

    const where = {};

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    // Get all logs in date range
    const logs = await prisma.auditLog.findMany({
      where,
      select: {
        createdAt: true,
        action: true,
        success: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Group by date
    const grouped = {};

    logs.forEach((log) => {
      let dateKey;
      const date = new Date(log.createdAt);

      if (groupBy === 'day') {
        dateKey = date.toISOString().split('T')[0];
      } else if (groupBy === 'week') {
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        dateKey = weekStart.toISOString().split('T')[0];
      } else if (groupBy === 'month') {
        dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      }

      if (!grouped[dateKey]) {
        grouped[dateKey] = {
          date: dateKey,
          total: 0,
          success: 0,
          failure: 0,
        };
      }

      grouped[dateKey].total++;
      if (log.success) {
        grouped[dateKey].success++;
      } else {
        grouped[dateKey].failure++;
      }
    });

    return Object.values(grouped);
  }

  /**
   * Get suspicious activities
   */
  async getSuspiciousActivities(limit = 20) {
    // Get failed login attempts
    const failedLogins = await prisma.auditLog.findMany({
      where: {
        action: 'USER_LOGIN',
        success: false,
      },
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Get multiple failed attempts from same IP
    const suspiciousIPs = await prisma.auditLog.groupBy({
      by: ['ipAddress'],
      where: {
        success: false,
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
        },
      },
      _count: {
        ipAddress: true,
      },
      having: {
        ipAddress: {
          _count: {
            gt: 5, // More than 5 failures
          },
        },
      },
      orderBy: {
        _count: {
          ipAddress: 'desc',
        },
      },
    });

    return {
      failedLogins,
      suspiciousIPs: suspiciousIPs.map((item) => ({
        ipAddress: item.ipAddress,
        failureCount: item._count.ipAddress,
      })),
    };
  }

  /**
   * Delete old audit logs (data retention)
   */
  async deleteOldAuditLogs(daysToKeep = 90) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const result = await prisma.auditLog.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate,
        },
      },
    });

    return result.count;
  }

  /**
   * Export audit logs
   */
  async exportAuditLogs(filters = {}) {
    const { startDate, endDate, action, resource } = filters;

    const where = {};

    if (action) where.action = action;
    if (resource) where.resource = resource;

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    return await prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            email: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
    });
  }
}

module.exports = new AuditRepository();
