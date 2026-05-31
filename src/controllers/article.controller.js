import * as articleService from '../services/article.service.js';
import { checkAuthorsExistence, createAuthorArticleRelationships } from '../services/author.service.js';
import { addKeywordsToArticle } from '../services/keyword.service.js';
import { createSubTopicArticleRelationships } from '../services/topic.service.js';
import logger from '../utils/logger.js';

/**
 * API Handler: Tìm kiếm bài báo dựa trên danh sách từ khóa chuyên biệt (Khớp chính xác danh sách keyword)
 * Method: GET /api/v1/articles/by-keywords (Hoặc cấu hình qua hàm điều hướng getArticle)
 */
export const getArticlesByKeywords = async (req, res) => {
    try {
        const rawKeywords = req.query.keywords;

        if (!rawKeywords || rawKeywords.trim() === '') {
            return res.status(400).json({
                success: false,
                message: "Vui lòng cung cấp tham số 'keywords' trong query string! Ví dụ: ?keywords=Machine Learning,Deep Learning"
            });
        }

        const keywords = rawKeywords
            .split(',')
            .map(kw => kw.trim().toLowerCase())
            .filter(kw => kw.length > 0);

        if (keywords.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Danh sách keyword không hợp lệ!"
            });
        }

        const limit = parseInt(req.query.limit, 10) || 20;
        const page = parseInt(req.query.page, 10) || 1;
        const offset = (page - 1) * limit;

        const [articles, total] = await Promise.all([
            articleService.getArticlesByKeywords(keywords, limit, offset),
            articleService.countArticlesByKeywords(keywords)
        ]);

        return res.status(200).json({
            success: true,
            message: "Lấy danh sách bài báo thành công!",
            data: {
                articles: articles,
                pagination: {
                    total: total,
                    page: page,
                    limit: limit,
                    total_pages: Math.ceil(total / limit)
                }
            }
        });
    } catch (error) {
        console.error('getArticlesByKeywords error:', error);
        return res.status(500).json({
            success: false,
            message: "Có lỗi xảy ra ở Server!"
        });
    }
};

/**
 * API Handler: Lấy danh sách hoặc Tìm kiếm bài báo toàn hệ thống bằng thanh Search (Public)
 * Gộp từ 2 phiên bản trùng lặp: Nếu có chữ trong ô search thì tìm theo ô search, nếu rỗng thì lấy toàn bộ phân trang.
 * Method: GET /api/v1/articles
 */
export const getArticles = async (req, res) => {
    try {
        let page = parseInt(req.query.page, 10) || 1;
        let limit = parseInt(req.query.limit, 10) || 10;
        if (page <= 0) page = 1;
        if (limit <= 0) limit = 10;
        const offset = (page - 1) * limit;

        const search = (req.query.search || '').trim();

        let articles = [];
        let total = 0;

        // Giữ logic của cả 2 bên: 
        // - Nếu có 'search', gọi tìm kiếm theo văn bản (bài viết, tiêu đề...)
        // - Nếu không có 'search', gọi tìm kiếm/lấy tất cả bài báo theo sort tự chọn (Bên dưới)
        if (search) {
            [articles, total] = await Promise.all([
                articleService.getAllArticles({ limit, offset, search }),
                articleService.countAllArticles({ search })
            ]);

            // Trả về dữ liệu format theo kiểu mapping của hàm getArticles cũ
            return res.status(200).json({
                success: true,
                message: "Lấy danh sách bài báo thành công",
                data: {
                    items: articles.map(a => ({
                        article_id: a.article_id,
                        title: a.title,
                        abstract: a.abstract,
                        publication_year: a.publication_year,
                        doi: a.doi,
                        journal: a.journal_id ? {
                            journal_id: a.journal_id,
                            display_name: a.journal_name
                        } : null
                    })),
                    pagination: { page, limit, total }
                }
            });
        } else {
            // Nếu không điền thanh search, fallback về hàm lấy toàn bộ bài báo phân trang nâng cao
            const sortBy = req.query.sortBy || 'created_at';
            const sortOrder = (req.query.sortOrder || 'DESC').toUpperCase();

            if (!['ASC', 'DESC'].includes(sortOrder)) {
                return res.status(400).json({
                    success: false,
                    message: "Tham số 'sortOrder' phải là 'asc' hoặc 'desc'!"
                });
            }

            articles = await articleService.getAllArticles(limit, offset, sortBy, sortOrder);
            total = await articleService.getTotalArticles();

            return res.status(200).json({
                success: true,
                message: "Lấy danh sách bài báo thành công!",
                data: {
                    articles: articles,
                    pagination: {
                        page: page,
                        limit: limit,
                        total: total,
                        total_pages: Math.ceil(total / limit)
                    }
                }
            });
        }
    } catch (error) {
        logger.error('Lỗi khi lấy danh sách bài báo:', error);
        return res.status(500).json({
            success: false,
            message: "Có lỗi xảy ra ở Server!"
        });
    }
};

/**
 * API Router Handler: Hàm điều hướng gốc (Get gốc)
 * Kiểm tra query string: Nếu có `keywords` thì tìm theo chuỗi keyword chuyên biệt, nếu không thì dùng `getArticles` tổng hợp.
 */
export const getArticle = async (req, res) => {
    const rawKeywords = req.query.keywords;
    if (!rawKeywords || rawKeywords.trim() === '') {
        return getArticles(req, res); // Đã trỏ chính xác về hàm getArticles đã gộp ở trên
    } else {
        return getArticlesByKeywords(req, res);
    }
};

/**
 * API Handler: Lấy thông tin chi tiết bài báo theo ID
 */
export const getArticleById = async (req, res) => {
    try {
        const { id } = req.params;
        const article = await articleService.getArticleById(id);

        if (!article) {
            return res.status(404).json({
                success: false,
                message: "Bài báo không tồn tại!"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Lấy thông tin bài báo thành công!",
            data: article
        });
    } catch (error) {
        logger.error('Lỗi khi lấy thông tin bài báo theo ID:', error);
        return res.status(500).json({
            success: false,
            message: "Có lỗi xảy ra ở Server!"
        });
    }
};

/**
 * API Handler: Tạo mới một bài báo hoàn chỉnh (Gắn tác giả, keyword, topic)
 */
export const createArticle = async (req, res) => {
    const {
        title,
        publication_year,
        version,
        issue_id,
        abstract,
        doi,
        primary_topic,
        sub_topic,
        authors,
        keywords
    } = req.body;

    // --- Khối Validate Dữ Liệu Đầu Vào ---
    if (!title || title.trim() === '') {
        return res.status(400).json({ success: false, message: 'Title is required' });
    }
    if (publication_year === undefined || publication_year === null) {
        return res.status(400).json({ success: false, message: 'Publication year is required' });
    }
    if (typeof publication_year !== 'number') {
        return res.status(400).json({ success: false, message: 'Publication year must be a number' });
    }
    if (issue_id !== undefined && issue_id !== null && typeof issue_id !== 'number') {
        return res.status(400).json({ success: false, message: 'Issue ID must be a number' });
    }
    if (primary_topic !== undefined && primary_topic !== null && typeof primary_topic !== 'number') {
        return res.status(400).json({ success: false, message: 'Primary topic must be a number' });
    }
    if (authors !== undefined && !Array.isArray(authors)) {
        return res.status(400).json({ success: false, message: 'Authors must be an array of author IDs' });
    }
    if (Array.isArray(authors) && !authors.every(id => Number.isInteger(id))) {
        return res.status(400).json({ success: false, message: 'Each author ID must be an integer' });
    }
    if (keywords !== undefined && !Array.isArray(keywords)) {
        return res.status(400).json({ success: false, message: 'Keywords must be an array of strings' });
    }
    if (Array.isArray(keywords) && !keywords.every(kw => typeof kw === 'string')) {
        return res.status(400).json({ success: false, message: 'Each keyword must be a string' });
    }
    if (sub_topic !== undefined && !Array.isArray(sub_topic)) {
        return res.status(400).json({ success: false, message: 'Sub_topic must be an array of strings or IDs' });
    }
    if (Array.isArray(sub_topic) && !sub_topic.every(item => typeof item === 'string' || Number.isInteger(item))) {
        return res.status(400).json({ success: false, message: 'Each sub_topic item must be a string or integer' });
    }

    try {
        // 1. Kiểm tra tác giả có tồn tại không trước khi tạo bài viết
        if (authors && authors.length > 0) {
            const authorIdsNotExist = await checkAuthorsExistence(authors);
            if (authorIdsNotExist.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: `Các tác giả với ID sau không tồn tại: ${authorIdsNotExist.join(', ')}`
                });
            }
        }

        // 2. Tạo bài viết gốc
        const newArticle = await articleService.createArticle({
            version,
            issue_id,
            title,
            abstract,
            publication_year,
            doi,
            primary_topic: primary_topic == 0 ? null : primary_topic
        });

        // 3. Tạo các quan hệ đồng bộ (Đã áp dụng unnest tối ưu ở các bước trước)
        await createAuthorArticleRelationships(newArticle.article_id, authors || []);
        await createSubTopicArticleRelationships(newArticle.article_id, sub_topic || [], primary_topic == 0 ? null : primary_topic);

        if (keywords && keywords.length > 0) {
            await addKeywordsToArticle(newArticle.article_id, keywords);
        }

        return res.status(201).json({
            success: true,
            message: "Bài báo đã được tạo thành công!",
            data: newArticle
        });

    } catch (error) {
        logger.error('Lỗi khi validate và tạo dữ liệu bài báo:', error);
        if (error.statusCode === 400) {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }
        return res.status(500).json({
            success: false,
            message: "Có lỗi xảy ra ở Server!"
        });
    }
};