import keywordService from "../services/keyword.service.js";
import pool from "../config/database.js";

export const keywordServiceRef = keywordService;
// Xử lý request GET /api/v1/projects/:id/keywords/trending
const getTrendingKeywords = async (req, res) => {
  try {
    // Lấy projectId từ URL và chuyển sang số nguyên
    // VD: /projects/1/keywords/trending → projectId = 1
    const projectId = parseInt(req.params.id);

    // Kiểm tra projectId có hợp lệ không
    // VD: /projects/abc → parseInt("abc") = NaN → trả về lỗi 400
    if (isNaN(projectId)) {
      return res.status(400).json({ error: "Invalid project ID" });
    }

    // Gọi service xử lý logic, truyền vào:
    // - projectId: id của project cần lấy keyword
    // - req.query: các query params (limit, sort_by)
    const result = await keywordService.getTrendingKeywords(
      projectId,
      req.query,
    );

    // Trả về kết quả thành công
    return res.status(200).json(result);
  } catch (error) {
    // Có lỗi không mong muốn → log ra terminal và trả về lỗi 500
    console.error("[getTrendingKeywords] Error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * API Handler: Cập nhật danh sách từ khóa theo dõi của một dự án
 * Method: POST /api/v1/projects/:id/keywords/watch
 * @param {import('express').Request} req - Đối tượng Request của Express (chứa req.params.id, req.body.keyword_ids, req.user)
 * @param {import('express').Response} res - Đối tượng Response của Express
 * @returns {Promise<import('express').Response>} Trả về JSON thông báo kết quả cập nhật
 */
const watchKeywords = async (req, res) => {
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
    const projectCheck = await pool.query(
      `SELECT 1 FROM "Project" WHERE project_id = $1 AND user_id = $2`,
      [projectId, userId]
    );

    if (projectCheck.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Không tìm thấy dự án hoặc bạn không có quyền truy cập dự án này" });
    }

    // Check if keywords exist
    if (keyword_ids.length > 0) {
      const keywordsExist = await keywordService.validateKeywordIds(keyword_ids);
      if (!keywordsExist) {
        return res.status(400).json({ success: false, message: "Một hoặc nhiều Keyword ID không tồn tại trong hệ thống" });
      }
    }

    // Sync keywords
    await keywordService.syncWatchedKeywords(projectId, keyword_ids);

    return res.status(201).json({
      success: true,
      message: "Cập nhật danh sách từ khóa theo dõi thành công"
    });

  } catch (error) {
    console.error("[watchKeywords] Error:", error);
    return res.status(500).json({ success: false, message: "Có lỗi xảy ra ở Server!" });
  }
};

export default { getTrendingKeywords, watchKeywords };
