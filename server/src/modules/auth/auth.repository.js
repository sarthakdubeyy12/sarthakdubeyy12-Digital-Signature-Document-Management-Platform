const prisma = require('../../database/prisma.client');
const { NotFoundError } = require('../../shared/errors');

class AuthRepository {
  async findUserByEmail(email) {
    return await prisma.user.findFirst({
      where: { 
        email,
        deletedAt: null 
      },
    });
  }

  async createUser(data) {
    return await prisma.user.create({
      data: {
        ...data,
        deletedAt: null, // Explicitly set to null for soft delete support
      },
    });
  }

  async createRefreshToken(userId, token, expiresAt) {
    return await prisma.refreshToken.create({
      data: {
        userId,
        token,
        expiresAt,
      },
    });
  }

  async findRefreshToken(token) {
    return await prisma.refreshToken.findFirst({
      where: {
        token,
        isRevoked: false,
        expiresAt: {
          gt: new Date(),
        },
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
            isActive: true,
            deletedAt: true,
          },
        },
      },
    });
  }

  async revokeRefreshToken(token) {
    return await prisma.refreshToken.updateMany({
      where: { token },
      data: { isRevoked: true },
    });
  }

  async revokeAllUserTokens(userId) {
    return await prisma.refreshToken.updateMany({
      where: { userId, isRevoked: false },
      data: { isRevoked: true },
    });
  }

  async createPasswordResetToken(userId, token, expiresAt) {
    return await prisma.passwordResetToken.create({
      data: {
        userId,
        token,
        expiresAt,
      },
    });
  }

  async findPasswordResetToken(token) {
    return await prisma.passwordResetToken.findFirst({
      where: {
        token,
        isUsed: false,
        expiresAt: {
          gt: new Date(),
        },
      },
      include: {
        user: true,
      },
    });
  }

  async markPasswordResetTokenAsUsed(token) {
    return await prisma.passwordResetToken.updateMany({
      where: { token },
      data: {
        isUsed: true,
        usedAt: new Date(),
      },
    });
  }

  async updateUserPassword(userId, hashedPassword) {
    return await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });
  }

  async findUserById(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId, deletedAt: null },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    return user;
  }

  async cleanupExpiredTokens() {
    const now = new Date();

    await Promise.all([
      prisma.refreshToken.deleteMany({
        where: {
          expiresAt: {
            lt: now,
          },
        },
      }),
      prisma.passwordResetToken.deleteMany({
        where: {
          expiresAt: {
            lt: now,
          },
        },
      }),
    ]);
  }
}

module.exports = new AuthRepository();
