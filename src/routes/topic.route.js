import express from 'express';
import { getArticlesByTopic } from '../controllers/topic.controller.js';

const router = express.Router();

/**
 * @swagger
 * /api/v1/topics/{id}/articles:
 *   get:
 *     summary: Lấy danh sách bài báo theo chủ đề nghiên cứu (topic)
 *     description: Trả về danh sách bài báo thuộc một topic cụ thể, hỗ trợ phân trang. API public, không yêu cầu đăng nhập.
 *     tags:
 *       - Topic
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của topic cần tra cứu
 *         example: 1
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
 *     responses:
 *       200:
 *         description: Lấy danh sách bài báo theo topic thành công
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
 *                   example: "Lấy danh sách bài báo theo topic thành công"
 *                 data:
 *                   type: object
 *                   properties:
 *                     topic:
 *                       type: object
 *                       properties:
 *                         topic_id:
 *                           type: integer
 *                           example: 1
 *                         display_name:
 *                           type: string
 *                           example: "Artificial Intelligence"
 *                     articles:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           article_id:
 *                             type: integer
 *                             example: 42
 *                           title:
 *                             type: string
 *                             example: "Deep Learning for NLP"
 *                           publication_year:
 *                             type: integer
 *                             example: 2025
 *                           doi:
 *                             type: string
 *                             example: "10.1234/example"
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
 *                           example: 20
 *       400:
 *         description: topic_id không hợp lệ hoặc tham số phân trang sai
 *       404:
 *         description: Topic không tồn tại
 *       500:
 *         description: Lỗi server
 */
/**
 * Route GET /api/v1/topics/:id/articles
 * Lấy danh sách bài báo thuộc topic (Public — không yêu cầu xác thực)
 */
router.get('/:id/articles', getArticlesByTopic);

export default router;
