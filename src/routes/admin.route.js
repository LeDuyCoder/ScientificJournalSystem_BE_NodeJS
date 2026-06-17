import express from 'express';
import { verifyAdmin, verifyToken } from '../middlewares/auth.middleware.js';
import { summary, publicationTrends, getRecentActivities, getVolumeIssueStatus, exportVolumeIssueStatusCSV, getUsers, getUserDetail, createUser } from '../controllers/admin.controller.js';

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

/**
 * @swagger
 * /api/v1/admin/users:
 *   get:
 *     summary: Lấy danh sách User cho Admin
 *     description: Trả về danh sách người dùng với các bộ lọc, tìm kiếm, phân trang và sắp xếp.
 *     tags:
 *       - Admin
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Tìm kiếm theo tên hoặc email
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *         description: Lọc theo vai trò (ví dụ RESEARCHER, LECTURER, ADMINISTRATOR)
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Lọc theo trạng thái (ví dụ ACTIVE, INACTIVE, BANNED)
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
 *         description: Số bản ghi mỗi trang
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           default: email
 *         description: Trường dùng để sắp xếp
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Thứ tự sắp xếp
 *     responses:
 *       200:
 *         description: Lấy danh sách thành công
 *       401:
 *         description: Chưa đăng nhập hoặc Token không hợp lệ
 *       403:
 *         description: Không có quyền truy cập
 *       500:
 *         description: Lỗi hệ thống
 */
router.get('/users', verifyToken, verifyAdmin, getUsers);

/**
 * @swagger
 * /api/v1/admin/users/{id}:
 *   get:
 *     summary: Lấy chi tiết một User theo ID
 *     description: Trả về thông tin chi tiết của một người dùng để Admin xem hoặc chỉnh sửa.
 *     tags:
 *       - Admin
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID của người dùng cần lấy thông tin
 *     responses:
 *       200:
 *         description: Lấy thông tin chi tiết thành công
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
 *                   example: "GET_USER_DETAIL_SUCCESS"
 *                 message:
 *                   type: string
 *                   example: "Lấy chi tiết người dùng thành công"
 *                 data:
 *                   type: object
 *                   properties:
 *                      user_id: { type: "string", format: "uuid" }
 *                      email: { type: "string", format: "email" }
 *                      type: { type: "string", enum: ["LOCAL", "GOOGLE", "GITHUB"] }
 *                      status: { type: "string", enum: ["INACTIVE", "ACTIVE", "BANNED"] }
 *                      role: { type: "string", enum: ["STUDENT", "LECTURER", "RESEARCHER", "ADMINISTRATOR"] }
 *                      last_name: { type: "string" }
 *                      first_name: { type: "string" }
 *                      url_image: { type: "string", format: "uri" }
 *                      date_of_birth: { type: "string", format: "date" }
 *                      gender: { type: "boolean" }
 *       401:
 *         description: Chưa đăng nhập hoặc Token không hợp lệ
 *       403:
 *         description: Không có quyền truy cập
 *       404:
 *         description: Không tìm thấy người dùng
 *       500:
 *         description: Lỗi hệ thống
 */
router.get('/users/:id', verifyToken, verifyAdmin, getUserDetail);

/**
 * @swagger
 * /api/v1/admin/users:
 *   post:
 *     summary: Tạo tài khoản người dùng mới (Admin)
 *     description: API dành cho Admin để tạo tài khoản mới với đầy đủ quyền hạn (Role, Status). Mật khẩu sẽ tự động được mã hóa.
 *     tags:
 *       - Admin
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               first_name:
 *                 type: string
 *                 example: "Elen"
 *               last_name:
 *                 type: string
 *                 example: "Smith"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "elen@example.com"
 *               role:
 *                 type: string
 *                 enum: ["STUDENT", "LECTURER", "RESEARCHER", "ADMINISTRATOR"]
 *                 example: "RESEARCHER"
 *               status:
 *                 type: string
 *                 enum: ["INACTIVE", "ACTIVE", "BANNED"]
 *                 example: "ACTIVE"
 *               password:
 *                 type: string
 *                 example: "StrongPassword123"
 *               date_of_birth:
 *                 type: string
 *                 format: date
 *                 example: "1990-01-01"
 *               gender:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       201:
 *         description: Tạo người dùng thành công
 *       400:
 *         description: Thông tin không hợp lệ (thiếu email, mật khẩu ngắn)
 *       401:
 *         description: Chưa đăng nhập
 *       403:
 *         description: Không có quyền Admin
 *       409:
 *         description: Email đã tồn tại
 *       500:
 *         description: Lỗi hệ thống
 */
router.post('/users', verifyToken, verifyAdmin, createUser);

export default router;