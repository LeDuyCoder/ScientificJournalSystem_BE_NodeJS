import express from "express";
import keywordController from "../controllers/keyword.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Keywords
 *   description: API quản lý từ khóa
 */

/**
 * @swagger
 * /api/v1/projects/{id}/keywords/trending:
 *   get:
 *     summary: Lấy Top 20 từ khóa trending của project
 *     tags: [Keywords]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
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
 *                 total:
 *                   type: integer
 *                   example: 20
 *                 sort_by:
 *                   type: string
 *                   example: count
 *                 keywords:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 1
 *                       keyword:
 *                         type: string
 *                         example: Machine Learning
 *                       count:
 *                         type: integer
 *                         example: 45
 *                       avg_score:
 *                         type: number
 *                         example: 0.85
 *                       total_score:
 *                         type: number
 *                         example: 38.25
 *       400:
 *         description: Project ID không hợp lệ
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Invalid project ID
 *       500:
 *         description: Lỗi server
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Internal server error
 */

// GET /api/v1/projects/:id/keywords/trending?limit=20&sort_by=count
router.get(
  "/:id/keywords/trending",
  requireAuth,
  keywordController.getTrendingKeywords,
);

/**
 * @swagger
 * /api/v1/projects/{id}/keywords/watch:
 *   post:
 *     summary: Cập nhật danh sách từ khóa mà dự án theo dõi
 *     tags: [Keywords]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của project
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - keyword_ids
 *             properties:
 *               keyword_ids:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 description: Mảng chứa các ID của từ khóa muốn theo dõi
 *                 example: [1, 5, 12]
 *     responses:
 *       201:
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
 *                   example: Cập nhật danh sách từ khóa theo dõi thành công
 *       400:
 *         description: Dữ liệu đầu vào không hợp lệ (ID dự án, định dạng keyword_ids, hoặc keyword ID không tồn tại)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: keyword_ids phải là một mảng
 *       401:
 *         description: Chưa xác thực (Missing/Invalid Token)
 *       404:
 *         description: Project không tồn tại hoặc không thuộc quyền sở hữu của user
 *       500:
 *         description: Lỗi server
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Có lỗi xảy ra ở Server!
 */

// POST /api/v1/projects/:id/keywords/watch
router.post(
  "/:id/keywords/watch",
  requireAuth,
  keywordController.watchKeywords
);

export default router;
