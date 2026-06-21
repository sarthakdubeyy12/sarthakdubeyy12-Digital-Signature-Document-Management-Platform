const bcrypt = require('bcryptjs');

class HashUtil {
  static async hash(value, rounds = 10) {
    return bcrypt.hash(value, rounds);
  }

  static async compare(value, hash) {
    return bcrypt.compare(value, hash);
  }

  static async hashPassword(password) {
    return this.hash(password, 10);
  }

  static async verifyPassword(password, hash) {
    return this.compare(password, hash);
  }
}

module.exports = HashUtil;
