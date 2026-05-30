import pool from '../config/database.js';

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

/**
 * Lấy danh sách bài báo toàn hệ thống với phân trang và tìm kiếm theo title.
 *
 * Luồng JOIN: Article → Issue → Volume → Journal
 *
 * @param {Object} params - Tham số truy vấn.
 * @param {number} params.limit - Số bài tối đa trả về.
 * @param {number} params.offset - Vị trí bắt đầu (phân trang).
 * @param {string} [params.search] - Từ khóa tìm kiếm theo title (không phân biệt hoa/thường).
 * @returns {Promise<Array<Object>>} Danh sách bài báo kèm thông tin journal.
 */
export const getAllArticles = async ({ limit = 10, offset = 0, search = '' }) => {
    let query = `
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
    `;

    const values = [];
    let paramIndex = 1;

    if (search) {
        query += ` WHERE a."title" ILIKE $${paramIndex}`;
        values.push(`%${search}%`);
        paramIndex++;
    }

    query += ` ORDER BY a."publication_year" DESC NULLS LAST, a."article_id" DESC`;
    query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    values.push(limit, offset);

    const result = await pool.query(query, values);
    return result.rows;
};

/**
 * Đếm tổng số bài báo (có thể lọc theo title).
 *
 * @param {Object} params - Tham số truy vấn.
 * @param {string} [params.search] - Từ khóa tìm kiếm theo title.
 * @returns {Promise<number>} Tổng số bài báo.
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
