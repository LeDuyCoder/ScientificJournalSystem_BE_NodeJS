import express from 'express';
import { getUserProfile, deleteMe, updateMe } from '../controllers/user.controller.js';
import { verifyToken } from '../middlewares/auth.middleware.js';

const router = express.Router();

/**
 * @swagger
 * /profile:
 *   get:
 *     summary: Lấy thông tin cá nhân user
 *     responses:
 *       200:
 *         description: Thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 name:
 *                   type: string
 *                 email:
 *                   type: string
 */
router.get('/profile', getUserProfile);

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

export default router;