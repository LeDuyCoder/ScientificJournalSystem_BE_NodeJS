import express from 'express';
import { login } from '../controllers/login.controller.js';

const router = express.Router();

/**
 * @swagger
 * /api/v1/auth/login:
 *   post:
 *     summary: Đăng nhập người dùng bằng email và mật khẩu
 *     tags:
 *       - Auth
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
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@gmail.com
 *                 description: Email đăng nhập của người dùng
 *               password:
 *                 type: string
 *                 example: "123456"
 *                 description: Mật khẩu của người dùng
 *     responses:
 *       200:
 *         description: Đăng nhập thành công, trả về JWT Token và thông tin người dùng
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
 *                   example: "Đăng nhập thành công"
 *                 data:
 *                   type: object
 *                   properties:
 *                     token:
 *                       type: string
 *                       example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                     user:
 *                       type: object
 *                       properties:
 *                         user_id:
 *                           type: string
 *                           format: uuid
 *                           example: "a8e9c612-40db-4ff0-87a0-0f8b3b4f6cf7"
 *                         email:
 *                           type: string
 *                           example: "user@gmail.com"
 *                         role:
 *                           type: string
 *                           example: "STUDENT"
 *                         status:
 *                           type: string
 *                           example: "ACTIVE"
 *       400:
 *         description: Lỗi dữ liệu đầu vào không hợp lệ (thiếu email/password, sai định dạng email)
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
 *                   example: "Email không được để trống"
 *       401:
 *         description: Sai thông tin đăng nhập (email không tồn tại hoặc sai mật khẩu)
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
 *                   example: "Email hoặc mật khẩu không đúng"
 *       403:
 *         description: Tài khoản không được phép truy cập (bị khóa hoặc chưa kích hoạt)
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
 *                   example: "Tài khoản đã bị khóa"
 *       500:
 *         description: Lỗi hệ thống server
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
 *                   example: "Có lỗi xảy ra ở server"
 */
router.post('/login', login);

export default router;
