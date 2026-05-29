import express from "express";
import { getVolumes, getIssues } from "../controllers/catalog.controller.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Catalog
 *   description: API duyệt danh sách Volume và Issue
 */

/**
 * @swagger
 * /api/v1/catalog/volumes:
 *   get:
 *     summary: Lấy danh sách volume
 *     tags:
 *       - Catalog
 *     parameters:
 *       - in: query
 *         name: journal_id
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Lọc volume theo journal_id
 *     responses:
 *       200:
 *         description: Lấy danh sách volume thành công
 *       400:
 *         description: journal_id không hợp lệ
 *       500:
 *         description: Lỗi hệ thống server
 */
router.get("/volumes", getVolumes);

/**
 * @swagger
 * /api/v1/catalog/issues:
 *   get:
 *     summary: Lấy danh sách issue
 *     tags:
 *       - Catalog
 *     parameters:
 *       - in: query
 *         name: volume_id
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Lọc issue theo volume_id
 *     responses:
 *       200:
 *         description: Lấy danh sách issue thành công
 *       400:
 *         description: volume_id không hợp lệ
 *       500:
 *         description: Lỗi hệ thống server
 */
router.get("/issues", getIssues);

export default router;
