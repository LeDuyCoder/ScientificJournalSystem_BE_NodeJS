import keywordService from "../services/keyword.service.js";
import logger from "../utils/logger.js";

export const keywordServiceRef = { ...keywordService };

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
    const result = await keywordServiceRef.getTrendingKeywords(
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
    const result = await keywordServiceRef.getWatchedKeywordArticles(
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
