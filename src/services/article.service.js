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
          AND a."is_deleted" = false
        ORDER BY a."publication_year" DESC NULLS LAST, a."created_at" DESC
        LIMIT $1 OFFSET $2
    `;

    const result = await pool.query(query, values);
    return result.rows;
};

/**
 * Đếm số bài báo khớp với danh sách từ khóa (case-insensitive).
 *
 * @param {string[]} keywords - Mảng tên keyword (sẽ được so sánh bằng LOWER)
 * @returns {Promise<number>} Tổng số bài báo khớp
 */
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
          AND a."is_deleted" = false
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
    let query = `SELECT COUNT(*) AS "total" FROM "Article" a WHERE a."is_deleted" = false`;
    const values = [];

    if (search) {
        query += ` AND a."title" ILIKE $1`;
        values.push(`%${search}%`);
    }

    const result = await pool.query(query, values);
    return parseInt(result.rows[0].total);
};

/**
 * Đếm tổng số bài báo chưa bị xóa trong hệ thống.
 *
 * @returns {Promise<number>} Tổng số bài báo
 */
export const getTotalArticles = async () => {
    try {
        const query = `SELECT COUNT(*) AS total FROM "Article" WHERE "is_deleted" = false;`;
        const result = await pool.query(query);
        return parseInt(result.rows[0].total, 10);
    } catch (error) {
        logger.error('Lỗi khi đếm tổng số bài báo:', error);
        throw error;
    }
};

/**
 * Lấy danh sách bài báo hỗ trợ hai kiểu gọi:
 * 1) `getAllArticles({ limit, offset, search })` — dùng cho public search
 * 2) `getAllArticles(limit, offset, sortBy, sortOrder)` — dùng cho admin/sort
 *
 * @param {Object|number} [firstParam={}] - Object chứa {limit, offset, search} hoặc numeric limit
 * @param {number} [offsetParam=0] - Offset khi gọi theo tham số rời
 * @param {string} [sortByParam='created_at'] - Trường sắp xếp khi gọi theo tham số rời
 * @param {string} [sortOrderParam='DESC'] - Thứ tự sắp xếp (ASC|DESC)
 * @returns {Promise<Array>} Mảng các bản ghi bài báo
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
                  AND a."is_deleted" = false
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
                WHERE "is_deleted" = false
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
 * Lấy thông tin chi tiết một bài báo theo `article_id`.
 * Lưu ý: Trả về cả bài báo đã bị xóa mềm (is_deleted = true).
 *
 * @param {number|string} articleId - ID bài báo
 * @returns {Promise<Object|null>} Bản ghi bài báo hoặc `null` nếu không tồn tại
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
                is_deleted,
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
 * Tạo mới một bản ghi bài báo (dữ liệu thô) và trả về record vừa tạo.
 *
 * @param {Object} articleData - Dữ liệu bài báo
 * @param {string} articleData.title - Tiêu đề (bắt buộc)
 * @param {number} articleData.publication_year - Năm xuất bản (bắt buộc)
 * @param {number} [articleData.issue_id]
 * @param {string} [articleData.abstract]
 * @param {string} [articleData.doi]
 * @param {number|null} [articleData.primary_topic]
 * @returns {Promise<Object>} Bản ghi bài báo vừa tạo
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

/**
 * Cập nhật thông tin cốt lõi của bài báo (Tầng Service)
 * @param {Object} params 
 * @param {number|string} params.article_id - ID bài báo cần update (Bắt buộc)
 * @param {Object} params.updateData - Object chứa các trường muốn thay đổi từ req.body
 * @returns {Promise<Object|null>} Bản ghi sau khi update thành công
 */
export const updateArticle = async ({ article_id, ...updateData }) => {
    try {
        if (!article_id) {
            throw new Error('Thiếu article_id khi gọi hàm updateArticle Service.');
        }

        const currentQuery = `SELECT * FROM "Article" WHERE "article_id" = $1;`;
        const currentResult = await pool.query(currentQuery, [article_id]);
        const currentArticle = currentResult.rows[0];

        if (!currentArticle) {
            return null;
        }

        const { title, publication_year, version, issue_id, abstract, doi, primary_topic } = updateData;

        const fieldsToSet = [];
        const values = [article_id];

        if (title !== undefined) {
            const trimmedTitle = String(title).trim();
            if (trimmedTitle === '') {
                throw new Error('VALIDATION_ERROR: Tiêu đề không được để trống.');
            }
            if (trimmedTitle !== currentArticle.title) {
                fieldsToSet.push('title');
                values.push(trimmedTitle);
            }
        }

        if (publication_year !== undefined) {
            const yearNum = Number(publication_year);
            if (isNaN(yearNum) || yearNum <= 0) {
                throw new Error('VALIDATION_ERROR: Năm xuất bản phải là số dương hợp lệ.');
            }
            if (yearNum !== currentArticle.publication_year) {
                fieldsToSet.push('publication_year');
                values.push(yearNum);
            }
        }

        if (version !== undefined && version !== currentArticle.version) {
            fieldsToSet.push('version');
            values.push(version);
        }

        if (abstract !== undefined && abstract !== currentArticle.abstract) {
            fieldsToSet.push('abstract');
            values.push(abstract);
        }

        if (doi !== undefined && doi !== currentArticle.doi) {
            fieldsToSet.push('doi');
            values.push(doi);
        }

        if (issue_id !== undefined) {
            if (String(currentArticle.issue_id) === String(issue_id)) {
                throw new Error('VALIDATION_ERROR: Không thể cập nhật cùng một mã issue.');
            }
            
            const issueExistsResult = await issueExists(issue_id);
            if (!issueExistsResult) {
                throw new Error('VALIDATION_ERROR: Mã Issue ID không tồn tại trên hệ thống.');
            }

            fieldsToSet.push('issue_id');
            values.push(issue_id);
        }

        if (primary_topic !== undefined) {
            if (Number(primary_topic) === 0) {
                if (currentArticle.primary_topic !== null) {
                    fieldsToSet.push('primary_topic');
                    values.push(null);
                }
            } else {
                if (String(currentArticle.primary_topic) === String(primary_topic)) {
                    throw new Error('VALIDATION_ERROR: Không thể cập nhật cùng giá trị Primary Topic.');
                }

                const isTopicExists = await topicExists(primary_topic);
                if (!isTopicExists) {
                    throw new Error('VALIDATION_ERROR: Primary topic không tồn tại trên hệ thống.');
                }

                fieldsToSet.push('primary_topic');
                values.push(primary_topic);
            }
        }

        if (fieldsToSet.length === 0) {
            return currentArticle;
        }

        const setClause = fieldsToSet
            .map((field, index) => `"${field}" = $${index + 2}`)
            .join(', ');

        // 6. Thực thi câu lệnh UPDATE xuống Postgres
        const query = `
            UPDATE "Article"
            SET ${setClause}
            WHERE "article_id" = $1
            RETURNING 
                article_id,
                version,
                issue_id,
                title,
                abstract,
                publication_year,
                doi,
                primary_topic,
                created_at;
        `;

        const result = await pool.query(query, values);
        return result.rows[0] || null;

    } catch (error) {
        throw error; // Quăng lỗi lên để Controller bắt lấy và trả về res.status
    }
};

/**
 * Xóa mềm một bản ghi bài báo dựa trên ID (Chuyển is_deleted thành TRUE).
 *
 * @param {number|string} articleId - ID của bài báo cần xóa mềm
 * @returns {Promise<Object|null>} Bản ghi bài báo sau khi được cập nhật xóa mềm, hoặc null nếu không tìm thấy
 */
export const deleteArticle = async (articleId) => {
    try {
        // Kiểm tra đầu vào bắt buộc
        if (!articleId) {
            throw new Error('Article ID is required for deletion.');
        }

        const query = `
            UPDATE "Article"
            SET "is_deleted" = TRUE
            WHERE "article_id" = $1 AND "is_deleted" = FALSE
            RETURNING *;
        `;

        const values = [articleId];

        const result = await pool.query(query, values);

        // Nếu cập nhật thành công, result.rows[0] sẽ chứa thông tin bài báo kèm theo is_deleted = true
        // Nếu bài báo đã bị xóa mềm từ trước hoặc không tồn tại, result.rows[0] sẽ là undefined
        return result.rows[0] || null;

    } catch (error) {
        logger.error(`Error soft-deleting article with ID ${articleId}:`, error);
        throw error;
    }
};

/**
 * Khôi phục một bài báo đã bị xóa mềm (Chuyển is_deleted thành FALSE).
 *
 * @param {number|string} articleId - ID của bài báo cần khôi phục
 * @returns {Promise<Object|null>} Bản ghi bài báo sau khi khôi phục, hoặc null nếu không tìm thấy
 */
export const restoreArticle = async (articleId) => {
    try {
        // Kiểm tra đầu vào bắt buộc
        if (!articleId) {
            throw new Error('Article ID is required for restoration.');
        }

        const query = `
            UPDATE "Article"
            SET "is_deleted" = FALSE
            WHERE "article_id" = $1 AND "is_deleted" = TRUE
            RETURNING *;
        `;

        const values = [articleId];

        const result = await pool.query(query, values);

        // Nếu cập nhật thành công, result.rows[0] sẽ chứa thông tin bài báo kèm theo is_deleted = false
        // Nếu bài báo không bị xóa hoặc không tồn tại, result.rows[0] sẽ là undefined
        return result.rows[0] || null;

    } catch (error) {
        logger.error(`Error restoring article with ID ${articleId}:`, error);
        throw error;
    }
};