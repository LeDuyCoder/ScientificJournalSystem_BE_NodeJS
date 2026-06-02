import {
  getTrendingKeywords as getTrendingKeywordsService,
  getWatchedKeywordArticles as getWatchedKeywordArticlesService,
  syncWatchedKeywords,
  validateKeywordIds,
  checkProjectOwnership,
  getKeywordById,
  getAllKeywords,
  createKeyword,
  updateKeyword,
  deleteKeyword,
  restoreKeyword,
} from "../services/keyword.service.js";
import logger from "../utils/logger.js";

/**
 * Validate display_name cho keyword
 * @param {string} display_name
 * @returns {string|null} message lỗi nếu không hợp lệ, null nếu hợp lệ
 */
const validateDisplayName = (display_name) => {
  if (!display_name) return "Tên keyword không được để trống";
  if (display_name.length < 2) return "Tên keyword phải có ít nhất 2 ký tự";
  if (display_name.length > 255)
    return "Tên keyword không được vượt quá 255 ký tự";
  if (/[!@#$%^&*()_+={}\[\]|\\:;"'<>,?\/~`]/.test(display_name))
    return "Tên keyword không được chứa ký tự đặc biệt";
  if (/<[^>]*>/.test(display_name))
    return "Tên keyword không được chứa HTML hoặc script";
  return null;
};
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
    const result = await getTrendingKeywordsService(projectId, req.query);

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
    if (isNaN(projectId)) {
      return res
        .status(400)
        .json({ success: false, message: "ID dự án không hợp lệ" });
    }

    const { keyword_ids } = req.body || {};

    // Validate keyword_ids is an array
    if (!Array.isArray(keyword_ids)) {
      return res
        .status(400)
        .json({ success: false, message: "keyword_ids phải là một mảng" });
    }

    // Validate all elements are positive integers
    if (keyword_ids.length > 0) {
      const isValid = keyword_ids.every((id) => Number.isInteger(id) && id > 0);
      if (!isValid) {
        return res.status(400).json({
          success: false,
          message: "Các phần tử trong keyword_ids phải là số nguyên dương",
        });
      }
    }

    // Check project ownership
    const userId = req.user.user_id;
    const isOwner = await checkProjectOwnership(projectId, userId);

    if (!isOwner) {
      return res.status(404).json({
        success: false,
        message:
          "Không tìm thấy dự án hoặc bạn không có quyền truy cập dự án này",
      });
    }

    // Check if keywords exist
    if (keyword_ids.length > 0) {
      const keywordsExist = await validateKeywordIds(keyword_ids);
      if (!keywordsExist) {
        return res.status(400).json({
          success: false,
          message: "Một hoặc nhiều Keyword ID không tồn tại trong hệ thống",
        });
      }
    }

    // Sync keywords
    await syncWatchedKeywords(projectId, keyword_ids);

    return res.status(201).json({
      success: true,
      message: "Cập nhật danh sách từ khóa theo dõi thành công",
    });
  } catch (error) {
    console.error("[watchKeywords] Error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Có lỗi xảy ra ở Server!" });
  }
};

//*********Những API liên quan tương tác trực tiếp tới Table Keyword
// Keyword Mangement*/
/**
 * GET /api/v1/keywords/:id
 * Lấy keyword theo ID
 */
export const getKeywordByIdController = async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: "ID không hợp lệ",
      });
    }

    const keyword = await getKeywordById(id);

    return res.status(200).json({
      success: true,
      message: "Lấy keyword thành công",
      data: keyword,
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }
    logger.error("[Keyword Controller] Lỗi khi lấy keyword theo ID:", error);
    return res.status(500).json({
      success: false,
      message: "Có lỗi xảy ra ở Server!",
    });
  }
};

/**
 * GET /api/v1/keywords
 * Lấy danh sách keywords với pagination và search
 */
export const getAllKeywordsController = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 10, 100);
    const search = req.query.search || "";

    const result = await getAllKeywords({ page, limit, search });

    return res.status(200).json({
      success: true,
      message: "Lấy danh sách keyword thành công",
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }
    logger.error("[Keyword Controller] Lỗi khi lấy danh sách keyword:", error);
    return res.status(500).json({
      success: false,
      message: "Có lỗi xảy ra ở Server!",
    });
  }
};

/**
 * POST /api/v1/keywords
 * Tạo mới một keyword
 */
export const createKeywordController = async (req, res) => {
  try {
    const display_name = req.body.display_name?.trim();

    const validationError = validateDisplayName(display_name);
    if (validationError) {
      return res.status(400).json({ success: false, message: validationError });
    }
    const keyword = await createKeyword(display_name);

    return res.status(201).json({
      success: true,
      message: "Tạo keyword thành công",
      data: keyword,
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }
    logger.error("[Keyword Controller] Lỗi khi tạo keyword:", error);
    return res.status(500).json({
      success: false,
      message: "Có lỗi xảy ra ở Server!",
    });
  }
};
/**
 * PUT /api/v1/keywords/:id
 * Cập nhật keyword theo ID
 */
export const updateKeywordController = async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: "ID không hợp lệ",
      });
    }

    const display_name = req.body.display_name?.trim();

    const validationError = validateDisplayName(display_name);
    if (validationError) {
      return res.status(400).json({ success: false, message: validationError });
    }

    const keyword = await updateKeyword(id, display_name);

    return res.status(200).json({
      success: true,
      message: "Cập nhật keyword thành công",
      data: keyword,
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }
    logger.error("[Keyword Controller] Lỗi khi cập nhật keyword:", error);
    return res.status(500).json({
      success: false,
      message: "Có lỗi xảy ra ở Server!",
    });
  }
};

/**
 * DELETE /api/v1/keywords/:id
 * Soft delete keyword theo ID
 */
export const deleteKeywordController = async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: "ID không hợp lệ",
      });
    }

    await deleteKeyword(id);

    return res.status(200).json({
      success: true,
      message: "Xóa keyword thành công",
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }
    logger.error("[Keyword Controller] Lỗi khi xóa keyword:", error);
    return res.status(500).json({
      success: false,
      message: "Có lỗi xảy ra ở Server!",
    });
  }
};

/**
 * PATCH /api/v1/keywords/:id/restore
 * Restore keyword đã bị soft delete
 */
export const restoreKeywordController = async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: "ID không hợp lệ",
      });
    }

    const keyword = await restoreKeyword(id);

    return res.status(200).json({
      success: true,
      message: "Khôi phục keyword thành công",
      data: keyword,
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }
    logger.error("[Keyword Controller] Lỗi khi restore keyword:", error);
    return res.status(500).json({
      success: false,
      message: "Có lỗi xảy ra ở Server!",
    });
  }
};
