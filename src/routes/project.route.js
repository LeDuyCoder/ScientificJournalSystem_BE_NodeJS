import express from 'express';
import { verifyToken } from '../middlewares/auth.middleware.js';
import {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  getRelatedArticles,
  deleteProject,
  restoreProject,
  getProjectAnalytics,
  getProjectOverview,
  activateProject
} from '../controllers/project.controller.js';
import { validateCreateProject, validateProjectId, validateRelatedArticlesLimit, validateUpdateProject } from '../middlewares/projectValidation.middleware.js';

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
 *                       project_name:
 *                         type: string
 *                         example: "Dự án nghiên cứu AI"
 *                       subject_area:
 *                         type: integer
 *                         example: 1
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *                         example: "2026-05-27T10:00:00Z"
 *                       journal_count:
 *                         type: integer
 *                         example: 5
 *                       keyword_count:
 *                         type: integer
 *                         example: 10
 *                       article_count:
 *                         type: integer
 *                         example: 120
 *       401:
 *         description: Chưa xác thực hoặc token không hợp lệ
 *       500:
 *         description: Lỗi hệ thống server
 */
/**
 * Route GET /api/v1/projects
 * Lấy danh sách tất cả các dự án của người dùng hiện tại (Yêu cầu xác thực)
 */
router.get('/', verifyToken, getProjects);

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
router.get('/:id', verifyToken, validateProjectId, getProjectById);

/**
 * @swagger
 * /api/v1/projects/{id}/related-articles:
 *   get:
 *     summary: Lấy danh sách bài viết liên quan của một dự án
 *     description: Tự động tổng hợp các bài viết mới nhất từ các tạp chí (journals) và danh mục (categories) đã được liên kết trong dự án.
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
 *         description: ID của dự án cần khai thác bài viết liên quan (dạng số nguyên BIGINT)
 *       - in: query
 *         name: limit
 *         required: false
 *         schema:
 *           type: integer
 *           default: 5
 *         description: Số lượng bài viết tối đa muốn lấy (mặc định là 5 nếu không truyền)
 *     responses:
 *       200:
 *         description: Lấy danh sách bài viết liên quan thành công
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
 *                   example: "Lấy bài viết liên quan thành công"
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       article_id:
 *                         type: integer
 *                         example: 101
 *                       title:
 *                         type: string
 *                         example: "A Comprehensive Review of Signal Transduction in Cancer Cells"
 *                       abstract:
 *                         type: string
 *                         example: "This paper discusses the recent pathways discovered in cell signaling..."
 *                       publication_year:
 *                         type: integer
 *                         example: 2026
 *                       doi:
 *                         type: string
 *                         example: "10.1000/xyz123"
 *                       journal_id:
 *                         type: integer
 *                         example: 14
 *       400:
 *         description: ID dự án hoặc giá trị limit không hợp lệ (không phải số nguyên)
 *       401:
 *         description: Chưa xác thực (Thiếu hoặc sai Token)
 *       404:
 *         description: Dự án không tồn tại hoặc người dùng không có quyền sở hữu
 *       500:
 *         description: Lỗi hệ thống hoặc lỗi máy chủ kết nối Database
 */
router.get('/:id/related-articles', verifyToken, validateProjectId, validateRelatedArticlesLimit, getRelatedArticles);

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
/**
 * Route POST /api/v1/projects
 * Tạo mới một dự án khoa học (Yêu cầu xác thực)
 */
router.post('/', verifyToken, validateCreateProject, createProject);

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
/**
 * Route PUT /api/v1/projects/:id
 * Cập nhật thông tin dự án khoa học hiện tại (Yêu cầu xác thực)
 */
router.put('/:id', verifyToken, validateProjectId, validateUpdateProject, updateProject);

/**
 * @swagger
 * /api/v1/projects/{id}:
 *   delete:
 *     summary: Xóa một dự án của người dùng
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
 *         description: ID của dự án cần xóa
 *     responses:
 *       200:
 *         description: Xóa dự án thành công
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
 *                   example: "Xóa dự án thành công"
 *       400:
 *         description: ID dự án không hợp lệ
 *       401:
 *         description: Chưa xác thực
 *       404:
 *         description: Không tìm thấy dự án hoặc không có quyền xóa
 *       500:
 *         description: Lỗi hệ thống
 */
/**
 * Route DELETE /api/v1/projects/:id
 * Xóa một dự án khoa học và các liên kết trung gian (Yêu cầu xác thực)
 */
router.delete('/:id', verifyToken, validateProjectId, deleteProject);

/**
 * @swagger
 * /api/v1/projects/{id}/overview:
 *   get:
 *     summary: Lấy dữ liệu tổng quan và biểu đồ của một project
 *     description: Trả về dữ liệu tổng quan mức cao cho tab Tổng quan & Biểu đồ, gồm summary cards, publication trend, subject area distribution và publication type distribution. Không nhận userId từ client, user_id được lấy từ access token.
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
 *         description: ID của project cần lấy overview
 *     responses:
 *       200:
 *         description: Lấy project overview thành công hoặc không có dữ liệu overview
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
 *                   example: "Project overview fetched successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     summary:
 *                       type: object
 *                       properties:
 *                         totalArticles:
 *                           type: integer
 *                           example: 81
 *                         totalKeywords:
 *                           type: integer
 *                           example: 1
 *                         totalJournals:
 *                           type: integer
 *                           example: 12
 *                         lastUpdatedAt:
 *                           type: string
 *                           format: date-time
 *                           nullable: true
 *                           example: "2026-07-03T00:00:00.000Z"
 *                     charts:
 *                       type: object
 *                       properties:
 *                         publicationTrend:
 *                           type: object
 *                           properties:
 *                             type:
 *                               type: string
 *                               example: "line"
 *                             labels:
 *                               type: array
 *                               items:
 *                                 type: string
 *                               example: ["2022", "2023", "2024", "2025"]
 *                             datasets:
 *                               type: array
 *                               items:
 *                                 type: object
 *                                 properties:
 *                                   label:
 *                                     type: string
 *                                     example: "Publications"
 *                                   data:
 *                                     type: array
 *                                     items:
 *                                       type: integer
 *                                     example: [10, 18, 25, 28]
 *                         subjectAreaDistribution:
 *                           type: object
 *                           properties:
 *                             type:
 *                               type: string
 *                               example: "donut"
 *                             labels:
 *                               type: array
 *                               items:
 *                                 type: string
 *                               example: ["Computer Science", "Engineering", "Medicine"]
 *                             datasets:
 *                               type: array
 *                               items:
 *                                 type: object
 *                                 properties:
 *                                   label:
 *                                     type: string
 *                                     example: "Subject Areas"
 *                                   data:
 *                                     type: array
 *                                     items:
 *                                       type: integer
 *                                     example: [45, 25, 11]
 *                         publicationTypeDistribution:
 *                           type: object
 *                           properties:
 *                             type:
 *                               type: string
 *                               example: "donut"
 *                             labels:
 *                               type: array
 *                               items:
 *                                 type: string
 *                               example: ["journal", "conference and proceedings", "book series"]
 *                             datasets:
 *                               type: array
 *                               items:
 *                                 type: object
 *                                 properties:
 *                                   label:
 *                                     type: string
 *                                     example: "Publication Types"
 *                                   data:
 *                                     type: array
 *                                     items:
 *                                       type: integer
 *                                     example: [50, 21, 10]
 *             examples:
 *               success:
 *                 summary: Có dữ liệu overview
 *                 value:
 *                   success: true
 *                   message: "Project overview fetched successfully"
 *                   data:
 *                     summary:
 *                       totalArticles: 81
 *                       totalKeywords: 1
 *                       totalJournals: 12
 *                       lastUpdatedAt: "2026-07-03T00:00:00.000Z"
 *                     charts:
 *                       publicationTrend:
 *                         type: "line"
 *                         labels: ["2022", "2023", "2024", "2025"]
 *                         datasets:
 *                           - label: "Publications"
 *                             data: [10, 18, 25, 28]
 *                       subjectAreaDistribution:
 *                         type: "donut"
 *                         labels: ["Computer Science", "Engineering", "Medicine"]
 *                         datasets:
 *                           - label: "Subject Areas"
 *                             data: [45, 25, 11]
 *                       publicationTypeDistribution:
 *                         type: "donut"
 *                         labels: ["journal", "conference and proceedings", "book series"]
 *                         datasets:
 *                           - label: "Publication Types"
 *                             data: [50, 21, 10]
 *               empty:
 *                 summary: Không có dữ liệu overview
 *                 value:
 *                   success: true
 *                   message: "No overview data found"
 *                   data:
 *                     summary:
 *                       totalArticles: 0
 *                       totalKeywords: 0
 *                       totalJournals: 0
 *                       lastUpdatedAt: null
 *                     charts:
 *                       publicationTrend:
 *                         type: "line"
 *                         labels: []
 *                         datasets:
 *                           - label: "Publications"
 *                             data: []
 *                       subjectAreaDistribution:
 *                         type: "donut"
 *                         labels: []
 *                         datasets:
 *                           - label: "Subject Areas"
 *                             data: []
 *                       publicationTypeDistribution:
 *                         type: "donut"
 *                         labels: []
 *                         datasets:
 *                           - label: "Publication Types"
 *                             data: []
 *       400:
 *         description: ID project không hợp lệ
 *       401:
 *         description: Chưa xác thực hoặc access token không hợp lệ
 *       403:
 *         description: Project không thuộc user hiện tại
 *       500:
 *         description: Lỗi máy chủ
 */
router.get('/:id/overview', verifyToken, validateProjectId, getProjectOverview);

router.get('/:id/analytics', verifyToken, validateProjectId, getProjectAnalytics);

/**
 * @swagger
 * /api/v1/projects/{id}/activate:
 *   put:
 *     summary: Kích hoạt dự án (trừ coin)
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
 *         description: ID của dự án cần kích hoạt
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               coinAmount:
 *                 type: number
 *                 example: 50
 *     responses:
 *       200:
 *         description: Kích hoạt thành công
 *       400:
 *         description: Số coin không hợp lệ hoặc không đủ số dư coin
 *       401:
 *         description: Chưa xác thực
 *       404:
 *         description: Không tìm thấy dự án
 *       500:
 *         description: Lỗi hệ thống
 */
/**
 * @swagger
 * /api/v1/projects/{id}/restore:
 *   put:
 *     summary: Khôi phục dự án đã bị xóa mềm (chỉ owner)
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
 *     responses:
 *       200:
 *         description: Khôi phục dự án thành công
 *       400:
 *         description: Dự án không tồn tại hoặc không ở trạng thái đã xóa
 */
router.put('/:id/restore', verifyToken, validateProjectId, restoreProject);

router.put('/:id/activate', verifyToken, validateProjectId, activateProject);

export default router;

