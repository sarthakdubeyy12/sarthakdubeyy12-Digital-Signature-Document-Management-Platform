const mongoose = require('mongoose');
const config = require('./index');

const databaseConfig = {
  uri: config.env === 'test' ? config.mongodb.testUri : config.mongodb.uri,
  options: config.mongodb.options,
};

module.exports = databaseConfig;
