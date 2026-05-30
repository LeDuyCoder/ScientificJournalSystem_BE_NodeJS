import express from 'express';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { getArticle, getArticleById, getArticlesByKeywords } from '../controllers/article.controller.js';

const router = express.Router();

/**
 * @swagger
 * /api/v1/articles:
 *   get:
 *     summary: Tìm bài báo theo từ khóa hoặc lấy tất cả bài báo
 *     description: Trả về danh sách bài báo chứa các từ khóa nếu có, hoặc tất cả bài báo. Hỗ trợ sắp xếp và phân trang
 *     tags:
 *       - Article
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: keywords
 *         schema:
 *           type: string
 *         description: Danh sách keyword cách nhau bởi dấu phẩy (không bắt buộc)
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
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [article_id, title, publication_year, created_at, doi]
 *           default: created_at
 *         description: Trường sắp xếp
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Thứ tự sắp xếp
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
router.get('/', requireAuth, getArticle);

/**
 * @swagger
 * /api/v1/articles/{id}:
 *   get:
 *     summary: Get details article by id
 *     description: Get detailed information of an article by its `article_id`
 *     tags:
 *       - Article
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của bài báo cần lấy
 *         example: 123
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
 *                     article_id:
 *                       type: integer
 *                     title:
 *                       type: string
 *                     abstract:
 *                       type: string
 *                     publication_year:
 *                       type: integer
 *                     doi:
 *                       type: string
 *                     primary_topic:
 *                       type: string
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *       401:
 *         description: Chưa xác thực hoặc token không hợp lệ
 *       404:
 *         description: Không tìm thấy bài báo
 *       500:
 *         description: Lỗi server
 */
router.get('/:id', requireAuth, getArticleById);

export default router;
