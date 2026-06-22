const prisma = require('../../database/prisma.client');

/**
 * Signature Repository
 * Handles all database operations for signatures
 */
class SignatureRepository {
  /**
   * Create a new signature
   */
  async createSignature(data) {
    return await prisma.signature.create({
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
   * Find signature by ID
   */
  async findSignatureById(id, userId = null) {
    const where = {
      id,
      deletedAt: null,
    };

    if (userId) {
      where.userId = userId;
    }

    return await prisma.signature.findFirst({
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
        document: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
      },
    });
  }

  /**
   * List user signatures
   */
  async listSignatures(userId, filters = {}) {
    const {
      page = 1,
      limit = 10,
      isReusable,
    } = filters;

    const skip = (page - 1) * limit;

    const where = {
      userId,
      deletedAt: null,
    };

    if (isReusable !== undefined) {
      where.isReusable = isReusable;
    }

    const [signatures, total] = await Promise.all([
      prisma.signature.findMany({
        where,
        skip,
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
   * Update signature
   */
  async updateSignature(id, userId, data) {
    return await prisma.signature.update({
      where: {
        id,
        userId,
        deletedAt: null,
      },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Soft delete signature
   */
  async deleteSignature(id, userId) {
    return await prisma.signature.update({
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
   * Find reusable signatures for user
   */
  async findReusableSignatures(userId) {
    return await prisma.signature.findMany({
      where: {
        userId,
        isReusable: true,
        deletedAt: null,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Link signature to document
   */
  async linkSignatureToDocument(signatureId, documentId, position) {
    return await prisma.signature.update({
      where: { id: signatureId },
      data: {
        documentId,
        position,
        appliedAt: new Date(),
      },
    });
  }

  /**
   * Get signatures for document
   */
  async getDocumentSignatures(documentId) {
    return await prisma.signature.findMany({
      where: {
        documentId,
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
      orderBy: {
        appliedAt: 'asc',
      },
    });
  }

  /**
   * Check if user owns signature
   */
  async isSignatureOwner(signatureId, userId) {
    const signature = await prisma.signature.findFirst({
      where: {
        id: signatureId,
        userId,
        deletedAt: null,
      },
      select: { id: true },
    });

    return !!signature;
  }
}

module.exports = new SignatureRepository();
