const authRepository = require('./auth.repository');
const HashUtil = require('../../shared/utils/hash.util');
const JwtUtil = require('../../shared/utils/jwt.util');
const CryptoUtil = require('../../shared/utils/crypto.util');
const DateUtil = require('../../shared/utils/date.util');
const logger = require('../../services/logger/logger.service');
const {
  AuthenticationError,
  ValidationError,
  NotFoundError,
} = require('../../shared/errors');
const { SUCCESS_MESSAGES, ERROR_MESSAGES } = require('../../shared/constants');

class AuthService {
  async register(data) {
    logger.info('User registration attempt', { email: data.email });

    // Check if user already exists
    const existingUser = await authRepository.findUserByEmail(data.email);
    if (existingUser) {
      logger.warn('Registration failed - email already exists', { email: data.email });
      throw new ValidationError(ERROR_MESSAGES.EMAIL_EXISTS);
    }

    // Hash password
    const hashedPassword = await HashUtil.hashPassword(data.password);

    // Create user
    const user = await authRepository.createUser({
      email: data.email,
      password: hashedPassword,
      firstName: data.firstName,
      lastName: data.lastName,
      role: 'USER',
      isEmailVerified: false,
      isActive: true,
    });

    logger.info('User registered successfully', { userId: user.id, email: user.email });

    // Generate tokens
    const tokens = await this.generateTokens(user);

    // Return user without password
    const { password, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      ...tokens,
    };
  }

  async login(email, password) {
    logger.info('User login attempt', { email });

    // Find user
    const user = await authRepository.findUserByEmail(email);
    if (!user) {
      logger.warn('Login failed - user not found', { email });
      throw new AuthenticationError(ERROR_MESSAGES.INVALID_CREDENTIALS);
    }

    // Check if user is active
    if (!user.isActive) {
      logger.warn('Login failed - user inactive', { email });
      throw new AuthenticationError('Account is inactive. Please contact support.');
    }

    // Verify password
    const isPasswordValid = await HashUtil.verifyPassword(password, user.password);
    if (!isPasswordValid) {
      logger.warn('Login failed - invalid password', { email });
      throw new AuthenticationError(ERROR_MESSAGES.INVALID_CREDENTIALS);
    }

    logger.info('User logged in successfully', { userId: user.id, email: user.email });

    // Generate tokens
    const tokens = await this.generateTokens(user);

    // Return user without password
    const { password: _, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      ...tokens,
    };
  }

  async refreshToken(refreshToken) {
    logger.info('Token refresh attempt');

    // Find refresh token
    const tokenRecord = await authRepository.findRefreshToken(refreshToken);
    if (!tokenRecord) {
      logger.warn('Token refresh failed - invalid token');
      throw new AuthenticationError(ERROR_MESSAGES.TOKEN_INVALID);
    }

    // Check if user is active and not deleted
    if (!tokenRecord.user.isActive || tokenRecord.user.deletedAt) {
      logger.warn('Token refresh failed - user inactive or deleted', {
        userId: tokenRecord.user.id,
      });
      throw new AuthenticationError('User account is no longer active');
    }

    // Revoke old refresh token
    await authRepository.revokeRefreshToken(refreshToken);

    logger.info('Token refreshed successfully', { userId: tokenRecord.user.id });

    // Generate new tokens
    const tokens = await this.generateTokens(tokenRecord.user);

    return tokens;
  }

  async logout(refreshToken) {
    logger.info('User logout attempt');

    if (refreshToken) {
      await authRepository.revokeRefreshToken(refreshToken);
      logger.info('Refresh token revoked');
    }

    return { message: SUCCESS_MESSAGES.LOGOUT_SUCCESS };
  }

  async forgotPassword(email) {
    logger.info('Password reset requested', { email });

    // Find user
    const user = await authRepository.findUserByEmail(email);
    if (!user) {
      // Don't reveal if email exists
      logger.warn('Password reset requested for non-existent email', { email });
      return { message: SUCCESS_MESSAGES.PASSWORD_RESET_SENT };
    }

    // Generate reset token
    const resetToken = CryptoUtil.generateRandomToken(32);
    const expiresAt = DateUtil.addHours(new Date(), 1); // 1 hour expiry

    // Save reset token
    await authRepository.createPasswordResetToken(user.id, resetToken, expiresAt);

    logger.info('Password reset token created', { userId: user.id });

    // TODO: Send email with reset token
    // await emailService.sendPasswordResetEmail(user.email, resetToken);

    return {
      message: SUCCESS_MESSAGES.PASSWORD_RESET_SENT,
      // In development, return token (remove in production)
      ...(process.env.NODE_ENV === 'development' && { resetToken }),
    };
  }

  async resetPassword(token, newPassword) {
    logger.info('Password reset attempt');

    // Find reset token
    const resetTokenRecord = await authRepository.findPasswordResetToken(token);
    if (!resetTokenRecord) {
      logger.warn('Password reset failed - invalid token');
      throw new ValidationError('Invalid or expired reset token');
    }

    // Hash new password
    const hashedPassword = await HashUtil.hashPassword(newPassword);

    // Update password
    await authRepository.updateUserPassword(resetTokenRecord.userId, hashedPassword);

    // Mark token as used
    await authRepository.markPasswordResetTokenAsUsed(token);

    // Revoke all refresh tokens for security
    await authRepository.revokeAllUserTokens(resetTokenRecord.userId);

    logger.info('Password reset successful', { userId: resetTokenRecord.userId });

    return { message: SUCCESS_MESSAGES.PASSWORD_RESET_SUCCESS };
  }

  async changePassword(userId, currentPassword, newPassword) {
    logger.info('Password change attempt', { userId });

    // Find user
    const user = await authRepository.findUserById(userId);

    // Verify current password
    const isPasswordValid = await HashUtil.verifyPassword(currentPassword, user.password);
    if (!isPasswordValid) {
      logger.warn('Password change failed - invalid current password', { userId });
      throw new AuthenticationError('Current password is incorrect');
    }

    // Hash new password
    const hashedPassword = await HashUtil.hashPassword(newPassword);

    // Update password
    await authRepository.updateUserPassword(userId, hashedPassword);

    // Revoke all refresh tokens for security
    await authRepository.revokeAllUserTokens(userId);

    logger.info('Password changed successfully', { userId });

    return { message: SUCCESS_MESSAGES.PASSWORD_CHANGE_SUCCESS };
  }

  async generateTokens(user) {
    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    // Generate access token
    const accessToken = JwtUtil.generateAccessToken(payload);

    // Generate refresh token
    const refreshToken = CryptoUtil.generateRandomToken(40);
    const refreshTokenExpiry = DateUtil.addDays(new Date(), 7); // 7 days

    // Save refresh token
    await authRepository.createRefreshToken(user.id, refreshToken, refreshTokenExpiry);

    return {
      accessToken,
      refreshToken,
      expiresIn: 900, // 15 minutes in seconds
    };
  }

  async verifyAccessToken(token) {
    try {
      const decoded = JwtUtil.verifyAccessToken(token);

      // Optionally verify user still exists and is active
      const user = await authRepository.findUserById(decoded.userId);

      if (!user.isActive) {
        throw new AuthenticationError('User account is inactive');
      }

      return decoded;
    } catch (error) {
      logger.error('Access token verification failed', error);
      throw new AuthenticationError(ERROR_MESSAGES.TOKEN_INVALID);
    }
  }
}

module.exports = new AuthService();
