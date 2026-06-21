const config = require('./index');

const redisConfig = {
  socket: {
    host: config.redis.host,
    port: config.redis.port,
  },
  password: config.redis.password,
  database: config.redis.db,
  retryStrategy: config.redis.retryStrategy,
};

module.exports = redisConfig;
