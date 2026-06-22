const redis = require('../../config/redis');
const logger = require('../logger/logger.service');

/**
 * Cache Service
 * Handles Redis caching operations for verification and other data
 */
class CacheService {
  constructor() {
    this.defaultTTL = 3600; // 1 hour in seconds
    this.prefix = 'dsp:'; // Digital Signature Platform prefix
  }

  /**
   * Build cache key with prefix
   */
  buildKey(key) {
    return `${this.prefix}${key}`;
  }

  /**
   * Set cache value
   * @param {string} key - Cache key
   * @param {any} value - Value to cache
   * @param {number} ttl - TTL in seconds
   */
  async set(key, value, ttl = this.defaultTTL) {
    try {
      const cacheKey = this.buildKey(key);
      const serialized = JSON.stringify(value);

      if (ttl) {
        await redis.client.setEx(cacheKey, ttl, serialized);
      } else {
        await redis.client.set(cacheKey, serialized);
      }

      logger.debug('Cache set', { key: cacheKey, ttl });
      return true;
    } catch (error) {
      logger.error('Cache set failed', { key, error: error.message });
      return false;
    }
  }

  /**
   * Get cache value
   * @param {string} key - Cache key
   * @returns {Promise<any>} - Cached value or null
   */
  async get(key) {
    try {
      const cacheKey = this.buildKey(key);
      const cached = await redis.client.get(cacheKey);

      if (!cached) {
        logger.debug('Cache miss', { key: cacheKey });
        return null;
      }

      logger.debug('Cache hit', { key: cacheKey });
      return JSON.parse(cached);
    } catch (error) {
      logger.error('Cache get failed', { key, error: error.message });
      return null;
    }
  }

  /**
   * Delete cache entry
   * @param {string} key - Cache key
   */
  async delete(key) {
    try {
      const cacheKey = this.buildKey(key);
      await redis.client.del(cacheKey);
      logger.debug('Cache deleted', { key: cacheKey });
      return true;
    } catch (error) {
      logger.error('Cache delete failed', { key, error: error.message });
      return false;
    }
  }

  /**
   * Delete multiple cache entries by pattern
   * @param {string} pattern - Key pattern (e.g., 'verification:*')
   */
  async deletePattern(pattern) {
    try {
      const fullPattern = this.buildKey(pattern);
      const keys = await redis.client.keys(fullPattern);

      if (keys.length > 0) {
        await redis.client.del(keys);
        logger.debug('Cache pattern deleted', {
          pattern: fullPattern,
          count: keys.length,
        });
      }

      return keys.length;
    } catch (error) {
      logger.error('Cache pattern delete failed', {
        pattern,
        error: error.message,
      });
      return 0;
    }
  }

  /**
   * Check if key exists
   * @param {string} key - Cache key
   * @returns {Promise<boolean>}
   */
  async exists(key) {
    try {
      const cacheKey = this.buildKey(key);
      const exists = await redis.client.exists(cacheKey);
      return exists === 1;
    } catch (error) {
      logger.error('Cache exists check failed', { key, error: error.message });
      return false;
    }
  }

  /**
   * Get TTL for a key
   * @param {string} key - Cache key
   * @returns {Promise<number>} - TTL in seconds, -1 if no expiry, -2 if not exists
   */
  async getTTL(key) {
    try {
      const cacheKey = this.buildKey(key);
      return await redis.client.ttl(cacheKey);
    } catch (error) {
      logger.error('Cache TTL check failed', { key, error: error.message });
      return -2;
    }
  }

  /**
   * Increment counter
   * @param {string} key - Cache key
   * @param {number} increment - Increment value (default 1)
   * @returns {Promise<number>} - New value
   */
  async increment(key, increment = 1) {
    try {
      const cacheKey = this.buildKey(key);
      const value = await redis.client.incrBy(cacheKey, increment);
      logger.debug('Cache incremented', { key: cacheKey, value });
      return value;
    } catch (error) {
      logger.error('Cache increment failed', { key, error: error.message });
      return 0;
    }
  }

  /**
   * Set expiry on existing key
   * @param {string} key - Cache key
   * @param {number} ttl - TTL in seconds
   */
  async expire(key, ttl) {
    try {
      const cacheKey = this.buildKey(key);
      await redis.client.expire(cacheKey, ttl);
      logger.debug('Cache expiry set', { key: cacheKey, ttl });
      return true;
    } catch (error) {
      logger.error('Cache expire failed', { key, error: error.message });
      return false;
    }
  }

  /**
   * Cache verification data
   * @param {string} verificationCode - Verification code
   * @param {Object} data - Verification data
   * @param {number} ttl - TTL in seconds (default 1 hour)
   */
  async cacheVerification(verificationCode, data, ttl = 3600) {
    const key = `verification:${verificationCode}`;
    return await this.set(key, data, ttl);
  }

  /**
   * Get cached verification data
   * @param {string} verificationCode - Verification code
   * @returns {Promise<Object|null>}
   */
  async getCachedVerification(verificationCode) {
    const key = `verification:${verificationCode}`;
    return await this.get(key);
  }

  /**
   * Invalidate verification cache
   * @param {string} verificationCode - Verification code
   */
  async invalidateVerification(verificationCode) {
    const key = `verification:${verificationCode}`;
    return await this.delete(key);
  }

  /**
   * Track verification rate limit
   * @param {string} identifier - IP address or user ID
   * @param {number} limit - Max attempts
   * @param {number} window - Time window in seconds
   * @returns {Promise<{allowed: boolean, remaining: number}>}
   */
  async checkRateLimit(identifier, limit = 10, window = 60) {
    try {
      const key = `ratelimit:verification:${identifier}`;
      const cacheKey = this.buildKey(key);

      const current = await redis.client.incr(cacheKey);

      if (current === 1) {
        // First request, set expiry
        await redis.client.expire(cacheKey, window);
      }

      const allowed = current <= limit;
      const remaining = Math.max(0, limit - current);

      logger.debug('Rate limit check', {
        identifier,
        current,
        limit,
        allowed,
      });

      return { allowed, remaining, current };
    } catch (error) {
      logger.error('Rate limit check failed', {
        identifier,
        error: error.message,
      });
      // Fail open - allow request if Redis fails
      return { allowed: true, remaining: limit };
    }
  }

  /**
   * Cache QR code
   * @param {string} verificationCode - Verification code
   * @param {string} qrCodeData - QR code data URL
   * @param {number} ttl - TTL in seconds (default 24 hours)
   */
  async cacheQRCode(verificationCode, qrCodeData, ttl = 86400) {
    const key = `qrcode:${verificationCode}`;
    return await this.set(key, qrCodeData, ttl);
  }

  /**
   * Get cached QR code
   * @param {string} verificationCode - Verification code
   * @returns {Promise<string|null>}
   */
  async getCachedQRCode(verificationCode) {
    const key = `qrcode:${verificationCode}`;
    return await this.get(key);
  }

  /**
   * Clear all cache
   * WARNING: Use with caution in production
   */
  async flushAll() {
    try {
      await redis.client.flushAll();
      logger.warn('All cache flushed');
      return true;
    } catch (error) {
      logger.error('Cache flush failed', { error: error.message });
      return false;
    }
  }
}

module.exports = new CacheService();
