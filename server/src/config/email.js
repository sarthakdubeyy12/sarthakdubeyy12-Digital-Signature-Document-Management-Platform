const config = require('./index');

const emailConfig = {
  smtp: config.email.smtp,
  from: {
    email: config.email.from,
    name: config.email.fromName,
  },
  templates: {
    welcome: 'welcome',
    passwordReset: 'passwordReset',
    documentSigned: 'documentSigned',
  },
};

module.exports = emailConfig;
