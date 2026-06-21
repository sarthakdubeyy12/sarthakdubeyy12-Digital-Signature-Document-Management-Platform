const { ValidationError } = require('../errors');

class ValidatorUtil {
  static isEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static isStrongPassword(password) {
    // At least 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special character
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password);
  }

  static isValidObjectId(id) {
    return /^[0-9a-fA-F]{24}$/.test(id);
  }

  static isValidUUID(uuid) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }

  static validateRequired(fields, data) {
    const errors = [];

    fields.forEach((field) => {
      if (!data[field]) {
        errors.push({
          field,
          message: `${field} is required`,
        });
      }
    });

    if (errors.length > 0) {
      throw new ValidationError('Validation failed', errors);
    }
  }

  static validateEmail(email) {
    if (!this.isEmail(email)) {
      throw new ValidationError('Invalid email format');
    }
  }

  static validatePassword(password) {
    if (!this.isStrongPassword(password)) {
      throw new ValidationError(
        'Password must be at least 8 characters with uppercase, lowercase, number and special character'
      );
    }
  }

  static validatePagination(page, limit) {
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);

    if (isNaN(pageNum) || pageNum < 1) {
      throw new ValidationError('Invalid page number');
    }

    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      throw new ValidationError('Invalid limit (must be between 1 and 100)');
    }

    return { page: pageNum, limit: limitNum };
  }
}

module.exports = ValidatorUtil;
