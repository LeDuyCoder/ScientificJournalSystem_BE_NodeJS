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
/**
 * Get Articles By Keywords.
 * @param {any} keywords
 * @param {any} limit
 * @param {any} offset
 * @returns {Promise<any>}
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

/**
 * Count Articles By Keywords.
 * @param {any} keywords
 * @returns {Promise<any>}
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
    `;

    const result = await pool.query(query, values);
    return parseInt(result.rows[0].total);
};

/**
 * Đếm tổng số bài báo công khai (hỗ trợ lọc theo title khi search)
 * @param {Object} params
 * @param {string} [params.search] - Từ khóa tìm kiếm theo title
 */
/**
 * Count All Articles.
 * @param {any} { search
 * @returns {Promise<any>}
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
/**
 * Get Total Articles.
 * @returns {Promise<any>}
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
/**
 * Get All Articles.
 * @param {any} firstParam
 * @param {any} offsetParam
 * @param {any} sortByParam
 * @param {any} sortOrderParam
 * @returns {Promise<any>}
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
/**
 * Get Article By Id.
 * @param {any} articleId
 * @returns {Promise<any>}
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
/**
 * Create Article.
 * @param {any} articleData
 * @returns {Promise<any>}
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
/**
 * Update Article.
 * @param {any} { article_id
 * @param {any} ...updateData }
 * @returns {Promise<any>}
 */
export const updateArticle = async ({ article_id, ...updateData }) => {
    try {
        if (!article_id) {
            throw new Error('Thiếu article_id khi gọi hàm updateArticle Service.');
        }

        // 1. Lấy dữ liệu hiện tại trong DB để so sánh logic trùng lặp
        const currentQuery = `SELECT * FROM "Article" WHERE "article_id" = $1;`;
        const currentResult = await pool.query(currentQuery, [article_id]);
        const currentArticle = currentResult.rows[0];

        if (!currentArticle) {
            return null; // Không tìm thấy bài báo
        }

        // 2. Tách các trường dữ liệu đầu vào
        const { title, publication_year, version, issue_id, abstract, doi, primary_topic } = updateData;

        // Khởi tạo các biến xây dựng câu lệnh SQL động
        const fieldsToSet = [];
        const values = [article_id]; // $1 luôn là article_id

        // 3. KIỂM TRA LOGIC TỪNG TRƯỜNG DỮ LIỆU

        // --- Trường: title ---
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

        // --- Trường: publication_year ---
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

        // --- Trường: version ---
        if (version !== undefined && version !== currentArticle.version) {
            fieldsToSet.push('version');
            values.push(version);
        }

        // --- Trường: abstract ---
        if (abstract !== undefined && abstract !== currentArticle.abstract) {
            fieldsToSet.push('abstract');
            values.push(abstract);
        }

        // --- Trường: doi ---
        if (doi !== undefined && doi !== currentArticle.doi) {
            fieldsToSet.push('doi');
            values.push(doi);
        }

        // --- Trường: issue_id ---
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

        // --- Trường: primary_topic ---
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

        // 4. Nếu người dùng gửi dữ liệu lên nhưng không có bất kỳ thay đổi nào so với DB
        if (fieldsToSet.length === 0) {
            return currentArticle; // Trả về luôn dữ liệu hiện tại, không cần chạy lệnh UPDATE
        }

        // 5. Xây dựng chuỗi SET động cho SQL (Ví dụ: "title" = $2, "version" = $3)
        const setClause = fieldsToSet
            .map((field, index) => `"${field}" = $${index + 2}`) // index + 2 vì $1 là article_id
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