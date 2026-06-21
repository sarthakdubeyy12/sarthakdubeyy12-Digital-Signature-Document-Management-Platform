const jwt = require('jsonwebtoken');
const jwtConfig = require('../../config/jwt');

class JwtUtil {
  static generateAccessToken(payload) {
    return jwt.sign(payload, jwtConfig.access.secret, {
      expiresIn: jwtConfig.access.expiry,
      algorithm: jwtConfig.access.algorithm,
    });
  }

  static generateRefreshToken(payload) {
    return jwt.sign(payload, jwtConfig.refresh.secret, {
      expiresIn: jwtConfig.refresh.expiry,
      algorithm: jwtConfig.refresh.algorithm,
    });
  }

  static verifyAccessToken(token) {
    try {
      return jwt.verify(token, jwtConfig.access.secret);
    } catch (error) {
      throw error;
    }
  }

  static verifyRefreshToken(token) {
    try {
      return jwt.verify(token, jwtConfig.refresh.secret);
    } catch (error) {
      throw error;
    }
  }

  static decode(token) {
    return jwt.decode(token);
  }

  static generateTokenPair(payload) {
    return {
      accessToken: this.generateAccessToken(payload),
      refreshToken: this.generateRefreshToken(payload),
    };
  }
}

module.exports = JwtUtil;
