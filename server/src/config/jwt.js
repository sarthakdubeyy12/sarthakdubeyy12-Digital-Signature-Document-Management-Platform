const config = require('./index');

const jwtConfig = {
  access: {
    secret: config.jwt.secret,
    expiry: config.jwt.accessExpiry,
    algorithm: 'HS256',
  },
  refresh: {
    secret: config.jwt.refreshSecret,
    expiry: config.jwt.refreshExpiry,
    algorithm: 'HS256',
  },
};

module.exports = jwtConfig;
