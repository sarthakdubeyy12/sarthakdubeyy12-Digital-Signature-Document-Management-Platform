const prisma = require('./prisma.client');
const logger = require('../services/logger/logger.service');

class DatabaseConnection {
  constructor() {
    this.connection = null;
  }

  async connect() {
    try {
      // Test Prisma connection
      await prisma.$connect();
      
      logger.info('Prisma connected to MongoDB successfully');
      
      this.connection = prisma;
      return this.connection;
    } catch (error) {
      logger.error('Failed to connect to MongoDB via Prisma', error);
      process.exit(1);
    }
  }

  async disconnect() {
    try {
      await prisma.$disconnect();
      logger.info('Prisma disconnected from MongoDB gracefully');
    } catch (error) {
      logger.error('Error disconnecting Prisma from MongoDB', error);
      throw error;
    }
  }

  getConnection() {
    return this.connection;
  }

  isConnected() {
    return this.connection !== null;
  }
}

module.exports = new DatabaseConnection();
