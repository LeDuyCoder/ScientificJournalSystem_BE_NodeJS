import * as articleService from '../services/article.service.js';

/**
 * API Handler: Tìm kiếm bài báo dựa trên danh sách từ khóa
 * Method: GET /api/v1/articles?keywords=...&limit=...&page=...
 * @param {import('express').Request} req - Đối tượng Request của Express (chứa req.query.keywords, limit, page)
 * @param {import('express').Response} res - Đối tượng Response của Express
 * @returns {Promise<import('express').Response>} Trả về JSON chứa danh sách bài báo và thông tin phân trang
 */
export const getArticlesByKeywords = async (req, res) => {
    try {
        // 1. Lấy keywords từ query string
        const rawKeywords = req.query.keywords;

        if (!rawKeywords || rawKeywords.trim() === '') {
            return res.status(400).json({
                success: false,
                message: "Vui lòng cung cấp tham số 'keywords' trong query string! Ví dụ: ?keywords=Machine Learning,Deep Learning"
            });
        }

        // 2. Tách chuỗi thành mảng và chuẩn hoá chữ thường
        const keywords = rawKeywords
            .split(',')
            .map(kw => kw.trim().toLowerCase())
            .filter(kw => kw.length > 0);

        if (keywords.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Danh sách keyword không hợp lệ!"
            });
        }

        // 3. Phân trang
        const limit = parseInt(req.query.limit) || 20;
        const page = parseInt(req.query.page) || 1;
        const offset = (page - 1) * limit;

        // 4. Gọi service (chạy song song 2 query để nhanh hơn)
        const [articles, total] = await Promise.all([
            articleService.getArticlesByKeywords(keywords, limit, offset),
            articleService.countArticlesByKeywords(keywords)
        ]);

        // 5. Trả response
        return res.status(200).json({
            success: true,
            message: "Lấy danh sách bài báo thành công!",
            data: {
                articles: articles,
                pagination: {
                    total: total,
                    page: page,
                    limit: limit,
                    total_pages: Math.ceil(total / limit)
                }
            }
        });
    } catch (error) {
        console.error('getArticlesByKeywords error:', error);
        return res.status(500).json({
            success: false,
            message: "Có lỗi xảy ra ở Server!"
        });
    }
};
