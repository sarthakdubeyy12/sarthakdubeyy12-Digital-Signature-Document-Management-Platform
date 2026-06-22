const prisma = require('../../database/prisma.client');

/**
 * Verification Repository
 * Handles all database operations for document verification
 */
class VerificationRepository {
  /**
   * Create verification record
   */
  async createVerification(data) {
    return await prisma.verification.create({
      data,
    });
  }

  /**
   * Find verification by code
   */
  async findByVerificationCode(code) {
    return await prisma.verification.findFirst({
      where: {
        verificationCode: code,
      },
      include: {
        document: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            },
            signatures: {
              where: {
                deletedAt: null,
              },
              select: {
                id: true,
                name: true,
                appliedAt: true,
                position: true,
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                    email: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  /**
   * Find verification by document ID
   */
  async findByDocumentId(documentId) {
    return await prisma.verification.findFirst({
      where: {
        documentId,
      },
    });
  }

  /**
   * Increment verification count
   */
  async incrementVerificationCount(id, metadata = {}) {
    return await prisma.verification.update({
      where: { id },
      data: {
        verifiedCount: {
          increment: 1,
        },
        lastVerifiedAt: new Date(),
        lastVerifiedBy: metadata.ipAddress || null,
        metadata: {
          userAgent: metadata.userAgent || null,
          ipAddress: metadata.ipAddress || null,
        },
      },
    });
  }

  /**
   * Get verification statistics
   */
  async getVerificationStats(filters = {}) {
    const { startDate, endDate } = filters;

    const where = {};

    if (startDate || endDate) {
      where.lastVerifiedAt = {};
      if (startDate) where.lastVerifiedAt.gte = new Date(startDate);
      if (endDate) where.lastVerifiedAt.lte = new Date(endDate);
    }

    const [totalVerifications, totalVerifiedDocuments, verificationsByDate] =
      await Promise.all([
        // Total verification attempts
        prisma.verification.aggregate({
          _sum: {
            verifiedCount: true,
          },
          where,
        }),

        // Total unique documents verified
        prisma.verification.count({
          where: {
            ...where,
            verifiedCount: {
              gt: 0,
            },
          },
        }),

        // Verifications grouped by date (last 30 days)
        prisma.verification.groupBy({
          by: ['lastVerifiedAt'],
          _sum: {
            verifiedCount: true,
          },
          where: {
            lastVerifiedAt: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            },
          },
          orderBy: {
            lastVerifiedAt: 'desc',
          },
        }),
      ]);

    return {
      totalVerifications: totalVerifications._sum.verifiedCount || 0,
      totalVerifiedDocuments,
      verificationsByDate: verificationsByDate.map((v) => ({
        date: v.lastVerifiedAt,
        count: v._sum.verifiedCount || 0,
      })),
    };
  }

  /**
   * Get most verified documents
   */
  async getMostVerifiedDocuments(limit = 10) {
    return await prisma.verification.findMany({
      take: limit,
      orderBy: {
        verifiedCount: 'desc',
      },
      include: {
        document: {
          select: {
            id: true,
            title: true,
            status: true,
            signedAt: true,
          },
        },
      },
    });
  }

  /**
   * Check if verification exists
   */
  async verificationExists(documentId) {
    const count = await prisma.verification.count({
      where: { documentId },
    });
    return count > 0;
  }

  /**
   * Delete verification record (rarely used)
   */
  async deleteVerification(documentId) {
    return await prisma.verification.delete({
      where: { documentId },
    });
  }
}

module.exports = new VerificationRepository();
