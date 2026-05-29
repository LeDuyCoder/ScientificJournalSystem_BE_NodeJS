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
                WHERE aa.author_id = $1
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

/**
 * Lấy danh sách bài viết của một tác giả với phân trang an toàn.
 *
 * - Chuyển `limit` và `page` sang các giá trị an toàn (`safeLimit`, `safePage`).
 * - Tính `OFFSET` từ `page` và `limit` rồi truy vấn cơ sở dữ liệu.
 *
 * @async
 * @param {number} authorId - ID tác giả cần lấy bài viết.
 * @param {number|string} [limit=10] - Số bài viết trên mỗi trang (hoặc chuỗi có thể parse được).
 * @param {number|string} [page=1] - Số trang (1-based) (hoặc chuỗi có thể parse được).
 * @returns {Promise<Array<Object>>} Mảng các bài viết, mỗi phần tử chứa các trường:
 * `{ article_id, title, abstract, publication_year, doi, primary_topic, created_at }`.
 * @throws {Error} Ném lỗi khi truy vấn DB gặp vấn đề; caller nên xử lý và log lỗi.
 */
export const getAuthorArticlesService = async (authorId, limit, page) => {
    try {
        const queryText = `
            SELECT 
                a.article_id,
                a.title,
                a.abstract,
                a.publication_year,
                a.doi,
                a.primary_topic,
                a.created_at
            FROM "Article" a
            JOIN "Author_Article" aa ON a.article_id = aa.article_id
            WHERE aa.author_id = $1
            ORDER BY a.publication_year DESC, a.article_id DESC
            LIMIT $2 OFFSET $3
        `;
        
        const safeLimit = Math.max(1, parseInt(limit) || 10);
        const safePage = Math.max(1, parseInt(page) || 1);
        const safeOffset = (safePage - 1) * safeLimit;

        const res = await pool.query(queryText, [authorId, safeLimit, safeOffset]);
        return res.rows;
    }
    catch (error) {
        logger.error('Lỗi khi lấy bài viết của tác giả:', error);
        throw error;
    }
}

/**
 * Lấy bảng xếp hạng tác giả với phân trang.
 *
 * @param {number|string} [limit=10] - Số lượng bản ghi trên mỗi trang.
 * @param {number|string} [page=1] - Số trang bắt đầu từ 1.
 * @returns {Promise<Array<Object>>} Danh sách tác giả và chỉ số xếp hạng.
 */
export const getAuthorLeaderboardService = async (limit, page) => {
    try{
        const queryText = `
            SELECT 
                author_id,
                orcid,
                display_name,
                url_image,
                -- Nếu NULL thì hiển thị là 0 cho đẹp mắt trên giao diện
                COALESCE(works_count, 0) AS works_count,
                COALESCE(cited_by_count, 0) AS cited_by_count,
                COALESCE(h_index, 0) AS h_index,
                COALESCE(i10_index, 0) AS i10_index,
                -- Tính toán số hạng từ hạng 1 trở xuống
                ROW_NUMBER() OVER (
                    ORDER BY 
                        h_index DESC NULLS LAST, 
                        cited_by_count DESC NULLS LAST, 
                        i10_index DESC NULLS LAST, 
                        works_count DESC NULLS LAST
                ) AS final_rank
            FROM "Author"
            ORDER BY final_rank ASC
            LIMIT $1 OFFSET $2;
        `;

        const safeLimit = Math.max(1, parseInt(limit) || 10);
        const safePage = Math.max(1, parseInt(page) || 1);
        const safeOffset = (safePage - 1) * safeLimit;

        const res = await pool.query(queryText, [safeLimit, safeOffset]);
        return res.rows;
    }catch (error) {
        logger.error('Lỗi khi lấy bảng xếp hạng tác giả:', error);
        throw error;
    }
}