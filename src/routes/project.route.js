import express from 'express';
import { requireAuth } from '../middlewares/auth.middleware.js';
import {
  getProjects,
  getProjectById,
  createProject,
  updateProject
} from '../controllers/project.controller.js';

const router = express.Router();

/**
 * @swagger
 * /api/v1/projects:
 *   get:
 *     summary: Lấy danh sách dự án của người dùng đang đăng nhập
 *     tags:
 *       - Project
 *     security:
 *       - bearerAuth: []
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
 *                   example: "Lấy danh sách dự án thành công"
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       project_id:
 *                         type: string
 *                         example: "12"
 *                       title:
 *                         type: string
 *                         example: "Dự án nghiên cứu AI"
 *                       subject_area:
 *                         type: integer
 *                         example: 1
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *                         example: "2026-05-27T10:00:00Z"
 *       401:
 *         description: Chưa xác thực hoặc token không hợp lệ
 *       500:
 *         description: Lỗi hệ thống server
 */
router.get('/', requireAuth, getProjects);

/**
 * @swagger
 * /api/v1/projects/{id}:
 *   get:
 *     summary: Lấy chi tiết thông tin một dự án (bao gồm Area/Category/Journal đã chọn)
 *     tags:
 *       - Project
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của dự án cần lấy chi tiết (dạng số nguyên BIGINT)
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
 *                   example: "Lấy chi tiết dự án thành công"
 *                 data:
 *                   type: object
 *                   properties:
 *                     project_id:
 *                       type: string
 *                       example: "12"
 *                     title:
 *                       type: string
 *                     user_id:
 *                       type: string
 *                       format: uuid
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *                     subject_area:
 *                       type: object
 *                       nullable: true
 *                       properties:
 *                         subject_area_id:
 *                           type: integer
 *                         display_name:
 *                           type: string
 *                         description:
 *                           type: string
 *                     subject_categories:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           subject_category_id:
 *                             type: integer
 *                           display_name:
 *                             type: string
 *                           description:
 *                             type: string
 *                     journals:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           journal_id:
 *                             type: integer
 *                           display_name:
 *                             type: string
 *                           issn:
 *                             type: string
 *       401:
 *         description: Chưa xác thực
 *       400:
 *         description: ID dự án không hợp lệ (không phải số nguyên)
 *       404:
 *         description: Dự án không tồn tại hoặc bạn không có quyền xem
 *       500:
 *         description: Lỗi hệ thống
 */
router.get('/:id', requireAuth, getProjectById);

/**
 * @swagger
 * /api/v1/projects:
 *   post:
 *     summary: Tạo mới một dự án
 *     tags:
 *       - Project
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Dự án Xu Hướng Công Nghệ Mới"
 *               subject_area:
 *                 type: integer
 *                 example: 1
 *               subject_category_ids:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 example: [1, 2]
 *               journal_ids:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 example: [101, 102]
 *     responses:
 *       201:
 *         description: Tạo dự án thành công
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
 *                   example: "Tạo dự án thành công"
 *                 data:
 *                   type: object
 *                   properties:
 *                     project_id:
 *                       type: string
 *                       example: "12"
 *                     user_id:
 *                       type: string
 *                       format: uuid
 *                     title:
 *                       type: string
 *                     subject_area:
 *                       type: integer
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Dữ liệu gửi lên thiếu hoặc không hợp lệ (Ví dụ ID Area/Category/Journal không tồn tại)
 *       401:
 *         description: Chưa xác thực
 *       500:
 *         description: Lỗi hệ thống
 */
router.post('/', requireAuth, createProject);

/**
 * @swagger
 * /api/v1/projects/{id}:
 *   put:
 *     summary: Cập nhật thông tin dự án (thông tin chung, Area, Categories, Journals)
 *     tags:
 *       - Project
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của dự án cần cập nhật
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Dự án Công Nghệ Mới Cập Nhật"
 *               subject_area:
 *                 type: integer
 *                 example: 2
 *               subject_category_ids:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 example: [3]
 *               journal_ids:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 example: [103]
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       400:
 *         description: Dữ liệu đầu vào sai hoặc ID không tồn tại
 *       401:
 *         description: Chưa xác thực
 *       404:
 *         description: Không tìm thấy dự án hoặc không có quyền sửa
 *       500:
 *         description: Lỗi hệ thống
 */
router.put('/:id', requireAuth, updateProject);

export default router;
