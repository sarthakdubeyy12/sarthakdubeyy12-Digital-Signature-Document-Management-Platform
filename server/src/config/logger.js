const config = require('./index');

const loggerConfig = {
  level: config.logging.level,
  errorFile: config.logging.errorFile,
  combinedFile: config.logging.combinedFile,
  auditFile: config.logging.auditFile,
  datePattern: 'YYYY-MM-DD',
  maxSize: '20m',
  maxFiles: '14d',
  format: 'json',
};

module.exports = loggerConfig;
