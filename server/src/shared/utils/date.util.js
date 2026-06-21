class DateUtil {
  static addMinutes(date, minutes) {
    return new Date(date.getTime() + minutes * 60000);
  }

  static addHours(date, hours) {
    return new Date(date.getTime() + hours * 3600000);
  }

  static addDays(date, days) {
    return new Date(date.getTime() + days * 86400000);
  }

  static isExpired(date) {
    return new Date() > new Date(date);
  }

  static formatDate(date, format = 'YYYY-MM-DD') {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');

    return format
      .replace('YYYY', year)
      .replace('MM', month)
      .replace('DD', day)
      .replace('HH', hours)
      .replace('mm', minutes)
      .replace('ss', seconds);
  }

  static getTimestamp() {
    return Date.now();
  }

  static parseExpiryString(expiryString) {
    const units = {
      s: 1000,
      m: 60000,
      h: 3600000,
      d: 86400000,
    };

    const match = expiryString.match(/^(\d+)([smhd])$/);
    if (!match) {
      throw new Error('Invalid expiry format');
    }

    const [, value, unit] = match;
    return parseInt(value, 10) * units[unit];
  }

  static getExpiryDate(expiryString) {
    const milliseconds = this.parseExpiryString(expiryString);
    return new Date(Date.now() + milliseconds);
  }
}

module.exports = DateUtil;
