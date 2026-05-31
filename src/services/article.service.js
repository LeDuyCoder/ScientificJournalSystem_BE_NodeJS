import pool from '../config/database.js';
import logger from '../utils/logger.js';

/**
 * Tìm các bài báo có chứa các keyword người dùng nhập vào trên toàn hệ thống
 * Luồng JOIN trong DB: Article → Keyword_Article → Keyword
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

/**
 * Đếm tổng số bài báo công khai (hỗ trợ lọc theo title khi search)
 * @param {Object} params
 * @param {string} [params.search] - Từ khóa tìm kiếm theo title
 */
export const countAllArticles = async ({ search = '' }) => {
    let query = `SELECT COUNT(*) AS "total" FROM "Article" a`;
    const values = [];

    if (search) {
        query += ` WHERE a."title" ILIKE $1`;
        values.push(`%${search}%`);
    }

    const result = await pool.query(query, values);
    return parseInt(result.rows[0].total);
};

/**
 * Đếm tổng số tất cả bài báo trong hệ thống (không kèm điều kiện lọc)
 */
export const getTotalArticles = async () => {
    try {
        const query = `SELECT COUNT(*) AS total FROM "Article";`;
        const result = await pool.query(query);
        return parseInt(result.rows[0].total, 10);
    } catch (error) {
        logger.error('Lỗi khi đếm tổng số bài báo:', error);
        throw error;
    }
};

/**
 * HÀM GỘP THÔNG MINH: Lấy danh sách bài báo toàn hệ thống.
 * Hỗ trợ đồng thời cả 2 dạng gọi từ Controller:
 * 1. Gọi kiểu Object để Search: getAllArticles({ limit, offset, search })
 * 2. Gọi kiểu tham số rời để Sort: getAllArticles(limit, offset, sortBy, sortOrder)
 */
export const getAllArticles = async (firstParam = {}, offsetParam = 0, sortByParam = 'created_at', sortOrderParam = 'DESC') => {
    try {
        let limit, offset, search, sortBy, sortOrder;

        // BƯỚC THẨM ĐỊNH: Kiểm tra xem controller đang gọi theo kiểu Bên 1 (Object) hay Bên 2 (Tham số rời)
        if (typeof firstParam === 'object' && firstParam !== null) {
            // Bên 1: Gọi dạng Object để search thông tin công khai kèm Journal thông qua LEFT JOIN
            limit = firstParam.limit !== undefined ? firstParam.limit : 10;
            offset = firstParam.offset !== undefined ? firstParam.offset : 0;
            search = (firstParam.search || '').trim();
            sortBy = 'publication_year'; // Fallback mặc định của bên 1
            sortOrder = 'DESC';
        } else {
            // Bên 2: Gọi dạng tham số rời để lấy danh sách quản lý sắp xếp động nâng cao
            limit = firstParam !== undefined ? firstParam : 20;
            offset = offsetParam;
            search = '';
            sortBy = sortByParam;
            sortOrder = sortOrderParam;
        }

        // Kiểm tra an toàn bảo mật cho các cột truyền vào sắp xếp (Chống SQL Injection độc hại)
        const allowedColumns = ['article_id', 'title', 'publication_year', 'created_at', 'doi'];
        const column = allowedColumns.includes(sortBy) ? sortBy : 'created_at';
        const order = ['ASC', 'DESC'].includes(sortOrder.toUpperCase()) ? sortOrder.toUpperCase() : 'DESC';

        let query = '';
        const values = [];

        if (search) {
            // Thực thi SQL dạng 1: Có chứa tính năng tìm kiếm văn bản và JOIN hệ thống tạp chí (Journal)
            query = `
                SELECT
                    a."article_id",
                    a."title",
                    a."abstract",
                    a."publication_year",
                    a."doi",
                    j."journal_id",
                    j."display_name" AS "journal_name"
                FROM "Article" a
                LEFT JOIN "Issue" i   ON i."issue_id"   = a."issue_id"
                LEFT JOIN "Volume" v  ON v."volume_id"  = i."volume_id"
                LEFT JOIN "Journal" j ON j."journal_id" = v."journal_id"
                WHERE a."title" ILIKE $1
                ORDER BY a."publication_year" DESC NULLS LAST, a."article_id" DESC
                LIMIT $2 OFFSET $3;
            `;
            values.push(`%${search}%`, limit, offset);
        } else {
            // Thực thi SQL dạng 2: Đọc danh sách cơ bản có khả năng đảo chiều Sort động (ASC / DESC)
            query = `
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
            `;
            values.push(limit, offset);
        }

        const result = await pool.query(query, values);
        return result.rows;

    } catch (error) {
        logger.error('Lỗi khi lấy tất cả bài báo (getAllArticles Service):', error);
        throw error;
    }
};

/**
 * Lấy thông tin chi tiết bài báo theo ID
 */
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
};

/**
 * Tạo mới một bản ghi bài báo gốc (Dữ liệu thô)
 */
export const createArticle = async (articleData) => {
    try {
        const {
            version = null,
            issue_id = null,
            title,            
            abstract = null,
            publication_year, 
            doi = null,
            primary_topic = null
        } = articleData;

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
            RETURNING *;
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
        return result.rows[0];

    } catch (error) {
        logger.error('Error creating article:', error);
        throw error;
    }
};