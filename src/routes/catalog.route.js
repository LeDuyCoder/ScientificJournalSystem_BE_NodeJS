import express from 'express';
import { requireAuth } from '../middlewares/auth.middleware.js';
import {
  getJournals,
  getSubjectAreas,
  getSubjectCategories,
  getJournalRankings
} from '../controllers/catalog.controller.js';

const router = express.Router();

/**
 * @swagger
 * /api/v1/catalog/journals:
 *   get:
 *     summary: Lấy danh sách journal có hỗ trợ tìm kiếm và phân trang
 *     description: Trả về danh sách journal phù hợp với điều kiện tìm kiếm và thông tin phân trang. Yêu cầu đăng nhập.
 *     tags:
 *       - Catalog
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Từ khóa tìm kiếm theo tên journal (display_name)
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Trang hiện tại cần lấy
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 10
 *         description: Số lượng bản ghi mỗi trang
 *     responses:
 *       200:
 *         description: Lấy danh sách journal thành công
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
 *                   example: "Lấy danh sách journal thành công"
 *                 data:
 *                   type: object
 *                   properties:
 *                     items:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           journal_id:
 *                             type: string
 *                             example: "11"
 *                           display_name:
 *                             type: string
 *                             example: "CA-A Cancer Journal for Clinicians"
 *                           issn:
 *                             type: string
 *                             example: "1542-4863, 0007-9235"
 *                           type:
 *                             type: string
 *                             example: "journal"
 *                           coverage:
 *                             type: string
 *                             example: "1950-2025"
 *                           is_open_access:
 *                             type: boolean
 *                             example: true
 *                           is_oa_diamond:
 *                             type: boolean
 *                             example: false
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         page:
 *                           type: integer
 *                           example: 1
 *                         limit:
 *                           type: integer
 *                           example: 10
 *                         total:
 *                           type: integer
 *                           example: 100
 *       400:
 *         description: Tham số đầu vào không hợp lệ
 *       401:
 *         description: Chưa xác thực
 *       500:
 *         description: Lỗi hệ thống
 */
router.get('/journals', requireAuth, getJournals);

/**
 * @swagger
 * /api/v1/catalog/subject-areas:
 *   get:
 *     summary: Lấy danh sách các lĩnh vực học thuật lớn (Subject Area)
 *     description: Trả về danh sách tất cả các lĩnh vực lớn trong hệ thống. Yêu cầu đăng nhập.
 *     tags:
 *       - Catalog
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lấy danh sách subject area thành công
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
 *                   example: "Lấy danh sách subject area thành công"
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       subject_area_id:
 *                         type: string
 *                         example: "10"
 *                       display_name:
 *                         type: string
 *                         example: "Medicine"
 *                       description:
 *                         type: string
 *                         nullable: true
 *                         example: null
 *       401:
 *         description: Chưa xác thực
 *       500:
 *         description: Lỗi hệ thống
 */
router.get('/subject-areas', requireAuth, getSubjectAreas);

/**
 * @swagger
 * /api/v1/catalog/subject-categories:
 *   get:
 *     summary: Lấy danh sách các chuyên ngành hẹp (Subject Category)
 *     description: Trả về danh sách chuyên ngành hẹp trong hệ thống, hỗ trợ lọc theo Subject Area. Yêu cầu đăng nhập.
 *     tags:
 *       - Catalog
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: subject_area_id
 *         schema:
 *           type: string
 *         description: ID của subject area dùng để lọc các categories liên quan
 *     responses:
 *       200:
 *         description: Lấy danh sách subject category thành công
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
 *                   example: "Lấy danh sách subject category thành công"
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       subject_category_id:
 *                         type: string
 *                         example: "13"
 *                       subject_area_id:
 *                         type: string
 *                         example: "10"
 *                       display_name:
 *                         type: string
 *                         example: "Oncology"
 *                       description:
 *                         type: string
 *                         nullable: true
 *                         example: null
 *       401:
 *         description: Chưa xác thực
 *       500:
 *         description: Lỗi hệ thống
 */
router.get('/subject-categories', requireAuth, getSubjectCategories);

/**
 * @swagger
 * /api/v1/catalog/journals/{id}/rankings:
 *   get:
 *     summary: Lấy lịch sử ranking xếp hạng của một journal
 *     description: Trả về danh sách xếp hạng theo năm, chỉ số, phân hạng hoặc nguồn dữ liệu của journal đó. Yêu cầu đăng nhập.
 *     tags:
 *       - Catalog
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của journal cần lấy xếp hạng
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 *         description: Lọc xếp hạng theo năm cụ thể
 *       - in: query
 *         name: metric_code
 *         schema:
 *           type: string
 *         description: Lọc theo mã chỉ số (ví dụ SJR, H_INDEX, SJR_BEST_QUARTILE, RANK)
 *       - in: query
 *         name: quartile
 *         schema:
 *           type: string
 *         description: Lọc theo phân hạng (ví dụ Q1, Q2, Q3, Q4)
 *       - in: query
 *         name: source
 *         schema:
 *           type: string
 *         description: Lọc theo nguồn (ví dụ SCIMAGO, SCOPUS, WOS)
 *     responses:
 *       200:
 *         description: Lấy lịch sử ranking của journal thành công
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
 *                   example: "Lấy lịch sử ranking của journal thành công"
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       journal_ranking_id:
 *                         type: string
 *                         example: "3"
 *                       journal_id:
 *                         type: string
 *                         example: "1"
 *                       year:
 *                         type: integer
 *                         example: 2025
 *                       source:
 *                         type: string
 *                         example: "SCIMAGO"
 *                       metric_code:
 *                         type: string
 *                         example: "SJR"
 *                       metric_name:
 *                         type: string
 *                         example: "SJR"
 *                       metric_type:
 *                         type: string
 *                         example: "SCORE"
 *                       value:
 *                         type: number
 *                         example: 5.4
 *                       subject_category:
 *                         type: object
 *                         nullable: true
 *                         properties:
 *                           subject_category_id:
 *                             type: string
 *                             example: "13"
 *                           display_name:
 *                             type: string
 *                             example: "Oncology"
 *       400:
 *         description: ID của journal không được bỏ trống hoặc không hợp lệ
 *       401:
 *         description: Chưa xác thực
 *       404:
 *         description: Tạp chí không tồn tại trong hệ thống
 *       500:
 *         description: Lỗi hệ thống
 */
router.get('/journals/:id/rankings', requireAuth, getJournalRankings);

export default router;
