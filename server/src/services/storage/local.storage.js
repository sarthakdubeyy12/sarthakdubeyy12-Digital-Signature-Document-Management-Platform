const fs = require('fs').promises;
const path = require('path');
const StorageInterface = require('./storage.interface');
const config = require('../../config');
const logger = require('../logger/logger.service');
const { StorageError } = require('../../shared/errors');

/**
 * Local Filesystem Storage Implementation
 * Implements StorageInterface for local file storage
 */
class LocalStorage extends StorageInterface {
  constructor() {
    super();
    this.basePath = config.storage.localPath || './storage';
    this.initializeStorage();
  }

  /**
   * Initialize storage directories
   */
  async initializeStorage() {
    try {
      const directories = [
        path.join(this.basePath, 'documents', 'original'),
        path.join(this.basePath, 'documents', 'signed'),
        path.join(this.basePath, 'signatures'),
        path.join(this.basePath, 'temp'),
      ];

      for (const dir of directories) {
        await fs.mkdir(dir, { recursive: true });
      }

      logger.info('Local storage initialized', { basePath: this.basePath });
    } catch (error) {
      logger.error('Failed to initialize local storage', { error: error.message });
      throw new StorageError('Failed to initialize storage');
    }
  }

  /**
   * Save file to local storage
   */
  async saveFile(fileBuffer, filename, directory = 'documents/original') {
    try {
      const fullPath = path.join(this.basePath, directory, filename);
      const dir = path.dirname(fullPath);

      // Ensure directory exists
      await fs.mkdir(dir, { recursive: true });

      // Write file
      await fs.writeFile(fullPath, fileBuffer);

      logger.info('File saved to local storage', {
        filename,
        directory,
        size: fileBuffer.length,
      });

      return path.join(directory, filename);
    } catch (error) {
      logger.error('Failed to save file to local storage', {
        filename,
        error: error.message,
      });
      throw new StorageError('Failed to save file');
    }
  }

  /**
   * Get file from local storage
   */
  async getFile(filePath) {
    try {
      const fullPath = path.join(this.basePath, filePath);
      
      // Check if file exists
      await fs.access(fullPath);

      // Read file
      const fileBuffer = await fs.readFile(fullPath);

      logger.info('File retrieved from local storage', { filePath });

      return fileBuffer;
    } catch (error) {
      logger.error('Failed to get file from local storage', {
        filePath,
        error: error.message,
      });

      if (error.code === 'ENOENT') {
        throw new StorageError('File not found', 404);
      }

      throw new StorageError('Failed to retrieve file');
    }
  }

  /**
   * Delete file from local storage
   */
  async deleteFile(filePath) {
    try {
      const fullPath = path.join(this.basePath, filePath);

      // Check if file exists
      await fs.access(fullPath);

      // Delete file
      await fs.unlink(fullPath);

      logger.info('File deleted from local storage', { filePath });

      return true;
    } catch (error) {
      logger.error('Failed to delete file from local storage', {
        filePath,
        error: error.message,
      });

      if (error.code === 'ENOENT') {
        logger.warn('File not found during deletion', { filePath });
        return true; // File doesn't exist, consider it deleted
      }

      throw new StorageError('Failed to delete file');
    }
  }

  /**
   * Check if file exists
   */
  async fileExists(filePath) {
    try {
      const fullPath = path.join(this.basePath, filePath);
      await fs.access(fullPath);
      return true;
    } catch (error) {
      if (error.code === 'ENOENT') {
        return false;
      }
      throw new StorageError('Failed to check file existence');
    }
  }

  /**
   * Get file size
   */
  async getFileSize(filePath) {
    try {
      const fullPath = path.join(this.basePath, filePath);
      const stats = await fs.stat(fullPath);
      return stats.size;
    } catch (error) {
      logger.error('Failed to get file size', {
        filePath,
        error: error.message,
      });

      if (error.code === 'ENOENT') {
        throw new StorageError('File not found', 404);
      }

      throw new StorageError('Failed to get file size');
    }
  }

  /**
   * Get full file path
   */
  getFullPath(filePath) {
    return path.join(this.basePath, filePath);
  }

  /**
   * Get storage type
   */
  getStorageType() {
    return 'local';
  }

  /**
   * Get storage base path
   */
  getBasePath() {
    return this.basePath;
  }
}

// Export singleton instance
module.exports = new LocalStorage();
