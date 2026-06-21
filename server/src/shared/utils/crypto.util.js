const crypto = require('crypto');

class CryptoUtil {
  static generateRandomToken(length = 32) {
    return crypto.randomBytes(length).toString('hex');
  }

  static generateVerificationCode() {
    return crypto.randomBytes(16).toString('hex');
  }

  static hashSHA256(data) {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  static generateUUID() {
    return crypto.randomUUID();
  }

  static encrypt(text, key) {
    const algorithm = 'aes-256-cbc';
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(algorithm, Buffer.from(key, 'hex'), iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return `${iv.toString('hex')}:${encrypted}`;
  }

  static decrypt(encryptedData, key) {
    const algorithm = 'aes-256-cbc';
    const [ivHex, encrypted] = encryptedData.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv(algorithm, Buffer.from(key, 'hex'), iv);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }
}

module.exports = CryptoUtil;
