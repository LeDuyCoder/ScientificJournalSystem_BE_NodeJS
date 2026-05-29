import * as authorService from "../services/author.service.js";

export const authorServiceRef = { ...authorService };


/**
 * Lấy phân tích lĩnh vực nghiên cứu của một tác giả cùng thông tin tác giả.
 *
 * - Kiểm tra `req.params.id` là số nguyên hợp lệ (> 0).
 * - Gọi service để lấy thông tin tác giả và phân tích các lĩnh vực nghiên cứu.
 * - Trả về JSON chứa thông tin tác giả và trường `breakdown` (mảng/obj do service trả về).
 *
 * @param {import('express').Request} req - Express request object. Dùng `req.params.id`.
 * @param {import('express').Response} res - Express response object.
 * @returns {Promise<import('express').Response>} Response HTTP: 200 khi thành công,
 * 400 khi ID không hợp lệ, 500 khi có lỗi phía server.
 */
export const getAuthorAreasBreakdown = async (req, res) => {
    try {

        const authorId = Number(req.params.id);

        if (!Number.isInteger(authorId) || authorId <= 0) {
            return res.status(400).json({
                success: false,
                message: 'ID tác giả không hợp lệ'
            });
        }

        //call service
        const authorInfo = await authorServiceRef.getAuthorById(authorId);
        const areasBreakdown = await authorServiceRef.getAuthorAreasBreakdownService(authorId);
        
        
        // 5. Trả response
        return res.status(200).json({
            success: true,
            message: "Phân tích lĩnh vực nghiên cứu của tác giả thành công",
            data: {
                ...authorInfo,
                "breakdown": areasBreakdown
            }
        });
    } catch (error) {
        console.error('getArticlesByKeywords error:', error);
        return res.status(500).json({
            success: false,
            message: "Có lỗi xảy ra ở Server!"
        });
    }
}

/**
 * Lấy danh sách bài viết của một tác giả với thông tin phân trang cơ bản.
 *
 * - Kiểm tra `req.params.id` là số nguyên hợp lệ (> 0).
 * - Kiểm tra `req.query.limit` và `req.query.page` là số hợp lệ.
 * - Gọi service để lấy danh sách bài viết và trả về cùng object `pagination`.
 *
 * @param {import('express').Request} req - Express request object. Sử dụng
 * `req.params.id`, `req.query.limit`, `req.query.page`.
 * @param {import('express').Response} res - Express response object.
 * @returns {Promise<import('express').Response>} Response HTTP: 200 khi thành công,
 * 400 khi input không hợp lệ, 500 khi có lỗi phía server.
 */
export const getAuthorArticles = async (req, res) => {
    try {
        const authorId = Number(req.params.id);
        const limit = Number(req.query.limit) || 0;
        const page = Number(req.query.page) || 1;
        

        if (!Number.isInteger(authorId) || authorId <= 0) {
            return res.status(400).json({
                success: false,
                message: 'ID tác giả không hợp lệ'
            });
        }

        if (!Number.isInteger(limit) || limit < 0) {
            return res.status(400).json({
                success: false,
                message: 'Giá trị limit không hợp lệ'
            });
        }

        if (!Number.isInteger(page) || page < 1) {
            return res.status(400).json({
                success: false,
                message: 'Giá trị page không hợp lệ'
            });
        }

        const articles = await authorServiceRef.getAuthorArticlesService(authorId);

        return res.status(200).json({
            success: true,
            message: "Lấy bài viết của tác giả thành công",
            pagination: {
                page,
                limit,
                total: articles.length,
            },
            data: [...articles]
        });
    } catch (error) {
        logger.error('Lỗi lấy bài viết của tác giả:', error);
        return res.status(500).json({
            success: false,
            message: "Có lỗi xảy ra ở Server!"
        });
    }
}