import express from 'express';
import { getAuthorAreasBreakdown, getAuthorArticles, getAuthorLeaderboard } from '../controllers/author.controller.js';
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

/**
 * @swagger
 * /api/v1/author/{id}/articles:
 *   get:
 *     summary: Lấy danh sách bài viết của tác giả theo ID
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
 *       - in: query
 *         name: limit
 *         required: false
 *         schema:
 *           type: integer
 *           minimum: 0
 *           default: 10
 *         description: Số lượng bài viết tối đa trên một trang (0 hoặc không cung cấp sử dụng giá trị mặc định 10)
 *       - in: query
 *         name: page
 *         required: false
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Trang thứ mấy (bắt đầu từ 1)
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
 *                 - pagination
 *                 - data
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Lấy bài viết của tác giả thành công"
 *                 pagination:
 *                   type: object
 *                   required:
 *                     - page
 *                     - limit
 *                     - total
 *                   properties:
 *                     page:
 *                       type: integer
 *                       example: 1
 *                     limit:
 *                       type: integer
 *                       example: 10
 *                     total:
 *                       type: integer
 *                       example: 25
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     required:
 *                       - article_id
 *                       - title
 *                       - abstract
 *                       - publication_year
 *                       - doi
 *                       - primary_topic
 *                       - created_at
 *                     properties:
 *                       article_id:
 *                         type: string
 *                         example: "123"
 *                       title:
 *                         type: string
 *                         example: "Advances in Cancer Immunotherapy"
 *                       abstract:
 *                         type: string
 *                         example: "This study explores novel approaches to cancer immunotherapy..."
 *                       publication_year:
 *                         type: integer
 *                         example: 2025
 *                       doi:
 *                         type: string
 *                         example: "10.1038/s41591-025-02134-z"
 *                       primary_topic:
 *                         type: string
 *                         nullable: true
 *                         example: "Oncology"
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *                         example: "2026-05-27T11:19:56.643Z"
 *       400:
 *         description: Dữ liệu đầu vào không hợp lệ (ID tác giả, limit, hoặc page không hợp lệ)
 *       401:
 *         description: Chưa xác thực hoặc token không hợp lệ
 *       500:
 *         description: Lỗi hệ thống server
 */
router.get('/:id/articles', requireAuth, getAuthorArticles);

/**
 * @swagger
 * /api/v1/author/leaderboard:
 *   get:
 *     summary: Lấy bảng xếp hạng tác giả
 *     tags:
 *       - Author
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         required: false
 *         schema:
 *           type: integer
 *           minimum: 0
 *           default: 10
 *         description: Số lượng tác giả tối đa trên mỗi trang
 *       - in: query
 *         name: page
 *         required: false
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Trang thứ mấy
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
 *                   example: "Lấy bảng xếp hạng tác giả thành công"
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       author_id:
 *                         type: integer
 *                         example: 123
 *                       orcid:
 *                         type: string
 *                         example: "https://orcid.org/0000-0002-1824-2337"
 *                       display_name:
 *                         type: string
 *                         example: "Jason R. Westin"
 *                       url_image:
 *                         type: string
 *                         nullable: true
 *                         example: null
 *                       works_count:
 *                         type: integer
 *                         example: 655
 *                       cited_by_count:
 *                         type: integer
 *                         example: 29763
 *                       h_index:
 *                         type: integer
 *                         example: 57
 *                       i10_index:
 *                         type: integer
 *                         example: 195
 *                       final_rank:
 *                         type: integer
 *                         example: 1
 *       400:
 *         description: Dữ liệu đầu vào không hợp lệ
 *       401:
 *         description: Chưa xác thực hoặc token không hợp lệ
 *       500:
 *         description: Lỗi hệ thống server
 */
router.get("/leaderboard", requireAuth,  getAuthorLeaderboard);

export default router;
