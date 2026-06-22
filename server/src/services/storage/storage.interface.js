/**
 * Storage Interface
 * Abstract interface for storage operations
 * Allows switching between local filesystem, S3, etc.
 */
class StorageInterface {
  /**
   * Save file to storage
   * @param {Buffer} fileBuffer - File content as buffer
   * @param {string} filename - Destination filename
   * @param {string} directory - Storage directory
   * @returns {Promise<string>} - File path or URL
   */
  async saveFile(fileBuffer, filename, directory) {
    throw new Error('Method not implemented');
  }

  /**
   * Get file from storage
   * @param {string} filePath - File path or key
   * @returns {Promise<Buffer>} - File content as buffer
   */
  async getFile(filePath) {
    throw new Error('Method not implemented');
  }

  /**
   * Delete file from storage
   * @param {string} filePath - File path or key
   * @returns {Promise<boolean>} - Success status
   */
  async deleteFile(filePath) {
    throw new Error('Method not implemented');
  }

  /**
   * Check if file exists
   * @param {string} filePath - File path or key
   * @returns {Promise<boolean>} - Exists status
   */
  async fileExists(filePath) {
    throw new Error('Method not implemented');
  }

  /**
   * Get file size
   * @param {string} filePath - File path or key
   * @returns {Promise<number>} - File size in bytes
   */
  async getFileSize(filePath) {
    throw new Error('Method not implemented');
  }

  /**
   * Get storage type identifier
   * @returns {string} - Storage type (local, s3, etc.)
   */
  getStorageType() {
    throw new Error('Method not implemented');
  }
}

module.exports = StorageInterface;
