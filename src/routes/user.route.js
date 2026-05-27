import express from 'express';
import { getUserProfile } from '../controllers/user.controller.js';

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

export default router;