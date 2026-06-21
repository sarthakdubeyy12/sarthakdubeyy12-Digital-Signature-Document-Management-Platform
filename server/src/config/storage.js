const path = require('path');
const config = require('./index');

const storageConfig = {
  type: config.storage.type,
  
  local: {
    basePath: path.resolve(config.storage.localPath),
    paths: {
      documents: {
        original: path.join(config.storage.localPath, 'documents', 'original'),
        signed: path.join(config.storage.localPath, 'documents', 'signed'),
      },
      signatures: path.join(config.storage.localPath, 'signatures'),
      temp: path.join(config.storage.localPath, 'temp'),
    },
  },
  
  s3: {
    accessKeyId: config.storage.s3.accessKeyId,
    secretAccessKey: config.storage.s3.secretAccessKey,
    region: config.storage.s3.region,
    bucket: config.storage.s3.bucket,
    paths: {
      documents: {
        original: 'documents/original',
        signed: 'documents/signed',
      },
      signatures: 'signatures',
      temp: 'temp',
    },
  },
};

module.exports = storageConfig;
