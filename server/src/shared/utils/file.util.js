const fs = require('fs').promises;
const path = require('path');

class FileUtil {
  static async exists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  static async createDirectory(dirPath) {
    try {
      await fs.mkdir(dirPath, { recursive: true });
      return true;
    } catch (error) {
      throw error;
    }
  }

  static async deleteFile(filePath) {
    try {
      if (await this.exists(filePath)) {
        await fs.unlink(filePath);
        return true;
      }
      return false;
    } catch (error) {
      throw error;
    }
  }

  static async moveFile(sourcePath, destPath) {
    try {
      await fs.rename(sourcePath, destPath);
      return true;
    } catch (error) {
      throw error;
    }
  }

  static async copyFile(sourcePath, destPath) {
    try {
      await fs.copyFile(sourcePath, destPath);
      return true;
    } catch (error) {
      throw error;
    }
  }

  static async getFileSize(filePath) {
    try {
      const stats = await fs.stat(filePath);
      return stats.size;
    } catch (error) {
      throw error;
    }
  }

  static getExtension(filename) {
    return path.extname(filename).toLowerCase();
  }

  static getFilename(filePath) {
    return path.basename(filePath);
  }

  static sanitizeFilename(filename) {
    return filename.replace(/[^a-zA-Z0-9.-]/g, '_');
  }

  static formatFileSize(bytes) {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${Math.round(bytes / Math.pow(1024, i) * 100) / 100} ${sizes[i]}`;
  }

  static isValidPDF(mimetype) {
    return mimetype === 'application/pdf';
  }
}

module.exports = FileUtil;
