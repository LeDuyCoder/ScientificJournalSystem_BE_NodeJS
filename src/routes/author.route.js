import express from 'express';
import { getAuthorAreasBreakdown } from '../controllers/author.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';

const router = express.Router();

/**
 * @swagger
 * /api/v1/author/{id}/areas-breakdown:
 *   get:
 *     summary: Lấy phân tích lĩnh vực nghiên cứu của tác giả theo ID
 *     tags:
 *       - Author
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: ID của tác giả
 *     responses:
 *       200:
 *         description: Thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - success
 *                 - message
 *                 - data
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Phân tích lĩnh vực nghiên cứu của tác giả thành công"
 *                 data:
 *                   type: object
 *                   required:
 *                     - author_id
 *                     - orcid
 *                     - display_name
 *                     - openalex_id
 *                     - works_count
 *                     - cited_by_count
 *                     - h_index
 *                     - i10_index
 *                     - last_known_institution
 *                     - last_known_institution_id
 *                     - openalex_synced_at
 *                     - breakdown
 *                   properties:
 *                     author_id:
 *                       type: string
 *                       example: "321"
 *                     orcid:
 *                       type: string
 *                       example: "https://orcid.org/0000-0002-1824-2337"
 *                     display_name:
 *                       type: string
 *                       example: "Jason R. Westin"
 *                     url_image:
 *                       type: string
 *                       nullable: true
 *                       example: null
 *                     openalex_id:
 *                       type: string
 *                       example: "https://openalex.org/A5021496101"
 *                     works_count:
 *                       type: integer
 *                       example: 655
 *                     cited_by_count:
 *                       type: integer
 *                       example: 29763
 *                     h_index:
 *                       type: integer
 *                       example: 57
 *                     i10_index:
 *                       type: integer
 *                       example: 195
 *                     last_known_institution:
 *                       type: string
 *                       example: "The University of Texas MD Anderson Cancer Center"
 *                     last_known_institution_id:
 *                       type: string
 *                       example: "https://openalex.org/I1343551460"
 *                     homepage_url:
 *                       type: string
 *                       nullable: true
 *                       example: null
 *                     openalex_synced_at:
 *                       type: string
 *                       format: date-time
 *                       example: "2026-05-27T11:19:56.643Z"
 *                     breakdown:
 *                       type: array
 *                       items:
 *                         type: object
 *                         required:
 *                           - subject_category_id
 *                           - category_name
 *                           - article_count
 *                           - percentage
 *                         properties:
 *                           subject_category_id:
 *                             type: string
 *                             example: "2"
 *                           category_name:
 *                             type: string
 *                             example: "Oncology"
 *                           article_count:
 *                             type: string
 *                             example: "1"
 *                           percentage:
 *                             type: number
 *                             format: float
 *                             example: 100
 *       400:
 *         description: ID tác giả không hợp lệ
 *       401:
 *         description: Chưa xác thực hoặc token không hợp lệ
 *       500:
 *         description: Lỗi hệ thống server
 */
router.get('/:id/areas-breakdown', requireAuth, getAuthorAreasBreakdown);

export default router;
