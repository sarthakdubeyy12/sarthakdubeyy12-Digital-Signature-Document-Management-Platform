const mongoose = require('mongoose');
const databaseConfig = require('../config/database');
const logger = require('../services/logger/logger.service');

class DatabaseConnection {
  constructor() {
    this.connection = null;
  }

  async connect() {
    try {
      // Mongoose connection events
      mongoose.connection.on('connected', () => {
        logger.info('MongoDB connected successfully');
      });

      mongoose.connection.on('error', (err) => {
        logger.error('MongoDB connection error', err);
      });

      mongoose.connection.on('disconnected', () => {
        logger.warn('MongoDB disconnected');
      });

      // Connect to MongoDB
      this.connection = await mongoose.connect(databaseConfig.uri, databaseConfig.options);

      logger.info(`MongoDB connected to: ${this.connection.connection.host}`);

      return this.connection;
    } catch (error) {
      logger.error('Failed to connect to MongoDB', error);
      process.exit(1);
    }
  }

  async disconnect() {
    try {
      await mongoose.connection.close();
      logger.info('MongoDB disconnected gracefully');
    } catch (error) {
      logger.error('Error disconnecting from MongoDB', error);
      throw error;
    }
  }

  getConnection() {
    return this.connection;
  }

  isConnected() {
    return mongoose.connection.readyState === 1;
  }
}

module.exports = new DatabaseConnection();
