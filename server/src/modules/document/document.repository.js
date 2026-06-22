const prisma = require('../../database/prisma.client');
const { NotFoundError } = require('../../shared/errors');

/**
 * Document Repository
 * Handles all database operations for documents
 */
class DocumentRepository {
  /**
   * Create a new document
   */
  async createDocument(data) {
    return await prisma.document.create({
      data: {
        ...data,
        deletedAt: null,
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
      },
    });
  }

  /**
   * Find document by ID
   */
  async findDocumentById(id, userId = null) {
    const where = {
      id,
      deletedAt: null,
    };

    // If userId provided, ensure user owns the document
    if (userId) {
      where.userId = userId;
    }

    return await prisma.document.findFirst({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        verification: true,
        signatures: {
          where: { deletedAt: null },
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });
  }

  /**
   * Find document by verification code
   */
  async findDocumentByVerificationCode(verificationCode) {
    return await prisma.document.findFirst({
      where: {
        verificationCode,
        deletedAt: null,
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
        verification: true,
        signatures: {
          where: { deletedAt: null },
        },
      },
    });
  }

  /**
   * List documents with pagination and filters
   */
  async listDocuments(userId, filters = {}) {
    const {
      page = 1,
      limit = 10,
      status,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      search,
    } = filters;

    const skip = (page - 1) * limit;

    // Build where clause
    const where = {
      userId,
      deletedAt: null,
    };

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { originalName: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Execute query with pagination
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
   * Update document
   */
  async updateDocument(id, userId, data) {
    return await prisma.document.update({
      where: {
        id,
        userId,
        deletedAt: null,
      },
      data: {
        ...data,
        updatedAt: new Date(),
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
      },
    });
  }

  /**
   * Soft delete document
   */
  async deleteDocument(id, userId) {
    return await prisma.document.update({
      where: {
        id,
        userId,
        deletedAt: null,
      },
      data: {
        deletedAt: new Date(),
      },
    });
  }

  /**
   * Update document status
   */
  async updateDocumentStatus(id, status, additionalData = {}) {
    return await prisma.document.update({
      where: { id },
      data: {
        status,
        ...additionalData,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Get document statistics for user
   */
  async getUserDocumentStats(userId) {
    const [total, uploaded, signed, failed] = await Promise.all([
      prisma.document.count({
        where: { userId, deletedAt: null },
      }),
      prisma.document.count({
        where: { userId, status: 'UPLOADED', deletedAt: null },
      }),
      prisma.document.count({
        where: { userId, status: 'SIGNED', deletedAt: null },
      }),
      prisma.document.count({
        where: { userId, status: 'FAILED', deletedAt: null },
      }),
    ]);

    return {
      total,
      uploaded,
      signed,
      failed,
    };
  }

  /**
   * Check if user owns document
   */
  async isDocumentOwner(documentId, userId) {
    const document = await prisma.document.findFirst({
      where: {
        id: documentId,
        userId,
        deletedAt: null,
      },
      select: { id: true },
    });

    return !!document;
  }

  /**
   * Find documents by status
   */
  async findDocumentsByStatus(status, limit = 10) {
    return await prisma.document.findMany({
      where: {
        status,
        deletedAt: null,
      },
      take: limit,
      orderBy: {
        createdAt: 'desc',
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
      },
    });
  }
}

module.exports = new DocumentRepository();
