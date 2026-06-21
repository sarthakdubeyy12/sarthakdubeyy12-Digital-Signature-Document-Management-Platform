const redisClient = require('./redis.client');
const logger = require('../logger/logger.service');

class CacheService {
  constructor() {
    this.client = null;
    this.defaultTTL = 3600; // 1 hour in seconds
  }

  initialize() {
    this.client = redisClient.getClient();
  }

  async get(key) {
    try {
      if (!redisClient.isClientReady()) {
        logger.warn('Redis not ready, cache get skipped');
        return null;
      }

      const value = await this.client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.error(`Cache get error for key: ${key}`, error);
      return null;
    }
  }

  async set(key, value, ttl = this.defaultTTL) {
    try {
      if (!redisClient.isClientReady()) {
        logger.warn('Redis not ready, cache set skipped');
        return false;
      }

      await this.client.setEx(key, ttl, JSON.stringify(value));
      return true;
    } catch (error) {
      logger.error(`Cache set error for key: ${key}`, error);
      return false;
    }
  }

  async del(key) {
    try {
      if (!redisClient.isClientReady()) {
        logger.warn('Redis not ready, cache delete skipped');
        return false;
      }

      await this.client.del(key);
      return true;
    } catch (error) {
      logger.error(`Cache delete error for key: ${key}`, error);
      return false;
    }
  }

  async delPattern(pattern) {
    try {
      if (!redisClient.isClientReady()) {
        logger.warn('Redis not ready, cache pattern delete skipped');
        return false;
      }

      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(keys);
      }
      return true;
    } catch (error) {
      logger.error(`Cache pattern delete error for pattern: ${pattern}`, error);
      return false;
    }
  }

  async exists(key) {
    try {
      if (!redisClient.isClientReady()) {
        return false;
      }

      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      logger.error(`Cache exists error for key: ${key}`, error);
      return false;
    }
  }

  async ttl(key) {
    try {
      if (!redisClient.isClientReady()) {
        return -1;
      }

      return await this.client.ttl(key);
    } catch (error) {
      logger.error(`Cache TTL error for key: ${key}`, error);
      return -1;
    }
  }

  async flush() {
    try {
      if (!redisClient.isClientReady()) {
        logger.warn('Redis not ready, cache flush skipped');
        return false;
      }

      await this.client.flushDb();
      return true;
    } catch (error) {
      logger.error('Cache flush error', error);
      return false;
    }
  }
}

module.exports = new CacheService();
