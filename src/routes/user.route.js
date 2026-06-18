import express from 'express';
import { deleteMe, getMe, getUserDetail, getUsers, updateMe } from '../controllers/user.controller.js';
import { verifyAdmin, verifyToken } from '../middlewares/auth.middleware.js';
import { createUser } from '../services/admin.service.js';

const router = express.Router();

/**
 * @swagger
 * /api/v1/users/me:
 *   delete:
 *     summary: Tự xóa tài khoản cá nhân của người dùng hiện tại
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Xóa tài khoản thành công
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
 *                   example: "Xóa tài khoản user@gmail.com thành công!"
 *                 data:
 *                   type: object
 *                   properties:
 *                     user_id:
 *                       type: string
 *                       format: uuid
 *                       example: "a8e9c612-40db-4ff0-87a0-0f8b3b4f6cf7"
 *       401:
 *         description: Chưa đăng nhập hoặc Token không hợp lệ
 *       404:
 *         description: Không tìm thấy tài khoản để xóa
 *       500:
 *         description: Lỗi hệ thống server
 */
router.delete('/me', verifyToken, deleteMe);

/**
 * @swagger
 * /api/v1/users/me:
 *   put:
 *     summary: Cập nhật thông tin cá nhân của người dùng hiện tại
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               first_name:
 *                 type: string
 *                 example: "Hao"
 *               last_name:
 *                 type: string
 *                 example: "Phung"
 *               date_of_birth:
 *                 type: string
 *                 format: date
 *                 example: "1999-01-27"
 *               gender:
 *                 type: boolean
 *                 example: true
 *               url_image:
 *                 type: string
 *                 example: "https://example.com/avatar.jpg"
 *     responses:
 *       200:
 *         description: Cập nhật thông tin cá nhân thành công
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
 *                   example: "Cập nhật thông tin cá nhân thành công!"
 *                 data:
 *                   type: object
 *                   properties:
 *                     user_id:
 *                       type: string
 *                       format: uuid
 *                     email:
 *                       type: string
 *                     first_name:
 *                       type: string
 *                     last_name:
 *                       type: string
 *                     date_of_birth:
 *                       type: string
 *                     gender:
 *                       type: boolean
 *                     url_image:
 *                       type: string
 *       401:
 *         description: Chưa đăng nhập hoặc Token không hợp lệ
 *       404:
 *         description: Không tìm thấy tài khoản để cập nhật
 *       500:
 *         description: Lỗi hệ thống server
 */
router.put('/me', verifyToken, updateMe);

/**
 * @swagger
 * /api/v1/users/me:
 *   get:
 *     summary: Lấy thông tin cá nhân của người dùng hiện tại
 *     description: Lấy thông tin chi tiết (profile) của người dùng đang đăng nhập. Yêu cầu phải có token hợp lệ (thông qua Header Authorization hoặc Cookie tùy cấu hình hệ thống).
 *     tags: 
 *       - Users
 *     security:
 *       - bearerAuth: [] 
 *       # Lưu ý: Nếu hệ thống của bạn dùng Cookie thay vì Bearer Token, bạn có thể thiết lập lại scheme security (ví dụ: cookieAuth: [])
 *     responses:
 *       200:
 *         description: Lấy thông tin người dùng thành công.
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
 *                   example: Lấy thông tin người dùng thành công
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: "64a2b9..."
 *                     email:
 *                       type: string
 *                       example: "user@example.com"
 *                     role:
 *                       type: string
 *                       example: "USER"
 *                     name:
 *                       type: string
 *                       example: "Nguyễn Văn A"
 *                     # Bạn có thể bổ sung thêm các field khác mà hàm getMe trả về (avatar, sdt,...)
 *       401:
 *         description: Lỗi xác thực (Chưa đăng nhập, thiếu token hoặc token đã hết hạn/không hợp lệ).
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 code:
 *                   type: string
 *                   example: UNAUTHORIZED
 *                 message:
 *                   type: string
 *                   example: Token không hợp lệ hoặc đã hết hạn
 *       404:
 *         description: Không tìm thấy người dùng (Token hợp lệ nhưng user đã bị xóa khỏi database).
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
 *                   example: Người dùng không tồn tại
 *       500:
 *         description: Lỗi hệ thống từ phía server.
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
 *                   example: Lỗi máy chủ cục bộ
 */
router.get('/me', verifyToken, getMe);

/**
 * @swagger
 * /api/v1/users:
 *   get:
 *     summary: "[ADMIN] Lấy danh sách tài khoản User"
 *     description: "Trả về danh sách người dùng với các bộ lọc, phân trang. **LƯU Ý: Chỉ tài khoản có quyền ADMINISTRATOR mới được phép gọi API này.**"
 *     tags:
 *       - Users
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
 *         description: Bạn không có quyền Administrator để truy cập tài nguyên này
 *       500:
 *         description: Lỗi hệ thống
 */
router.get('/', verifyToken, verifyAdmin, getUsers);

/**
 * @swagger
 * /api/v1/users/{id}:
 *   get:
 *     summary: "[ADMIN] Lấy chi tiết một User theo ID"
 *     description: "Trả về thông tin chi tiết của một người dùng bất kỳ. **LƯU Ý: Chỉ tài khoản có quyền ADMINISTRATOR mới được phép gọi API này.**"
 *     tags:
 *       - Users
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
 *       401:
 *         description: Chưa đăng nhập
 *       403:
 *         description: Bạn không có quyền Administrator để truy cập tài nguyên này
 *       404:
 *         description: Không tìm thấy người dùng
 *       500:
 *         description: Lỗi hệ thống
 */
router.get('/:id', verifyToken, verifyAdmin, getUserDetail);

/**
 * @swagger
 * /api/v1/users:
 *   post:
 *     summary: "[ADMIN] Tạo tài khoản người dùng mới"
 *     description: "Tạo tài khoản mới với đầy đủ quyền hạn (Role, Status). Mật khẩu sẽ tự động được mã hóa. **LƯU Ý: Chỉ tài khoản có quyền ADMINISTRATOR mới được phép gọi API này.**"
 *     tags:
 *       - Users
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
 *         description: Thông tin không hợp lệ
 *       401:
 *         description: Chưa đăng nhập
 *       403:
 *         description: Bạn không có quyền Administrator để truy cập tài nguyên này
 *       409:
 *         description: Email đã tồn tại
 *       500:
 *         description: Lỗi hệ thống
 */
router.post('/', verifyToken, verifyAdmin, createUser);

export default router;