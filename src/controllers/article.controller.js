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

/**
 * API Handler: Lấy danh sách bài báo toàn hệ thống (Public)
 * Method: GET /api/v1/articles?page=...&limit=...&search=...
 * @param {import('express').Request} req - Đối tượng Request (chứa req.query.page, limit, search)
 * @param {import('express').Response} res - Đối tượng Response
 * @returns {Promise<import('express').Response>} JSON chứa danh sách bài báo và thông tin phân trang
 */
export const getArticles = async (req, res) => {
    try {
        // 1. Phân trang
        let page = 1;
        let limit = 10;

        if (req.query.page !== undefined) {
            page = Number(req.query.page);
            if (!Number.isInteger(page) || page <= 0) {
                return res.status(400).json({
                    success: false,
                    message: "page phải là số nguyên dương."
                });
            }
        }

        if (req.query.limit !== undefined) {
            limit = Number(req.query.limit);
            if (!Number.isInteger(limit) || limit <= 0) {
                return res.status(400).json({
                    success: false,
                    message: "limit phải là số nguyên dương."
                });
            }
        }

        const offset = (page - 1) * limit;

        // 2. Lấy search query (có thể rỗng)
        const search = (req.query.search || '').trim();

        // 3. Gọi service song song
        const [articles, total] = await Promise.all([
            articleService.getAllArticles({ limit, offset, search }),
            articleService.countAllArticles({ search })
        ]);

        // 4. Trả response
        return res.status(200).json({
            success: true,
            message: "Lấy danh sách bài báo thành công",
            data: {
                items: articles.map(a => ({
                    article_id: a.article_id,
                    title: a.title,
                    abstract: a.abstract,
                    publication_year: a.publication_year,
                    doi: a.doi,
                    journal: a.journal_id ? {
                        journal_id: a.journal_id,
                        display_name: a.journal_name
                    } : null
                })),
                pagination: {
                    page,
                    limit,
                    total
                }
            }
        });
    } catch (error) {
        console.error('getArticles error:', error);
        return res.status(500).json({
            success: false,
            message: "Có lỗi xảy ra ở Server!"
        });
    }
};
