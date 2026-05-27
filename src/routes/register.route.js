import express from 'express';
import { register } from '../controllers/register.controller.js';

const router = express.Router();

/**
 * @swagger
 * /api/v1/auth/register:
 *   post:
 *     summary: Đăng ký tài khoản người dùng mới
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
 *                 description: Email đăng ký của người dùng
 *               password:
 *                 type: string
 *                 example: "123456"
 *                 description: Mật khẩu (tối thiểu 6 ký tự)
 *               first_name:
 *                 type: string
 *                 example: "Văn A"
 *               last_name:
 *                 type: string
 *                 example: "Nguyễn"
 *               date_of_birth:
 *                 type: string
 *                 format: date
 *                 example: "1999-01-01"
 *               gender:
 *                 type: boolean
 *                 example: true
 *               role:
 *                 type: string
 *                 enum: [STUDENT, LECTURER, RESEARCHER, ADMINISTRATOR]
 *                 example: "STUDENT"
 *     responses:
 *       201:
 *         description: Đăng ký thành công, trả về thông tin tài khoản vừa tạo
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
 *                   example: "Đăng ký tài khoản thành công"
 *                 data:
 *                   type: object
 *                   properties:
 *                     user_id:
 *                       type: string
 *                       format: uuid
 *                       example: "a8e9c612-40db-4ff0-87a0-0f8b3b4f6cf7"
 *                     email:
 *                       type: string
 *                       example: "user@gmail.com"
 *                     type:
 *                       type: string
 *                       example: "LOCAL"
 *                     status:
 *                       type: string
 *                       example: "ACTIVE"
 *                     role:
 *                       type: string
 *                       example: "STUDENT"
 *       400:
 *         description: Dữ liệu đầu vào thiếu hoặc sai định dạng
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
 *                   example: "Mật khẩu phải có ít nhất 6 ký tự"
 *       409:
 *         description: Email đăng ký đã tồn tại
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
 *                   example: "Email đã tồn tại"
 *       500:
 *         description: Lỗi hệ thống server
 */
router.post('/register', register);

export default router;
