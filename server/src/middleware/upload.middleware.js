const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const config = require('../config');
const { AppError } = require('../shared/errors');

// Storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(config.storage.localPath, 'temp'));
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

// File filter
const fileFilter = (req, file, cb) => {
  const allowedTypes = config.upload.allowedTypes;

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new AppError(
        `Invalid file type. Only ${allowedTypes.join(', ')} are allowed`,
        400
      ),
      false
    );
  }
};

// Multer configuration
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: config.upload.maxFileSize,
  },
});

// Single file upload middleware
const uploadSingle = (fieldName) => upload.single(fieldName);

// Multiple files upload middleware
const uploadMultiple = (fieldName, maxCount = 10) => upload.array(fieldName, maxCount);

// Fields upload middleware
const uploadFields = (fields) => upload.fields(fields);

module.exports = {
  uploadSingle,
  uploadMultiple,
  uploadFields,
};
