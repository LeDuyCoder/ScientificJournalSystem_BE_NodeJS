import {
  getTrendingKeywords as getTrendingKeywordsService,
  getWatchedKeywordArticles as getWatchedKeywordArticlesService,
  syncWatchedKeywords,
  validateKeywordIds,
  checkProjectOwnership,
  removeWatchedKeyword,
  replaceWatchedKeywords,
  addWatchedKeyword,
} from "../services/keyword.service.js";
import logger from "../utils/logger.js";

/**
 * API Lấy Top 20 từ khóa trending của project
 * @param {Object} req - Express request object
 * @param {Object} req.params - Các tham số trên URL
 * @param {string} req.params.id - ID của project
 * @param {Object} req.query - Query params (limit, sort_by)
 * @param {Object} res - Express response object
 * @returns {Promise<Object>} JSON response chứa danh sách keywords trending
 */
export const getTrendingKeywords = async (req, res) => {
  try {
    // Lấy projectId từ URL và chuyển sang số nguyên
    const projectId = parseInt(req.params.id);

    // Kiểm tra projectId có hợp lệ không
    if (isNaN(projectId) || projectId <= 0) {
      return res.status(400).json({
        success: false,
        message: "ID dự án không hợp lệ",
      });
    }

    // Gọi service xử lý logic
    const result = await getTrendingKeywordsService(
      projectId,
      req.query,
    );

    return res.status(200).json({
      success: true,
      message: "Lấy danh sách từ khóa trending thành công",
      data: result,
    });
  } catch (error) {
    logger.error("[Keyword Controller] Lỗi khi lấy trending keywords:", error);
    return res.status(500).json({
      success: false,
      message: "Có lỗi xảy ra ở server khi lấy trending keywords",
    });
  }
};

/**
 * API Lấy luồng bài báo mới nhất từ các từ khóa đang theo dõi
 * @param {Object} req - Express request object
 * @param {Object} req.params - Các tham số trên URL
 * @param {string} req.params.id - ID của project
 * @param {Object} req.user - Thông tin user từ JWT token
 * @param {string} req.user.user_id - ID của user
 * @param {Object} req.query - Query params (page, limit)
 * @param {Object} res - Express response object
 * @returns {Promise<Object>} JSON response chứa danh sách bài báo
 */
export const getWatchedKeywordArticles = async (req, res) => {
  try {
    // Lấy projectId từ URL
    const projectId = parseInt(req.params.id);

    // Kiểm tra projectId có hợp lệ không
    if (isNaN(projectId) || projectId <= 0) {
      return res.status(400).json({
        success: false,
        message: "ID dự án không hợp lệ",
      });
    }

    // Lấy userId từ JWT token (đã được decode bởi requireAuth)
    const userId = req.user.user_id;

    // Gọi service xử lý logic
    const result = await getWatchedKeywordArticlesService(
      projectId,
      userId,
      req.query,
    );

    return res.status(200).json({
      success: true,
      message: "Lấy luồng bài báo từ từ khóa theo dõi thành công",
      data: result.data,
      pagination: {
        page: result.page,
        limit: result.limit,
      },
    });
  } catch (error) {
    if (error.statusCode === 400) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
    logger.error(
      "[Keyword Controller] Lỗi khi lấy watched keyword articles:",
      error,
    );
    return res.status(500).json({
      success: false,
      message: "Có lỗi xảy ra ở server khi lấy bài báo theo dõi",
    });
  }
};


/**
 * Thêm/đồng bộ danh sách từ khóa theo dõi cho một Project
 *
 * Mô tả: Nhận `keyword_ids` (mảng số nguyên) trong `req.body` và thêm những
 * keyword mới vào danh sách theo dõi của project (không xóa các keyword cũ).
 * Kiểm tra quyền sở hữu project trước khi thao tác.
 *
 * @param {import('express').Request} req - Express request
 * @param {Object} req.params - Tham số URL
 * @param {string|number} req.params.id - ID project
 * @param {Object} req.body - Body request
 * @param {number[]} req.body.keyword_ids - Mảng các keyword_id (số nguyên dương)
 * @param {import('express').Response} res - Express response
 * @returns {Promise<import('express').Response>} JSON response
 *
 * Responses:
 * - 201: Cập nhật danh sách từ khóa theo dõi thành công
 * - 400: Dữ liệu đầu vào không hợp lệ (ID không hợp lệ, keyword_ids không phải mảng, hoặc giá trị bên trong không phải số nguyên dương)
 * - 404: Project không tồn tại hoặc không thuộc quyền sở hữu
 * - 500: Lỗi server
 */
export const watchKeywords = async (req, res) => {
  try {
    const projectId = parseInt(req.params.id);
    const { keyword_id } = req.body || {};

    // Thêm mới 1 keyword (middleware đã check hợp lệ và quyền sở hữu)
    const isInserted = await addWatchedKeyword(projectId, keyword_id);

    if (!isInserted) {
      return res.status(400).json({
        success: false,
        code: "ERROR_KEYWORD_ALREADY_WATCHED",
        message: "Từ khóa này đã tồn tại trong danh sách theo dõi của dự án"
      });
    }

    return res.status(201).json({
      success: true,
      code: "SUCCESS_CREATE_WATCHED_KEYWORD",
      message: "Thêm từ khóa theo dõi thành công"
    });

  } catch (error) {
    logger.error("[watchKeywords] Error:", error);
    return res.status(500).json({ 
      success: false, 
      code: "ERROR_SERVER_CREATE_WATCHED_KEYWORD",
      message: "Có lỗi xảy ra ở Server!" 
    });
  }
};

/**
 * API Xóa một từ khóa khỏi danh sách theo dõi của dự án
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const deleteWatchedKeyword = async (req, res) => {
  try {
    // Các thao tác validate (ID hợp lệ, quyền sở hữu project) đã được thực hiện ở middleware
    const projectId = parseInt(req.params.id);
    const keywordId = parseInt(req.params.keywordId);

    const isDeleted = await removeWatchedKeyword(projectId, keywordId);

    if (!isDeleted) {
      return res.status(404).json({
        success: false,
        code: "ERROR_KEYWORD_NOT_FOUND",
        message: "Từ khóa không nằm trong danh sách theo dõi của dự án"
      });
    }

    return res.status(200).json({
      success: true,
      code: "SUCCESS_DELETE_WATCHED_KEYWORD",
      message: "Đã xóa từ khóa khỏi dự án thành công"
    });
  } catch (error) {
    logger.error("[deleteWatchedKeyword] Lỗi khi xóa từ khóa theo dõi:", error);
    return res.status(500).json({
      success: false,
      code: "ERROR_SERVER_DELETE_WATCHED_KEYWORD",
      message: "Có lỗi xảy ra ở server khi xóa từ khóa"
    });
  }
};

/**
 * API Cập nhật (ghi đè) danh sách từ khóa theo dõi của dự án
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const updateWatchedKeywords = async (req, res) => {
  try {
    const projectId = parseInt(req.params.id);
    const { keyword_ids } = req.body || {};

    await replaceWatchedKeywords(projectId, keyword_ids || []);

    return res.status(200).json({
      success: true,
      code: "SUCCESS_UPDATE_WATCHED_KEYWORD",
      message: "Cập nhật danh sách từ khóa theo dõi thành công"
    });
  } catch (error) {
    logger.error("[updateWatchedKeywords] Lỗi khi cập nhật từ khóa theo dõi:", error);
    return res.status(500).json({
      success: false,
      code: "ERROR_SERVER_UPDATE_WATCHED_KEYWORD",
      message: "Có lỗi xảy ra ở server khi cập nhật từ khóa"
    });
  }
};
