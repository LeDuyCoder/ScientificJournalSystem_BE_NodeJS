import {
  getTrendingKeywords as getTrendingKeywordsService,
  getWatchedKeywordArticles as getWatchedKeywordArticlesService,
  syncWatchedKeywords,
  validateKeywordIds,
  checkProjectOwnership,
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


// POST /api/v1/projects/:id/keywords/watch
export const watchKeywords = async (req, res) => {
  try {
    const projectId = parseInt(req.params.id);
    if (isNaN(projectId)) {
      return res.status(400).json({ success: false, message: "ID dự án không hợp lệ" });
    }

    const { keyword_ids } = req.body || {};

    // Validate keyword_ids is an array
    if (!Array.isArray(keyword_ids)) {
      return res.status(400).json({ success: false, message: "keyword_ids phải là một mảng" });
    }

    // Validate all elements are positive integers
    if (keyword_ids.length > 0) {
      const isValid = keyword_ids.every(id => Number.isInteger(id) && id > 0);
      if (!isValid) {
        return res.status(400).json({ success: false, message: "Các phần tử trong keyword_ids phải là số nguyên dương" });
      }
    }

    // Check project ownership
    const userId = req.user.user_id;
    const isOwner = await checkProjectOwnership(projectId, userId);

    if (!isOwner) {
      return res.status(404).json({ success: false, message: "Không tìm thấy dự án hoặc bạn không có quyền truy cập dự án này" });
    }

    // Check if keywords exist
    if (keyword_ids.length > 0) {
      const keywordsExist = await validateKeywordIds(keyword_ids);
      if (!keywordsExist) {
        return res.status(400).json({ success: false, message: "Một hoặc nhiều Keyword ID không tồn tại trong hệ thống" });
      }
    }

    // Sync keywords
    await syncWatchedKeywords(projectId, keyword_ids);

    return res.status(201).json({
      success: true,
      message: "Cập nhật danh sách từ khóa theo dõi thành công"
    });

  } catch (error) {
    console.error("[watchKeywords] Error:", error);
    return res.status(500).json({ success: false, message: "Có lỗi xảy ra ở Server!" });
  }
};


