import express from 'express';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { createJournal, getJournals, getJournalsById } from '../controllers/journal.controller.js';
import { validateCreateJournal } from '../middlewares/journalValidation.middleware.js';

const router = express.Router();

/**
 * @swagger
 * /api/v1/journal:
 *   get:
 *     summary: Lấy danh sách journal có hỗ trợ tìm kiếm và phân trang
 *     description: Trả về danh sách journal phù hợp với điều kiện tìm kiếm và thông tin phân trang. Yêu cầu đăng nhập.
 *     tags:
 *       - Journal
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
router.get('/', requireAuth, getJournals);

/**
 * @swagger
 * /api/v1/journal/{id}:
 *   get:
 *     summary: Lấy thông tin chi tiết của một journal theo ID
 *     description: Trả về thông tin chi tiết của journal dựa vào ID cung cấp. Yêu cầu đăng nhập.
 *     tags:
 *       - Journal
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của journal cần lấy
 *     responses:
 *       200:
 *         description: Lấy journal thành công
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
 *                   example: "Lấy journal thành công"
 *                 data:
 *                   type: object
 *                   nullable: true
 *                   properties:
 *                     journal_id:
 *                       type: string
 *                       example: "11"
 *                     display_name:
 *                       type: string
 *                       example: "CA-A Cancer Journal for Clinicians"
 *                     issn:
 *                       type: string
 *                       example: "1542-4863, 0007-9235"
 *                     type:
 *                       type: string
 *                       example: "journal"
 *                     coverage:
 *                       type: string
 *                       example: "1950-2025"
 *                     is_open_access:
 *                       type: boolean
 *                       example: true
 *                     is_oa_diamond:
 *                       type: boolean
 *                       example: false
 *       400:
 *         description: Id không hợp lệ
 *       401:
 *         description: Chưa xác thực
 *       500:
 *         description: Lỗi hệ thống khi lấy journal
 */
router.get('/:id', requireAuth, getJournalsById);


//viết tài liệu swagger cho endpoint tạo mới journal
/**
 * @swagger
 * /api/v1/journal:
 *   post:
 *     summary: Tạo mới một journal
 *     description: Tạo mới một journal với thông tin cung cấp. Yêu cầu đăng nhập và dữ liệu phải hợp lệ.
 *     tags:
 *       - Journal
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Journal'
 *     responses:
 *       201:
 *         description: Tạo journal thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Journal'
 *       400:
 *         description: Dữ liệu đầu vào không hợp lệ
 *       401:
 *         description: Chưa xác thực
 *       500:
 *         description: Lỗi hệ thống khi tạo journal
 */
router.post('/', requireAuth, validateCreateJournal, createJournal);
export default router;