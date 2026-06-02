import { checkProjectOwnership, validateKeywordIds } from "../services/keyword.service.js";

/**
 * Middleware validate các tham số và quyền cho việc xóa từ khóa theo dõi.
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
export const validateDeleteWatchedKeyword = async (req, res, next) => {
  const projectId = parseInt(req.params.id);
  const keywordId = parseInt(req.params.keywordId);

  if (isNaN(projectId) || projectId <= 0) {
    return res.status(400).json({
      success: false,
      code: "ERROR_INVALID_PROJECT_ID",
      message: "ID dự án không hợp lệ"
    });
  }

  if (isNaN(keywordId) || keywordId <= 0) {
    return res.status(400).json({ success: false, code: "ERROR_INVALID_KEYWORD_ID", message: "ID từ khóa không hợp lệ" });
  }

  const userId = req.user.user_id;
  try {
    const isOwner = await checkProjectOwnership(projectId, userId);

    if (!isOwner) {
      return res.status(404).json({ success: false, code: "ERROR_PROJECT_NOT_FOUND", message: "Không tìm thấy dự án hoặc bạn không có quyền truy cập dự án này" });
    }

    next();
  } catch (error) {
    return res.status(500).json({ success: false, code: "ERROR_SERVER_DELETE_WATCHED_KEYWORD", message: "Lỗi hệ thống khi xác thực quyền truy cập dự án" });
  }
};

/**
 * Middleware validate các tham số và quyền cho việc ghi đè (thay thế) danh sách từ khóa theo dõi.
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
export const validateUpdateWatchedKeywords = async (req, res, next) => {
  const projectId = parseInt(req.params.id);

  if (isNaN(projectId) || projectId <= 0) {
    return res.status(400).json({ success: false, code: "ERROR_INVALID_PROJECT_ID", message: "ID dự án không hợp lệ" });
  }

  const { keyword_ids } = req.body || {};

  if (!Array.isArray(keyword_ids)) {
    return res.status(400).json({ success: false, code: "ERROR_INVALID_KEYWORD_IDS", message: "keyword_ids phải là một mảng" });
  }

  if (keyword_ids.length > 0) {
    const isValid = keyword_ids.every(id => Number.isInteger(id) && id > 0);
    if (!isValid) {
      return res.status(400).json({ success: false, code: "ERROR_INVALID_KEYWORD_IDS", message: "Các phần tử trong keyword_ids phải là số nguyên dương" });
    }
  }

  const userId = req.user.user_id;
  try {
    const isOwner = await checkProjectOwnership(projectId, userId);

    if (!isOwner) {
      return res.status(404).json({ success: false, code: "ERROR_PROJECT_NOT_FOUND", message: "Không tìm thấy dự án hoặc bạn không có quyền truy cập dự án này" });
    }

    if (keyword_ids.length > 0) {
      const allExist = await validateKeywordIds(keyword_ids);
      if (!allExist) {
        return res.status(400).json({ success: false, code: "ERROR_INVALID_KEYWORD_IDS", message: "Một hoặc nhiều ID từ khóa không tồn tại trong hệ thống" });
      }
    }

    next();
  } catch (error) {
    return res.status(500).json({ success: false, code: "ERROR_SERVER_UPDATE_WATCHED_KEYWORD", message: "Lỗi hệ thống khi xác thực quyền truy cập dự án" });
  }
};

/**
 * Middleware validate các tham số và quyền cho việc tạo mới (thêm 1) từ khóa theo dõi.
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
export const validateCreateWatchedKeyword = async (req, res, next) => {
  const projectId = parseInt(req.params.id);

  if (isNaN(projectId) || projectId <= 0) {
    return res.status(400).json({ success: false, code: "ERROR_INVALID_PROJECT_ID", message: "ID dự án không hợp lệ" });
  }

  const { keyword_id } = req.body || {};

  if (!Number.isInteger(keyword_id) || keyword_id <= 0) {
    return res.status(400).json({ success: false, code: "ERROR_INVALID_KEYWORD_ID", message: "keyword_id phải là một số nguyên dương" });
  }

  const userId = req.user.user_id;
  try {
    const isOwner = await checkProjectOwnership(projectId, userId);

    if (!isOwner) {
      return res.status(404).json({ success: false, code: "ERROR_PROJECT_NOT_FOUND", message: "Không tìm thấy dự án hoặc bạn không có quyền truy cập dự án này" });
    }

    const allExist = await validateKeywordIds([keyword_id]);
    if (!allExist) {
      return res.status(400).json({ success: false, code: "ERROR_KEYWORD_NOT_FOUND", message: "ID từ khóa không tồn tại trong hệ thống" });
    }

    next();
  } catch (error) {
    return res.status(500).json({ success: false, code: "ERROR_SERVER_CREATE_WATCHED_KEYWORD", message: "Lỗi hệ thống khi xác thực quyền truy cập dự án" });
  }
};


