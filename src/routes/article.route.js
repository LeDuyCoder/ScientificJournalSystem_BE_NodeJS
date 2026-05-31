import express from 'express';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { 
    createArticle, 
    getArticle, 
    getArticleById, 
    getArticlesByKeywords, 
    getArticles 
} from '../controllers/article.controller.js';

const router = express.Router();

/**
 * @swagger
 * /api/v1/articles:
 * get:
 * summary: Lấy danh sách hoặc Tìm kiếm bài báo tổng hợp (Hỗ trợ keywords yêu cầu Auth)
 * description: >
 * - Nếu KHÔNG truyền tham số `keywords`: Trả về danh sách bài báo toàn hệ thống công khai (Public), hỗ trợ `search`, phân trang, sắp xếp.
 * - Nếu CÓ truyền tham số `keywords`: API tự động chuyển sang chế độ tìm kiếm nâng cao theo từ khóa chuyên biệt (Yêu cầu xác thực Bearer Token).
 * tags:
 * - Article
 * parameters:
 * - in: query
 * name: keywords
 * schema:
 * type: string
 * description: Danh sách từ khóa cách nhau bởi dấu phẩy. Nếu có trường này, bắt buộc phải gửi Token.
 * example: Machine Learning,Deep Learning
 * - in: query
 * name: page
 * schema:
 * type: integer
 * minimum: 1
 * default: 1
 * description: Số trang hiện tại
 * - in: query
 * name: limit
 * schema:
 * type: integer
 * minimum: 1
 * default: 10
 * description: Số lượng bài báo mỗi trang
 * - in: query
 * name: search
 * schema:
 * type: string
 * description: Tìm kiếm bài báo theo tiêu đề văn bản (chỉ dùng cho chế độ Public công khai)
 * example: cancer
 * - in: query
 * name: sortBy
 * schema:
 * type: string
 * enum: [article_id, title, publication_year, created_at, doi]
 * default: created_at
 * description: Trường sắp xếp (chỉ dùng cho chế độ Public công khai)
 * - in: query
 * name: sortOrder
 * schema:
 * type: string
 * enum: [asc, desc]
 * default: desc
 * description: Thứ tự sắp xếp (chỉ dùng cho chế độ Public công khai)
 * responses:
 * 200:
 * description: Lấy danh sách hoặc tìm kiếm thành công
 * 400:
 * description: Tham số không hợp lệ
 * 401:
 * description: Chưa xác thực (Khi dùng tính năng keywords)
 * 500:
 * description: Lỗi hệ thống
 */

/**
 * Route GET /api/v1/articles
 * Khớp nối & giải quyết xung đột:
 * - Kiểm tra nếu có param `keywords` -> Chạy qua lớp bảo mật `requireAuth` rồi gọi controller xử lý keyword.
 * - Nếu không đi kèm `keywords` -> Cho phép truy cập công khai (Public) thông qua hàm gộp tổng `getArticles`.
 */
router.get('/', (req, res, next) => {
    if (req.query.keywords !== undefined && req.query.keywords.trim() !== '') {
        // Có keywords -> Bắt buộc kiểm tra token tài khoản
        return requireAuth(req, res, () => getArticlesByKeywords(req, res));
    }
    // Không có keywords -> Cho phép đi thẳng mà không cần token
    return getArticles(req, res);
});

/**
 * @swagger
 * /api/v1/articles/{id}:
 * get:
 * summary: Lấy chi tiết bài báo theo ID
 * description: Lấy thông tin chi tiết của 1 bài báo theo `article_id`
 * tags:
 * - Article
 * security:
 * - bearerAuth: []
 * parameters:
 * - in: path
 * name: id
 * required: true
 * schema:
 * type: integer
 * description: ID của bài báo cần lấy
 * example: 123
 * responses:
 * 200:
 * description: Thành công
 * 401:
 * description: Chưa xác thực hoặc token không hợp lệ
 * 404:
 * description: Không tìm thấy bài báo
 * 500:
 * description: Lỗi server
 */
router.get('/:id', requireAuth, getArticleById);

/**
 * @swagger
 * /api/v1/articles:
 * post:
 * summary: Tạo mới một bài báo
 * description: Tạo một bài báo mới trong hệ thống. Yêu cầu dữ liệu bài báo, danh sách tác giả và từ khóa nếu có.
 * tags:
 * - Article
 * security:
 * - bearerAuth: []
 * requestBody:
 * required: true
 * content:
 * application/json:
 * schema:
 * type: object
 * properties:
 * title:
 * type: string
 * abstract:
 * type: string
 * publication_year:
 * type: integer
 * issue_id:
 * type: integer
 * doi:
 * type: string
 * primary_topic:
 * type: string
 * sub_topic:
 * type: array
 * items:
 * type: string
 * authors:
 * type: array
 * items:
 * type: integer
 * keywords:
 * type: array
 * items:
 * type: string
 * required:
 * - title
 * - publication_year
 * - issue_id
 * example:
 * title: "An Analysis of AI Trends"
 * abstract: "This paper evaluates current deep learning paradigms..."
 * publication_year: 2026
 * issue_id: 1
 * doi: "10.1109/TAI.2026.01"
 * primary_topic: "Computer Science"
 * sub_topic: ["Machine Learning", "Neural Networks"]
 * authors: [12, 15]
 * keywords: ["AI", "Deep Learning", "Survey"]
 * responses:
 * 201:
 * description: Đã tạo bài báo thành công
 * 400:
 * description: Dữ liệu không hợp lệ
 * 401:
 * description: Chưa xác thực hoặc token không hợp lệ
 * 500:
 * description: Lỗi server
 */
router.post('/', requireAuth, createArticle);

export default router;