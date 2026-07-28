import express from "express";
import {
  getProjectMembers,
  inviteMember,
  acceptInvite,
  updateMemberRole,
  removeMember
} from "../controllers/projectMember.controller.js";
import { verifyToken } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Define routes
/**
 * @swagger
 * /api/v1/projects/{projectId}/members:
 *   get:
 *     summary: Lấy danh sách thành viên của dự án
 *     tags:
 *       - Project Members
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của dự án
 *     responses:
 *       200:
 *         description: Lấy danh sách thành công
 *       400:
 *         description: Lỗi khi lấy danh sách
 */
router.get("/:projectId/members", verifyToken, getProjectMembers);

/**
 * @swagger
 * /api/v1/projects/{projectId}/members/invite:
 *   post:
 *     summary: Gửi email mời một người dùng tham gia dự án
 *     tags:
 *       - Project Members
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của dự án
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - role
 *             properties:
 *               email:
 *                 type: string
 *                 example: user@example.com
 *               role:
 *                 type: string
 *                 enum: [OWNER, ADMIN, MEMBER, VIEWER]
 *                 example: MEMBER
 *     responses:
 *       200:
 *         description: Đã gửi lời mời thành công
 *       400:
 *         description: Lỗi khi mời (email không tồn tại, người dùng đã ở trong dự án, ...)
 */
router.post("/:projectId/members/invite", verifyToken, inviteMember);

/**
 * @swagger
 * /api/v1/projects/project-invite/accept:
 *   get:
 *     summary: Xác nhận lời mời tham gia dự án qua token
 *     tags:
 *       - Project Members
 *     parameters:
 *       - in: query
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: JWT Token được gửi trong email mời
 *     responses:
 *       200:
 *         description: Chấp nhận lời mời thành công
 *       400:
 *         description: Token không hợp lệ hoặc đã hết hạn
 */
router.get("/project-invite/accept", acceptInvite); // Accept route via GET query param token
/**
 * @swagger
 * /api/v1/projects/{projectId}/members/{userId}/role:
 *   put:
 *     summary: Cập nhật quyền (role) của thành viên trong dự án
 *     tags:
 *       - Project Members
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của dự án
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của người dùng cần cập nhật
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - role
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [OWNER, ADMIN, MEMBER, VIEWER]
 *                 example: VIEWER
 *     responses:
 *       200:
 *         description: Cập nhật quyền thành công
 *       400:
 *         description: Thành viên không tồn tại hoặc lỗi cập nhật
 */
router.put("/:projectId/members/:userId/role", verifyToken, updateMemberRole);

/**
 * @swagger
 * /api/v1/projects/{projectId}/members/{userId}:
 *   delete:
 *     summary: Xóa một thành viên khỏi dự án
 *     tags:
 *       - Project Members
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của dự án
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của người dùng cần xóa
 *     responses:
 *       200:
 *         description: Xóa thành viên thành công
 *       400:
 *         description: Thành viên không tồn tại hoặc lỗi khi xóa
 */
router.delete("/:projectId/members/:userId", verifyToken, removeMember);

export default router;
