class PaginationUtil {
  static paginate(page = 1, limit = 10) {
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);

    const skip = (pageNum - 1) * limitNum;

    return {
      page: pageNum,
      limit: limitNum,
      skip,
    };
  }

  static getPaginationMeta(total, page, limit) {
    const totalPages = Math.ceil(total / limit);
    const hasMore = page < totalPages;

    return {
      page,
      limit,
      total,
      totalPages,
      hasMore,
    };
  }

  static getDefaultPagination() {
    return {
      page: 1,
      limit: 10,
    };
  }
}

module.exports = PaginationUtil;
