import keywordService from "../services/keyword.service.js";
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

export default { getTrendingKeywords };
