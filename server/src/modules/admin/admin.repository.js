const prisma = require('../../database/prisma.client');

/**
 * Admin Repository
 * Handles all database operations for admin functionality
 */
class AdminRepository {
  /**
   * List all users with filters
   */
  async listUsers(filters = {}) {
    const {
      page = 1,
      limit = 20,
      search,
      role,
      isActive,
      isEmailVerified,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = filters;

    const skip = (page - 1) * limit;

    const where = {
      deletedAt: null,
    };

    // Search filter (email, first name, last name)
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (role) where.role = role;
    if (isActive !== undefined) where.isActive = isActive;
    if (isEmailVerified !== undefined) where.isEmailVerified = isEmailVerified;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          [sortBy]: sortOrder,
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          isActive: true,
          isEmailVerified: true,
          profilePicture: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              documents: true,
              signatures: true,
            },
          },
        },
      }),
      prisma.user.count({ where }),
    ]);

    return {
      users,
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
   * Get user by ID with full details
   */
  async getUserById(id) {
    return await prisma.user.findUnique({
      where: { id, deletedAt: null },
      include: {
        documents: {
          where: { deletedAt: null },
          take: 5,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            title: true,
            status: true,
            createdAt: true,
          },
        },
        signatures: {
          where: { deletedAt: null },
          take: 5,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            name: true,
            createdAt: true,
          },
        },
        _count: {
          select: {
            documents: true,
            signatures: true,
            auditLogs: true,
          },
        },
      },
    });
  }

  /**
   * Update user
   */
  async updateUser(id, data) {
    return await prisma.user.update({
      where: { id, deletedAt: null },
      data: {
        ...data,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        isEmailVerified: true,
        updatedAt: true,
      },
    });
  }

  /**
   * Get user statistics
   */
  async getUserStatistics() {
    const [
      totalUsers,
      activeUsers,
      verifiedUsers,
      adminUsers,
      recentUsers,
    ] = await Promise.all([
      prisma.user.count({
        where: { deletedAt: null },
      }),
      prisma.user.count({
        where: { deletedAt: null, isActive: true },
      }),
      prisma.user.count({
        where: { deletedAt: null, isEmailVerified: true },
      }),
      prisma.user.count({
        where: { deletedAt: null, role: 'ADMIN' },
      }),
      prisma.user.findMany({
        where: { deletedAt: null },
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          createdAt: true,
        },
      }),
    ]);

    return {
      totalUsers,
      activeUsers,
      verifiedUsers,
      adminUsers,
      regularUsers: totalUsers - adminUsers,
      recentUsers,
    };
  }

  /**
   * List all documents with filters
   */
  async listDocuments(filters = {}) {
    const {
      page = 1,
      limit = 20,
      userId,
      status,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = filters;

    const skip = (page - 1) * limit;

    const where = {
      deletedAt: null,
    };

    if (userId) where.userId = userId;
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { originalName: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [documents, total] = await Promise.all([
      prisma.document.findMany({
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
            },
          },
          _count: {
            select: {
              signatures: true,
            },
          },
        },
      }),
      prisma.document.count({ where }),
    ]);

    return {
      documents,
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
   * Get document statistics
   */
  async getDocumentStatistics() {
    const [
      totalDocuments,
      uploadedDocuments,
      signedDocuments,
      failedDocuments,
      totalStorageUsed,
    ] = await Promise.all([
      prisma.document.count({
        where: { deletedAt: null },
      }),
      prisma.document.count({
        where: { deletedAt: null, status: 'UPLOADED' },
      }),
      prisma.document.count({
        where: { deletedAt: null, status: 'SIGNED' },
      }),
      prisma.document.count({
        where: { deletedAt: null, status: 'FAILED' },
      }),
      prisma.document.aggregate({
        where: { deletedAt: null },
        _sum: { fileSize: true },
      }),
    ]);

    return {
      totalDocuments,
      uploadedDocuments,
      signedDocuments,
      failedDocuments,
      totalStorageUsed: totalStorageUsed._sum.fileSize || 0,
    };
  }

  /**
   * List all signatures with filters
   */
  async listSignatures(filters = {}) {
    const {
      page = 1,
      limit = 20,
      userId,
      documentId,
      isReusable,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = filters;

    const skip = (page - 1) * limit;

    const where = {
      deletedAt: null,
    };

    if (userId) where.userId = userId;
    if (documentId) where.documentId = documentId;
    if (isReusable !== undefined) where.isReusable = isReusable;

    const [signatures, total] = await Promise.all([
      prisma.signature.findMany({
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
            },
          },
          document: {
            select: {
              id: true,
              title: true,
              status: true,
            },
          },
        },
      }),
      prisma.signature.count({ where }),
    ]);

    return {
      signatures,
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
   * Get signature statistics
   */
  async getSignatureStatistics() {
    const [
      totalSignatures,
      reusableSignatures,
      appliedSignatures,
    ] = await Promise.all([
      prisma.signature.count({
        where: { deletedAt: null },
      }),
      prisma.signature.count({
        where: { deletedAt: null, isReusable: true },
      }),
      prisma.signature.count({
        where: { deletedAt: null, documentId: { not: null } },
      }),
    ]);

    return {
      totalSignatures,
      reusableSignatures,
      appliedSignatures,
      unusedSignatures: totalSignatures - appliedSignatures,
    };
  }

  /**
   * Get dashboard overview statistics
   */
  async getDashboardStats(period = '30d') {
    // Calculate date range
    const now = new Date();
    let startDate = new Date();

    switch (period) {
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(now.getDate() - 90);
        break;
      case '1y':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate.setDate(now.getDate() - 30);
    }

    const [
      userStats,
      documentStats,
      signatureStats,
      newUsersCount,
      newDocumentsCount,
      newSignaturesCount,
      verificationStats,
    ] = await Promise.all([
      this.getUserStatistics(),
      this.getDocumentStatistics(),
      this.getSignatureStatistics(),
      // New users in period
      prisma.user.count({
        where: {
          deletedAt: null,
          createdAt: { gte: startDate },
        },
      }),
      // New documents in period
      prisma.document.count({
        where: {
          deletedAt: null,
          createdAt: { gte: startDate },
        },
      }),
      // New signatures in period
      prisma.signature.count({
        where: {
          deletedAt: null,
          createdAt: { gte: startDate },
        },
      }),
      // Verification stats
      prisma.verification.aggregate({
        _sum: { verifiedCount: true },
        _count: { id: true },
      }),
    ]);

    return {
      period,
      startDate,
      endDate: now,
      users: {
        ...userStats,
        newInPeriod: newUsersCount,
      },
      documents: {
        ...documentStats,
        newInPeriod: newDocumentsCount,
      },
      signatures: {
        ...signatureStats,
        newInPeriod: newSignaturesCount,
      },
      verifications: {
        totalVerifications: verificationStats._sum.verifiedCount || 0,
        totalDocumentsVerified: verificationStats._count || 0,
      },
    };
  }

  /**
   * Get activity trends (for charts)
   */
  async getActivityTrends(days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get daily counts for users, documents, signatures
    const [users, documents, signatures] = await Promise.all([
      prisma.user.groupBy({
        by: ['createdAt'],
        where: {
          deletedAt: null,
          createdAt: { gte: startDate },
        },
        _count: { id: true },
      }),
      prisma.document.groupBy({
        by: ['createdAt'],
        where: {
          deletedAt: null,
          createdAt: { gte: startDate },
        },
        _count: { id: true },
      }),
      prisma.signature.groupBy({
        by: ['createdAt'],
        where: {
          deletedAt: null,
          createdAt: { gte: startDate },
        },
        _count: { id: true },
      }),
    ]);

    return {
      users: this.groupByDate(users),
      documents: this.groupByDate(documents),
      signatures: this.groupByDate(signatures),
    };
  }

  /**
   * Helper: Group data by date
   */
  groupByDate(data) {
    const grouped = {};

    data.forEach((item) => {
      const date = new Date(item.createdAt).toISOString().split('T')[0];
      if (!grouped[date]) {
        grouped[date] = 0;
      }
      grouped[date] += item._count?.id || 1;
    });

    return Object.entries(grouped).map(([date, count]) => ({
      date,
      count,
    }));
  }
}

module.exports = new AdminRepository();
