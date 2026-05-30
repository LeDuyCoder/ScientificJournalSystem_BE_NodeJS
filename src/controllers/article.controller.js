import * as articleService from '../services/article.service.js';
import logger from '../utils/logger.js';

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


/**
 * API Handler: Lấy tất cả bài báo theo phân trang
 * Method: GET /api/v1/articles?limit=...&page=...&sortBy=...&sortOrder=...
 * @param {import('express').Request} req - Đối tượng Request của Express (chứa req.query.limit, req.query.page, req.query.sortBy, req.query.sortOrder)
 * @param {import('express').Response} res - Đối tượng Response của Express
 * @returns {Promise<import('express').Response>} Trả về JSON chứa danh sách bài báo và thông tin phân trang cơ bản
 */
export const getAllArticles = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 20;
        const page = parseInt(req.query.page) || 1;
        const offset = (page - 1) * limit;
        const sortBy = req.query.sortBy || 'created_at';
        const sortOrder = (req.query.sortOrder || 'DESC').toUpperCase();

        // Validate sortOrder
        if (!['ASC', 'DESC'].includes(sortOrder)) {
            return res.status(400).json({
                success: false,
                message: "Tham số 'sortOrder' phải là 'asc' hoặc 'desc'!"
            });
        }

        const articles = await articleService.getAllArticles(limit, offset, sortBy, sortOrder);
        const total = await articleService.getTotalArticles();

        return res.status(200).json({
            success: true,
            message: "Lấy danh sách bài báo thành công!",
            data: {
                articles: articles,
                pagination: {
                    page: page,
                    limit: limit,
                    total: total,
                    total_pages: Math.ceil(total / limit)
                }
            }
        });
    } catch (error) {
        logger.error('Lỗi khi lấy tất cả bài báo:', error);
        return res.status(500).json({
            success: false,
            message: "Có lỗi xảy ra ở Server!"
        });
    }
}


/**
 * API Router Handler: Chuyển tiếp giữa tìm kiếm theo keyword và lấy toàn bộ bài báo.
 * Nếu query string không chứa `keywords` hoặc giá trị rỗng, sẽ trả về toàn bộ bài báo.
 * Ngược lại, sẽ gọi hàm tìm kiếm bài báo theo danh sách keywords.
 * @param {import('express').Request} req - Đối tượng Request của Express (chứa req.query.keywords, limit, page)
 * @param {import('express').Response} res - Đối tượng Response của Express
 * @returns {Promise<import('express').Response>} Trả về JSON từ `getAllArticles` hoặc `getArticlesByKeywords`
 */
export const getArticle = async (req, res) => {
    const rawKeywords = req.query.keywords;
    if (!rawKeywords || rawKeywords.trim() === '') {
        return getAllArticles(req, res);
    } else {
        return getArticlesByKeywords(req, res);
    }
}