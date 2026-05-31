import pool from '../config/database.js';
import logger from '../utils/logger.js';

/**
 * Tìm các bài báo có chứa các keyword người dùng nhập vào trên toàn hệ thống
 *
 * Luồng JOIN trong DB:
 *   Article → Keyword_Article → Keyword
 *
 * @param {string[]} keywords - Mảng tên keyword (ví dụ: ["Machine Learning", "Deep Learning"])
 * @param {number} limit - Số bài tối đa trả về
 * @param {number} offset - Vị trí bắt đầu (dùng cho phân trang)
 * @returns {Array} Danh sách bài báo kèm keyword matched
 */
export const getArticlesByKeywords = async (keywords, limit = 20, offset = 0) => {
    const keywordPlaceholders = keywords
        .map((_, index) => `$${index + 3}`)
        .join(', ');

    const values = [limit, offset, ...keywords];

    const query = `
        SELECT DISTINCT
            a."article_id",
            a."title",
            a."abstract",
            a."publication_year",
            a."doi",
            a."created_at"
        FROM "Article" a
        JOIN "Keyword_Article" ka ON ka."article_id" = a."article_id"
        JOIN "Keyword" k         ON k."keyword_id"   = ka."keyword_id"
        WHERE LOWER(k."display_name") IN (${keywordPlaceholders})
        ORDER BY a."publication_year" DESC NULLS LAST, a."created_at" DESC
        LIMIT $1 OFFSET $2
    `;

    const result = await pool.query(query, values);
    return result.rows;
};

export const countArticlesByKeywords = async (keywords) => {
    const keywordPlaceholders = keywords
        .map((_, index) => `$${index + 1}`)
        .join(', ');

    const values = [...keywords];

    const query = `
        SELECT COUNT(DISTINCT a."article_id") AS "total"
        FROM "Article" a
        JOIN "Keyword_Article" ka ON ka."article_id" = a."article_id"
        JOIN "Keyword" k         ON k."keyword_id"   = ka."keyword_id"
        WHERE LOWER(k."display_name") IN (${keywordPlaceholders})
    `;

    const result = await pool.query(query, values);
    return parseInt(result.rows[0].total);
};

export const getTotalArticles = async () => {
    try {
        const query = `
            SELECT COUNT(*) AS total
            FROM "Article";
        `;

        const result = await pool.query(query);

        return parseInt(result.rows[0].total, 10);
    } catch (error) {
        logger.error('Lỗi khi đếm tổng số bài báo:', error);
        throw error;
    }
};

export const getAllArticles = async (limit = 20, offset = 0, sortBy = 'created_at', sortOrder = 'DESC') => {
    try {
        // Whitelist allowed columns to prevent SQL injection
        const allowedColumns = ['article_id', 'title', 'publication_year', 'created_at', 'doi'];
        const column = allowedColumns.includes(sortBy) ? sortBy : 'created_at';
        const order = ['ASC', 'DESC'].includes(sortOrder) ? sortOrder : 'DESC';

        const query = `
            SELECT 
                article_id,
                version,
                issue_id,
                title,
                abstract,
                publication_year,
                doi,
                primary_topic,
                created_at
            FROM "Article"
            ORDER BY "${column}" ${order}
            LIMIT $1 OFFSET $2;
        `

        const result = await pool.query(query, [limit, offset]);
        return result.rows;
    }catch (error) {
        logger.error('Lỗi khi lấy tất cả bài báo:', error);
        throw error;
    }
}

export const getArticleById = async (articleId) => {
    try {
        const query = `
            SELECT 
                article_id,
                version,
                issue_id,
                title,
                abstract,
                publication_year,
                doi,
                primary_topic,
                created_at
            FROM "Article"
            WHERE "article_id" = $1;
        `;

        const result = await pool.query(query, [articleId]);
        return result.rows[0];
    } catch (error) {
        logger.error('Lỗi khi lấy thông tin bài báo theo ID:', error);
        throw error;
    }
}

export const createArticle = async (articleData) => {
    try {
        const {
            version = null,
            issue_id = null,
            title,            // Bắt buộc (NOT NULL trong schema)
            abstract = null,
            publication_year, // Bắt buộc (NOT NULL trong schema)
            doi = null,
            primary_topic = null
        } = articleData;

        // Kiểm tra nhanh các trường bắt buộc ở tầng ứng dụng
        if (!title || publication_year === undefined) {
            throw new Error('Title and publication_year are required fields.');
        }

        const query = `
            INSERT INTO "Article" (
                version, 
                issue_id, 
                title, 
                abstract, 
                publication_year, 
                doi, 
                primary_topic
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *; -- Trả về toàn bộ thông tin dòng vừa tạo (bao gồm cả article_id và created_at)
        `;

        const values = [
            version,
            issue_id,
            title,
            abstract,
            publication_year,
            doi,
            primary_topic
        ];

        const result = await pool.query(query, values);
        return result.rows[0]; // Trả về object article vừa tạo

    } catch (error) {
        logger.error('Error creating article:', error);
        throw error;
    }
};