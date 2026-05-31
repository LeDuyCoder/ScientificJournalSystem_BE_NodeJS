import * as articleService from '../services/article.service.js';
import { checkAuthorsExistence, createAuthorArticleRelationships, updateAuthorArticleRelationships } from '../services/author.service.js';
import { issueExists } from '../services/issue.service.js';
import { addKeywordsToArticle, updateKeywordsToArticle } from '../services/keyword.service.js';
import { createSubTopicArticleRelationships, topicExists, updateSubTopicArticleRelationships } from '../services/topic.service.js';
import logger from '../utils/logger.js';

/**
 * Tìm kiếm bài báo theo danh sách từ khóa chuyên biệt.
 *
 * Method: GET /api/v1/articles (khi sử dụng `keywords` query) hoặc
 * GET /api/v1/articles/by-keywords.
 *
 * Query params:
 * - `keywords` (string, required): danh sách từ khóa, cách nhau bởi dấu phẩy.
 * - `limit` (number, optional): số phần tử trả về (mặc định 20).
 * - `page` (number, optional): trang (mặc định 1).
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @returns {Promise<import('express').Response>} JSON response với danh sách bài báo và phân trang
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
 * Lấy danh sách bài báo (public) hoặc tìm kiếm theo `search`.
 *
 * Query params:
 * - `search` (string, optional): tìm theo tiêu đề.
 * - `page` (number, optional): trang (mặc định 1).
 * - `limit` (number, optional): số phần tử mỗi trang (mặc định 10).
 * - `sortBy` (string, optional): trường sắp xếp.
 * - `sortOrder` (string, optional): `asc` hoặc `desc`.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @returns {Promise<import('express').Response>} JSON response với danh sách bài báo và phân trang
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
 * Router handler tổng hợp: chuyển hướng giữa chế độ tìm kiếm theo `keywords`
 * và chế độ public search.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @returns {Promise<import('express').Response>}
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
 * Lấy chi tiết một bài báo theo `article_id`.
 *
 * Path params:
 * - `id` (number, required): ID bài báo.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @returns {Promise<import('express').Response>} JSON response với chi tiết bài báo hoặc 404
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
 * Tạo mới một bài báo đầy đủ (kèm authors, keywords, sub_topic).
 *
 * Expected body (JSON):
 * - `title` (string, required)
 * - `publication_year` (number, required)
 * - `issue_id` (number, required)
 * - `abstract` (string, optional)
 * - `doi` (string, optional)
 * - `primary_topic` (number|null, optional)
 * - `sub_topic` (array[string|number], optional)
 * - `authors` (array[number], optional)
 * - `keywords` (object | array[string], optional)
 *    - object: mapping `keyword` -> `score` (number)
 *    - array: legacy list of keyword strings
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @returns {Promise<import('express').Response>} 201 with created article or appropriate error
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
    if (keywords !== undefined && keywords !== null) {
        if (Array.isArray(keywords)) {
            if (!keywords.every(kw => typeof kw === 'string')) {
                return res.status(400).json({ success: false, message: 'Each keyword must be a string when keywords is an array' });
            }
        } else if (typeof keywords === 'object') {
            const invalidKeyword = Object.entries(keywords).find(
                ([keyword, score]) => typeof keyword !== 'string' || keyword.trim() === '' || typeof score !== 'number'
            );
            if (invalidKeyword) {
                return res.status(400).json({ success: false, message: 'Keywords must be an object mapping string keyword names to numeric scores' });
            }
        } else {
            return res.status(400).json({ success: false, message: 'Keywords must be an array or object' });
        }
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

        const hasKeywords = keywords && (Array.isArray(keywords) ? keywords.length > 0 : Object.keys(keywords).length > 0);
        if (hasKeywords) {
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

/**
 * Cập nhật thông tin bài báo theo ID (PUT).
 *
 * Path params:
 * - `id` (number, required): ID bài báo cần cập nhật
 *
 * Body: bất kỳ trường nào trong createArticle có thể được gửi để cập nhật.
 * Hỗ trợ `authors`, `keywords` (object mapping keyword->score hoặc array of strings), `sub_topic`.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @returns {Promise<import('express').Response>} 200 with updated article or error
 */
export const updateArticle = async (req, res) => {
    const { id } = req.params;
    const dataBody = req.body;

    try {
        const article = await articleService.getArticleById(id);
        if (!article) {
            return res.status(404).json({ success: false, message: 'Article not found' });
        }
        const updatedArticle = await articleService.updateArticle({ 
            article_id: article.article_id, 
            ...dataBody 
        });

        if (dataBody.sub_topic !== undefined) {
            if (!Array.isArray(dataBody.sub_topic)) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'sub_topic phải là mảng' 
                });
            }
        }

        if (dataBody.authors !== undefined) {
            if (!Array.isArray(dataBody.authors)) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'authors phải là mảng' 
                });
            }

            await updateAuthorArticleRelationships(id, dataBody.authors);
        }

        if (dataBody.keywords !== undefined) {
            if (Array.isArray(dataBody.keywords)) {
                if (!dataBody.keywords.every(kw => typeof kw === 'string')) {
                    return res.status(400).json({ 
                        success: false,
                        message: 'Each keyword must be a string when keywords is an array' 
                    });
                }
            } else if (dataBody.keywords !== null && typeof dataBody.keywords === 'object') {
                const invalidKeyword = Object.entries(dataBody.keywords).find(
                    ([keyword, score]) => typeof keyword !== 'string' || keyword.trim() === '' || typeof score !== 'number'
                );
                if (invalidKeyword) {
                    return res.status(400).json({ 
                        success: false,
                        message: 'Keywords must be an object mapping string keyword names to numeric scores' 
                    });
                }
            } else {
                return res.status(400).json({ 
                    success: false,
                    message: 'Keywords must be an array or object' 
                });
            }

            await updateKeywordsToArticle(id, dataBody.keywords);
        }
    
        return res.status(200).json({
            success: true,
            message: 'Article updated successfully',
            data: updatedArticle
        });

    } catch (error) {
        if (error.message && error.message.startsWith('VALIDATION_ERROR:')) {
            const cleanMessage = error.message.replace('VALIDATION_ERROR: ', '');
            return res.status(400).json({ 
                success: false, 
                message: cleanMessage 
            });
        }

        // TRƯỜNG HỢP 2: Lỗi hệ thống bất khả kháng (Rớt mạng DB, lỗi cú pháp, sập nguồn...)
        return res.status(500).json({ 
            success: false, 
            message: 'Internal server error' // Giấu lỗi kỹ thuật với người dùng cuối để bảo mật
        });
    }
};