import express from 'express';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { getArticlesByKeywords } from '../controllers/article.controller.js';

const router = express.Router();

/**
 * @swagger
 * /api/v1/articles:
 *   get:
 *     summary: Tìm bài báo theo từ khóa trên toàn hệ thống
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
 * Tìm bài báo theo từ khóa trên toàn hệ thống (Yêu cầu xác thực)
 */
router.get('/', requireAuth, getArticlesByKeywords);

export default router;
