import express from 'express';
import { verifyAdmin, verifyToken } from '../middlewares/auth.middleware.js';
import { summary, publicationTrends, getRecentActivities, getVolumeIssueStatus, exportVolumeIssueStatusCSV } from '../controllers/admin.controller.js';

const router = express.Router();

/**
 * @swagger
 * /api/v1/admin/dashboard/summary:
 *   get:
 *     summary: Lấy số liệu thống kê tổng quan cho Admin Dashboard
 *     description: Trả về tổng số Journal, Article, User đang hoạt động và số lượng đồng bộ mới (growth) của Journal, Article trong ngày hôm nay. Yêu cầu quyền ADMINISTRATOR.
 *     tags:
 *       - Admin
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lấy số liệu thống kê tổng quan thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 code:
 *                   type: string
 *                   example: "GET_SUMMARY_SUCCESS"
 *                 message:
 *                   type: string
 *                   example: "Lấy số liệu thống kê tổng quan thành công"
 *                 data:
 *                   type: object
 *                   properties:
 *                     total_journals:
 *                       type: integer
 *                     journal_growth:
 *                       type: integer
 *                     total_articles:
 *                       type: integer
 *                     article_growth:
 *                       type: integer
 *                     pending_reviews:
 *                       type: integer
 *                     active_users:
 *                       type: integer
 *       401:
 *         description: Chưa đăng nhập hoặc Token không hợp lệ
 *       403:
 *         description: Bạn không có quyền truy cập tài nguyên này (yêu cầu role ADMINISTRATOR)
 *       500:
 *         description: Lỗi hệ thống server
 */
router.get('/dashboard/summary', verifyToken, verifyAdmin, summary);

/**
 * @swagger
 * /api/v1/admin/dashboard/publication-trends:
 *   get:
 *     summary: Lấy dữ liệu biểu đồ xu hướng xuất bản
 *     description: Trả về số lượng bài báo được đồng bộ/xuất bản (manuscripts) theo từng năm, mặc định là 5 năm gần nhất.
 *     tags:
 *       - Admin
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 *         description: Năm mốc kết thúc (mặc định là năm hiện tại nếu không truyền)
 *         example: 2024
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Số lượng năm muốn thống kê lùi lại (mặc định là 5)
 *         example: 5
 *     responses:
 *       200:
 *         description: Lấy dữ liệu biểu đồ thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 code:
 *                   type: string
 *                   example: "GET_PUBLICATION_TRENDS_SUCCESS"
 *                 message:
 *                   type: string
 *                   example: "Lấy dữ liệu biểu đồ xu hướng xuất bản thành công"
 *                 data:
 *                   type: object
 *                   properties:
 *                     target_year:
 *                       type: integer
 *                       example: 2024
 *                     items:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           year:
 *                             type: integer
 *                             example: 2024
 *                           manuscripts:
 *                             type: integer
 *                             example: 20
 *                           published:
 *                             type: integer
 *                             example: 12
 *       401:
 *         description: Chưa đăng nhập hoặc Token không hợp lệ
 *       403:
 *         description: Không có quyền truy cập
 *       500:
 *         description: Lỗi hệ thống
 */
router.get('/dashboard/publication-trends', verifyToken, verifyAdmin, publicationTrends);

/**
 * @swagger
 * /api/v1/admin/dashboard/volume-issue-status:
 *   get:
 *     summary: Lấy danh sách trạng thái Volume & Issue cho Dashboard
 *     description: Trả về danh sách các Volume cùng với trạng thái, số lượng Issue, và tiến độ, có hỗ trợ phân trang.
 *     tags:
 *       - Admin
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Trang hiện tại
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Số lượng bản ghi trên mỗi trang
 *     responses:
 *       200:
 *         description: Lấy danh sách thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 code:
 *                   type: string
 *                   example: "GET_VOLUME_ISSUE_STATUS_SUCCESS"
 *                 message:
 *                   type: string
 *                   example: "Lấy danh sách Volume & Issue Status thành công"
 *                 data:
 *                   type: array
 *                   items:
 *                      type: object
 *                      properties:
 *                          volume_id: { type: "string" }
 *                          volume_number: { type: "integer" }
 *                          publication_year: { type: "integer" }
 *                          journal_name: { type: "string" }
 *                          total_issues: { type: "integer" }
 *                          status: { type: "string", example: "PUBLISHED" }
 *                          progress: { type: "integer", example: 50 }
 *                 pagination:
 *                   type: object
 *                   properties:
 *                      total: { type: "integer" }
 *                      page: { type: "integer" }
 *                      limit: { type: "integer" }
 *                      totalPages: { type: "integer" }
 *       401:
 *         description: Chưa đăng nhập hoặc Token không hợp lệ
 *       403:
 *         description: Không có quyền truy cập
 *       500:
 *         description: Lỗi hệ thống
 */
router.get('/dashboard/volume-issue-status', verifyToken, verifyAdmin, getVolumeIssueStatus);

/**
 * @swagger
 * /api/v1/admin/dashboard/recent-activities:
 *   get:
 *     summary: Lấy danh sách hoạt động gần đây của hệ thống
 *     description: Trả về timeline các hoạt động gần đây nhất được ghi lại trong system_log, có hỗ trợ phân trang.
 *     tags:
 *       - Admin
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Trang hiện tại
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Số lượng bản ghi trên mỗi trang
 *     responses:
 *       200:
 *         description: Lấy danh sách hoạt động thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 code:
 *                   type: string
 *                   example: "GET_RECENT_ACTIVITIES_SUCCESS"
 *                 message:
 *                   type: string
 *                   example: "Lấy danh sách hoạt động gần đây thành công"
 *                 data:
 *                   type: array
 *                   items:
 *                      type: object
 *                      properties:
 *                          log_id: { type: "integer" }
 *                          user_id: { type: "string", format: "uuid" }
 *                          user_role: { type: "string" }
 *                          action: { type: "string", example: "UPDATE" }
 *                          level: { type: "string", example: "INFO" }
 *                          source: { type: "string", example: "ADMIN_PANEL" }
 *                          entity_table: { type: "string", example: "Journal" }
 *                          entity_id: { type: "string", example: "123" }
 *                          message: { type: "string", example: "Admin admin@example.com đã cập nhật Journal có ID: 123" }
 *                          metadata: { type: "object" }
 *                          created_at: { type: "string", format: "date-time" }
 *                 pagination:
 *                   type: object
 *                   properties:
 *                      total: { type: "integer" }
 *                      page: { type: "integer" }
 *                      limit: { type: "integer" }
 *                      totalPages: { type: "integer" }
 *       401:
 *         description: Chưa đăng nhập hoặc Token không hợp lệ
 *       403:
 *         description: Không có quyền truy cập
 *       500:
 *         description: Lỗi hệ thống
 */
router.get('/dashboard/recent-activities', verifyToken, verifyAdmin, getRecentActivities);

/**
 * @swagger
 * /api/v1/admin/dashboard/volume-issue-status/export:
 *   get:
 *     summary: Export danh sách trạng thái Volume & Issue thành CSV
 *     description: Trả về file CSV chứa toàn bộ dữ liệu Volume & Issue Status.
 *     tags:
 *       - Admin
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Tải file CSV thành công
 *         content:
 *           text/csv:
 *             schema:
 *               type: string
 *               format: binary
 *       401:
 *         description: Chưa đăng nhập hoặc Token không hợp lệ
 *       403:
 *         description: Không có quyền truy cập
 *       500:
 *         description: Lỗi hệ thống
 */
router.get('/dashboard/volume-issue-status/export', verifyToken, verifyAdmin, exportVolumeIssueStatusCSV);

export default router;