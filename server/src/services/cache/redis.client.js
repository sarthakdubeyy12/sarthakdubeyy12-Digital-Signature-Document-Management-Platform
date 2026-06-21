const redis = require('redis');
const redisConfig = require('../../config/redis');
const logger = require('../logger/logger.service');

class RedisClient {
  constructor() {
    this.client = null;
    this.isReady = false;
  }

  async connect() {
    try {
      this.client = redis.createClient(redisConfig);

      // Event handlers
      this.client.on('connect', () => {
        logger.info('Redis client connecting...');
      });

      this.client.on('ready', () => {
        this.isReady = true;
        logger.info('Redis client ready');
      });

      this.client.on('error', (err) => {
        logger.error('Redis client error', err);
        this.isReady = false;
      });

      this.client.on('end', () => {
        logger.warn('Redis client connection closed');
        this.isReady = false;
      });

      this.client.on('reconnecting', () => {
        logger.info('Redis client reconnecting...');
      });

      await this.client.connect();

      return this.client;
    } catch (error) {
      logger.error('Failed to connect to Redis', error);
      // Don't exit process, allow app to run without cache
      return null;
    }
  }

  async disconnect() {
    try {
      if (this.client) {
        await this.client.quit();
        logger.info('Redis client disconnected gracefully');
      }
    } catch (error) {
      logger.error('Error disconnecting from Redis', error);
      throw error;
    }
  }

  getClient() {
    return this.client;
  }

  isClientReady() {
    return this.isReady;
  }
}

module.exports = new RedisClient();
