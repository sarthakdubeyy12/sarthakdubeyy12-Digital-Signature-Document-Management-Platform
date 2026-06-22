const { ValidationError } = require('../shared/errors');
const logger = require('../services/logger/logger.service');

const validate = (schema) => {
  return async (req, res, next) => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });

      next();
    } catch (error) {
      logger.warn('Validation failed', {
        path: req.path,
        errors: error.errors,
      });

      const errors = error.errors?.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));

      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors,
      });
    }
  };
};

module.exports = {
  validate,
};
