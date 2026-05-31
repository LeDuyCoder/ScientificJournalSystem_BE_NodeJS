import * as articleService from '../services/article.service.js';
import { checkAuthorsExistence, createAuthorArticleRelationships } from '../services/author.service.js';
import { addKeywordsToArticle } from '../services/keyword.service.js';
import { createSubTopicArticleRelationships } from '../services/topic.service.js';
import logger from '../utils/logger.js';

/**
 * API Handler: Tìm kiếm bài báo dựa trên danh sách từ khóa
 * Method: GET /api/v1/articles?keywords=...&limit=...&page=...
 * @param {import('express').Request} req - Đối tượng Request của Express (chứa req.query.keywords, limit, page)
 * @param {import('express').Response} res - Đối tượng Response của Express
 * @returns {Promise<import('express').Response>} Trả về JSON chứa danh sách bài báo và thông tin phân trang
 */
export const getArticlesByKeywords = async (req, res) => {
    try {
        // 1. Lấy keywords từ query string
        const rawKeywords = req.query.keywords;

        if (!rawKeywords || rawKeywords.trim() === '') {
            return res.status(400).json({
                success: false,
                message: "Vui lòng cung cấp tham số 'keywords' trong query string! Ví dụ: ?keywords=Machine Learning,Deep Learning"
            });
        }

        // 2. Tách chuỗi thành mảng và chuẩn hoá chữ thường
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

        // 3. Phân trang
        const limit = parseInt(req.query.limit) || 20;
        const page = parseInt(req.query.page) || 1;
        const offset = (page - 1) * limit;

        // 4. Gọi service (chạy song song 2 query để nhanh hơn)
        const [articles, total] = await Promise.all([
            articleService.getArticlesByKeywords(keywords, limit, offset),
            articleService.countArticlesByKeywords(keywords)
        ]);

        // 5. Trả response
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
 * API Handler: Lấy tất cả bài báo theo phân trang
 * Method: GET /api/v1/articles?limit=...&page=...&sortBy=...&sortOrder=...
 * @param {import('express').Request} req - Đối tượng Request của Express (chứa req.query.limit, req.query.page, req.query.sortBy, req.query.sortOrder)
 * @param {import('express').Response} res - Đối tượng Response của Express
 * @returns {Promise<import('express').Response>} Trả về JSON chứa danh sách bài báo và thông tin phân trang cơ bản
 */
export const getAllArticles = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 20;
        const page = parseInt(req.query.page) || 1;
        const offset = (page - 1) * limit;
        const sortBy = req.query.sortBy || 'created_at';
        const sortOrder = (req.query.sortOrder || 'DESC').toUpperCase();

        // Validate sortOrder
        if (!['ASC', 'DESC'].includes(sortOrder)) {
            return res.status(400).json({
                success: false,
                message: "Tham số 'sortOrder' phải là 'asc' hoặc 'desc'!"
            });
        }

        const articles = await articleService.getAllArticles(limit, offset, sortBy, sortOrder);
        const total = await articleService.getTotalArticles();

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
    } catch (error) {
        logger.error('Lỗi khi lấy tất cả bài báo:', error);
        return res.status(500).json({
            success: false,
            message: "Có lỗi xảy ra ở Server!"
        });
    }
}


/**
 * API Router Handler: Chuyển tiếp giữa tìm kiếm theo keyword và lấy toàn bộ bài báo.
 * Nếu query string không chứa `keywords` hoặc giá trị rỗng, sẽ trả về toàn bộ bài báo.
 * Ngược lại, sẽ gọi hàm tìm kiếm bài báo theo danh sách keywords.
 * @param {import('express').Request} req - Đối tượng Request của Express (chứa req.query.keywords, limit, page)
 * @param {import('express').Response} res - Đối tượng Response của Express
 * @returns {Promise<import('express').Response>} Trả về JSON từ `getAllArticles` hoặc `getArticlesByKeywords`
 */
export const getArticle = async (req, res) => {
    const rawKeywords = req.query.keywords;
    if (!rawKeywords || rawKeywords.trim() === '') {
        return getAllArticles(req, res);
    } else {
        return getArticlesByKeywords(req, res);
    }
}

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
}

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

    if (!title || title.trim() === '') {
        return res.status(400).json({
            success: false,
            message: 'Title is required'
        });
    }

    if (publication_year === undefined || publication_year === null) {
        return res.status(400).json({
            success: false,
            message: 'Publication year is required'
        });
    }

    if (typeof publication_year !== 'number') {
        return res.status(400).json({
            success: false,
            message: 'Publication year must be a number'
        });
    }

    if (issue_id !== undefined && issue_id !== null && typeof issue_id !== 'number') {
        return res.status(400).json({
            success: false,
            message: 'Issue ID must be a number'
        });
    }

    if (
        primary_topic !== undefined &&
        primary_topic !== null &&
        typeof primary_topic !== 'number'
    ) {
        return res.status(400).json({
            success: false,
            message: 'Primary topic must be a number'
        });
    }

    if (authors !== undefined && !Array.isArray(authors)) {
        return res.status(400).json({
            success: false,
            message: 'Authors must be an array of author IDs'
        });
    }

    if (Array.isArray(authors) && !authors.every(id => Number.isInteger(id))) {
        return res.status(400).json({
            success: false,
            message: 'Each author ID must be an integer'
        });
    }

    if (keywords !== undefined && !Array.isArray(keywords)) {
        return res.status(400).json({
            success: false,
            message: 'Keywords must be an array of strings'
        });
    }

    if (Array.isArray(keywords) && !keywords.every(kw => typeof kw === 'string')) {
        return res.status(400).json({
            success: false,
            message: 'Each keyword must be a string'
        });
    }

    if (sub_topic !== undefined && !Array.isArray(sub_topic)) {
        return res.status(400).json({
            success: false,
            message: 'Sub_topic must be an array of strings or IDs'
        });
    }

    if (Array.isArray(sub_topic) && !sub_topic.every(item => typeof item === 'string' || Number.isInteger(item))) {
        return res.status(400).json({
            success: false,
            message: 'Each sub_topic item must be a string or integer'
        });
    }

    try {
        // const newArticle = await articleService.createArticle({
        //     title,
        //     publication_year,
        //     version,
        //     issue_id,
        //     abstract,
        //     doi,
        //     primary_topic,
        //     sub_topic,
        //     authors,
        //     keywords
        // });
        // return res.status(201).json({
        //     success: true,
        //     message: "Bài báo đã được tạo thành công!",
        //     data: newArticle
        // });
        
        if(authors && authors.length > 0) {
            const authorIdsNotExist = await checkAuthorsExistence(authors);
            if (authorIdsNotExist.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: `Các tác giả với ID sau không tồn tại: ${authorIdsNotExist.join(', ')}`
                });
            }
        }

        const newArticle = await articleService.createArticle({
            version,
            issue_id,
            title,
            abstract,
            publication_year,
            doi,
            primary_topic: primary_topic == 0 ? null : primary_topic
        })

        await createAuthorArticleRelationships(newArticle.article_id, authors || []);
        await createSubTopicArticleRelationships(newArticle.article_id, sub_topic || [], primary_topic == 0 ? null : primary_topic);

        if(keywords && keywords.length > 0) {
            await addKeywordsToArticle(newArticle.article_id, keywords);
        }

        return res.status(201).json({
            success: true,
            message: "Bài báo đã được tạo thành công!",
            data: newArticle
        });

    } catch (error) {
        logger.error('Lỗi khi validate dữ liệu tạo bài báo:', error);
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