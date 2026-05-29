import pool from "../config/database.js";
import logger from "../utils/logger.js"


/**
 * Lấy thông tin tác giả theo ID
 * @param {number} authorId 
 * @returns {Promise<Object>} Thông tin tác giả
 */
export const getAuthorById = async (authorId) => {
    try {
        const queryText = `SELECT * FROM "Author" WHERE "author_id" = $1`;
        const res = await pool.query(queryText, [authorId]);
        return res.rows[0];
    }
    catch (error) {
        logger.error('Lỗi khi lấy thông tin tác giả theo ID:', error);
        throw error;
    }
}

/**
 * Phân tích danh mục chuyên ngành (Subject Category) nghiên cứu của một tác giả
 * @async
 * @param {number|string} authorId - ID của tác giả cần thống kê
 * @returns {Promise<Array>} Mảng danh sách chuyên ngành, sản lượng bài báo và tỷ lệ %
 */
export const getAuthorAreasBreakdownService = async (authorId) => {
    try {
        const queryText = `
            WITH author_category_stats AS (
                SELECT 
                    sc.subject_category_id,
                    sc.display_name AS raw_category_name,
                    COUNT(DISTINCT a.article_id) AS total_articles
                FROM "Author_Article" aa
                JOIN "Article" a ON aa.article_id = a.article_id
                JOIN "Issue" i ON a.issue_id = i.issue_id
                JOIN "Volume" v ON i.volume_id = v.volume_id
                JOIN "Journal" j ON v.journal_id = j.journal_id
                JOIN "Journal_Subject_Category" jsc ON j.journal_id = jsc.journal_id
                JOIN "Subject_Category" sc ON jsc.subject_category_id = sc.subject_category_id
                WHERE aa.author_id = $1 -- 🌟 Đã chuyển thành tham số động $1 an toàn
                GROUP BY sc.subject_category_id, sc.display_name
            )
            SELECT 
                subject_category_id,
                raw_category_name AS category_name,
                total_articles AS article_count,
                ROUND(
                    (total_articles::numeric / NULLIF(SUM(total_articles) OVER (), 0)) * 100, 
                    2
                )::float AS percentage
            FROM author_category_stats
            ORDER BY total_articles DESC;
        `;

        const res = await pool.query(queryText, [authorId]);
        
        return res.rows;
    } catch (error) {
        logger.error('Xuất hiện lỗi khi phân tích lĩnh vực nghiên cứu của tác giả:', error);
        throw error;
    }
};