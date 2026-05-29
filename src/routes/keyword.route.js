import express from "express";
import { requireAuth } from "../middlewares/auth.middleware.js";
import {
  getTrendingKeywords,
  getWatchedKeywordArticles,
} from "../controllers/keyword.controller.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Keywords
 *   description: API quản lý từ khóa trending và theo dõi
 */

/**
 * @swagger
 * /api/v1/projects/{id}/keywords/trending:
 *   get:
 *     summary: Lấy Top 20 từ khóa trending của project
 *     tags:
 *       - Keywords
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: ID của project
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Số lượng từ khóa muốn lấy (tối đa 100)
 *       - in: query
 *         name: sort_by
 *         schema:
 *           type: string
 *           enum: [count, score]
 *           default: count
 *         description: Sắp xếp theo tần suất (count) hoặc điểm (score)
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
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Lấy danh sách từ khóa trending thành công
 *                 data:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                       example: 20
 *                     sort_by:
 *                       type: string
 *                       example: count
 *                     keywords:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                             example: 1
 *                           keyword:
 *                             type: string
 *                             example: Machine Learning
 *                           count:
 *                             type: integer
 *                             example: 45
 *                           avg_score:
 *                             type: number
 *                             example: 0.85
 *                           total_score:
 *                             type: number
 *                             example: 38.25
 *       400:
 *         description: ID dự án không hợp lệ
 *       401:
 *         description: Chưa xác thực hoặc token không hợp lệ
 *       500:
 *         description: Lỗi hệ thống server
 */
router.get("/:id/keywords/trending", requireAuth, getTrendingKeywords);

/**
 * @swagger
 * /api/v1/projects/{id}/keywords/watch/articles:
 *   get:
 *     summary: Lấy luồng bài báo mới nhất từ các từ khóa đang theo dõi
 *     tags:
 *       - Keywords
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: ID của project
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Số trang
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Số lượng bài báo mỗi trang (tối đa 50)
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
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Lấy luồng bài báo từ từ khóa theo dõi thành công
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       article_id:
 *                         type: integer
 *                         example: 202601
 *                       title:
 *                         type: string
 *                         example: Ứng dụng AI trong phân tích xu hướng học thuật 2026
 *                       publication_year:
 *                         type: integer
 *                         example: 2026
 *                       doi:
 *                         type: string
 *                         example: 10.1016/j.ai.2026.01
 *                       matched_keywords:
 *                         type: array
 *                         items:
 *                           type: string
 *                         example: ["AI", "Trending"]
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                       example: 1
 *                     limit:
 *                       type: integer
 *                       example: 10
 *       400:
 *         description: ID dự án không hợp lệ
 *       401:
 *         description: Chưa xác thực hoặc token không hợp lệ
 *       500:
 *         description: Lỗi hệ thống server
 */
router.get(
  "/:id/keywords/watch/articles",
  requireAuth,
  getWatchedKeywordArticles,
);
export default router;
