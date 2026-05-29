import keywordService from "../services/keyword.service.js";
export const keywordServiceRef = keywordService;
// Xử lý request GET /api/v1/projects/:id/keywords/trending
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
    // Có lỗi không mong muốn → log ra terminal và trả về lỗi 500
    console.error("[getTrendingKeywords] Error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const getWatchedKeywordArticles = async (req, res) => {
  try {
    const projectId = parseInt(req.params.id);

    if (isNaN(projectId) || projectId <= 0) {
      return res.status(400).json({
        success: false,
        message: "ID dự án không hợp lệ",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Chức năng lấy bài báo từ khóa đang theo dõi chưa được triển khai",
      data: [],
    });
  } catch (error) {
    console.error("[getWatchedKeywordArticles] Error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const watchKeywords = async (req, res) => {
  try {
    const projectId = parseInt(req.params.id);

    if (isNaN(projectId) || projectId <= 0) {
      return res.status(400).json({
        success: false,
        message: "ID dự án không hợp lệ",
      });
    }

    return res.status(501).json({
      success: false,
      message: "Chức năng cập nhật danh sách từ khóa theo dõi chưa được triển khai",
    });
  } catch (error) {
    console.error("[watchKeywords] Error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export default { getTrendingKeywords, getWatchedKeywordArticles, watchKeywords };
