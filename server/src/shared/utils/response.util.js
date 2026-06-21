const { HTTP_STATUS } = require('../constants');

class ResponseUtil {
  static success(res, data = null, message = 'Success', statusCode = 200) {
    const response = {
      success: true,
      message,
      ...(data && { data }),
    };

    return res.status(statusCode).json(response);
  }

  static error(res, message = 'Error', statusCode = 500, errors = null) {
    const response = {
      success: false,
      message,
      ...(errors && { errors }),
    };

    return res.status(statusCode).json(response);
  }

  static paginated(res, data, pagination, message = 'Success') {
    const response = {
      success: true,
      message,
      data,
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total: pagination.total,
        totalPages: pagination.totalPages,
        hasMore: pagination.hasMore,
      },
    };

    return res.status(200).json(response);
  }

  static created(res, data = null, message = 'Created successfully') {
    return this.success(res, data, message, 201);
  }

  static noContent(res) {
    return res.status(204).send();
  }
}

module.exports = ResponseUtil;
