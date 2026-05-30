import express from 'express';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { getArticlesByKeywords, getArticles } from '../controllers/article.controller.js';

const router = express.Router();

/**
 * @swagger
 * /api/v1/articles:
 *   get:
 *     summary: Lấy danh sách bài báo toàn hệ thống (Public)
 *     description: >
 *       Trả về danh sách bài báo trên toàn hệ thống, hỗ trợ phân trang và tìm kiếm theo tiêu đề.
 *       Nếu truyền tham số `keywords`, API sẽ chuyển sang chế độ tìm theo từ khóa (yêu cầu xác thực).
 *     tags:
 *       - Article
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Số trang hiện tại
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 10
 *         description: Số lượng bài báo mỗi trang
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Tìm kiếm bài báo theo tiêu đề (không phân biệt hoa/thường)
 *         example: cancer
 *     responses:
 *       200:
 *         description: Lấy danh sách bài báo thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Lấy danh sách bài báo thành công"
 *                 data:
 *                   type: object
 *                   properties:
 *                     items:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           article_id:
 *                             type: integer
 *                             example: 42
 *                           title:
 *                             type: string
 *                             example: "Global cancer statistics 2022"
 *                           abstract:
 *                             type: string
 *                             example: "This article presents..."
 *                           publication_year:
 *                             type: integer
 *                             example: 2025
 *                           doi:
 *                             type: string
 *                             example: "10.1234/example"
 *                           journal:
 *                             type: object
 *                             nullable: true
 *                             properties:
 *                               journal_id:
 *                                 type: integer
 *                                 example: 5
 *                               display_name:
 *                                 type: string
 *                                 example: "CA: A Cancer Journal for Clinicians"
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         page:
 *                           type: integer
 *                           example: 1
 *                         limit:
 *                           type: integer
 *                           example: 10
 *                         total:
 *                           type: integer
 *                           example: 100
 *       400:
 *         description: Tham số phân trang không hợp lệ
 *       500:
 *         description: Lỗi server
 */

/**
 * @swagger
 * /api/v1/articles:
 *   get:
 *     summary: Tìm bài báo theo từ khóa trên toàn hệ thống (Yêu cầu xác thực)
 *     description: Trả về danh sách bài báo chứa các từ khóa mà người dùng nhập qua query string
 *     tags:
 *       - Article
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: keywords
 *         required: true
 *         schema:
 *           type: string
 *         description: Danh sách keyword cách nhau bởi dấu phẩy
 *         example: Machine Learning,Deep Learning
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Số bài tối đa mỗi trang
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Trang hiện tại
 *     responses:
 *       200:
 *         description: Thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     articles:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           article_id:
 *                             type: integer
 *                           title:
 *                             type: string
 *                           abstract:
 *                             type: string
 *                           publication_year:
 *                             type: integer
 *                           doi:
 *                             type: string
 *                           matched_keyword:
 *                             type: string
 *                           keyword_score:
 *                             type: number
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                         page:
 *                           type: integer
 *                         limit:
 *                           type: integer
 *                         total_pages:
 *                           type: integer
 *       400:
 *         description: Thiếu tham số keywords
 *       401:
 *         description: Chưa xác thực hoặc token không hợp lệ
 *       500:
 *         description: Lỗi server
 */

/**
 * Route GET /api/v1/articles
 * - Nếu có query param `keywords` → tìm theo keyword (cần auth)
 * - Nếu không → liệt kê bài báo toàn hệ thống (public)
 */
router.get('/', (req, res, next) => {
    if (req.query.keywords) {
        // Có keywords → yêu cầu auth rồi gọi getArticlesByKeywords
        return requireAuth(req, res, () => getArticlesByKeywords(req, res));
    }
    // Không có keywords → public, gọi getArticles
    return getArticles(req, res);
});

export default router;
