import pool from '../config/database.js';
import logger from '../utils/logger.js';

/**
 * Lấy số liệu thống kê tổng quan cho Admin Dashboard.
 * Đếm tổng số Journal, Article, lượng dữ liệu được đồng bộ/thêm mới trong ngày hôm nay (growth), 
 * và tổng số lượng người dùng đang hoạt động.
 *
 * @async
 * @returns {Promise<{
 *   total_journals: number,
 *   journal_growth: number,
 *   total_articles: number,
 *   article_growth: number,
 *   pending_reviews: number,
 *   active_users: number
 * }>} Đối tượng chứa các số liệu thống kê tổng quan.
 * @throws {Error} Ném lỗi nếu quá trình truy vấn CSDL thất bại.
 */
export const summary = async () => {
    try {
        const journalsQuery = `
            SELECT 
                COUNT(*) AS total,
                COUNT(*) FILTER (WHERE works_synced_at >= CURRENT_DATE) AS today_count
            FROM "Journal" 
            WHERE is_deleted = false;
        `;
        const articlesQuery = `
            SELECT 
                COUNT(*) AS total,
                COUNT(*) FILTER (WHERE semantic_synced_at >= CURRENT_DATE) AS today_count
            FROM "Article" 
            WHERE is_deleted = false;
        `;
        const usersQuery = `SELECT COUNT(*) AS total FROM "user" WHERE status = 'ACTIVE';`;

        const [journalsRes, articlesRes, usersRes] = await Promise.all([
            pool.query(journalsQuery),
            pool.query(articlesQuery),
            pool.query(usersQuery)
        ]);

        const journalToday = parseInt(journalsRes.rows[0].today_count, 10) || 0;
        
        const articleToday = parseInt(articlesRes.rows[0].today_count, 10) || 0;

        return {
            total_journals: parseInt(journalsRes.rows[0].total, 10),
            journal_growth: journalToday,
            total_articles: parseInt(articlesRes.rows[0].total, 10),
            article_growth: articleToday,
            pending_reviews: 0,
            active_users: parseInt(usersRes.rows[0].total, 10)
        };
    } catch (error) {
        logger.error('Lỗi khi lấy số liệu thống kê tổng quan (Admin):', error);
        throw error;
    }
};

/**
 * Lấy dữ liệu biểu đồ Publication Trends theo từng năm.
 * Sử dụng generate_series để đảm bảo luôn trả về đủ số năm (mặc định 5 năm gần nhất) ngay cả khi không có dữ liệu.
 *
 * @async
 * @param {number|string} year - Năm làm mốc (mặc định là năm hiện tại)
 * @param {number|string} limit - Số lượng năm muốn thống kê (mặc định là 5)
 * @returns {Promise<{ target_year: number, items: Array<{year: number, manuscripts: number, published: number}> }>}
 */
export const getPublicationTrends = async (year, limit = 5) => {
    try {
        // Nếu không truyền year, lấy năm hiện tại
        const targetYear = parseInt(year, 10) || new Date().getFullYear();
        const limitYears = parseInt(limit, 10) || 5;

        // Dùng generate_series tạo danh sách các năm, sau đó LEFT JOIN với Article
        const query = `
            WITH years AS (
                SELECT generate_series($1::integer - $2::integer + 1, $1::integer) AS year
            )
            SELECT 
                y.year,
                COUNT(a.article_id)::integer AS manuscripts,
                -- Tạm thời để published là 0 do chưa có quy trình xuất bản cụ thể.
                -- Khi database có cột status, có thể thay bằng: COUNT(a.article_id) FILTER (WHERE a.status = 'PUBLISHED')::integer AS published
                0::integer AS published
            FROM years y
            LEFT JOIN "Article" a 
                ON a.publication_year = y.year 
                AND a.is_deleted = false
            GROUP BY y.year
            ORDER BY y.year ASC;
        `;

        const result = await pool.query(query, [targetYear, limitYears]);

        return {
            target_year: targetYear,
            items: result.rows
        };
    } catch (error) {
        logger.error('Lỗi khi lấy dữ liệu publication trends (Admin Service):', error);
        throw error;
    }
};

/**
 * Lấy danh sách trạng thái Volume & Issue cho Admin Dashboard, có phân trang.
 *
 * @async
 * @param {object} options - Tùy chọn truy vấn.
 * @param {number} [options.page=1] - Trang hiện tại.
 * @param {number} [options.limit=10] - Số lượng bản ghi trên mỗi trang.
 * @returns {Promise<{items: Array<object>, pagination: object}>}
 * @throws {Error} Ném lỗi nếu truy vấn CSDL thất bại.
 */
export const getVolumeIssueStatus = async ({ page = 1, limit = 10 }) => {
    try {
        const offset = (page - 1) * limit;

        const countQuery = `SELECT COUNT(*) FROM "Volume" WHERE is_deleted = false;`;
        const countResult = await pool.query(countQuery);
        const total = parseInt(countResult.rows[0].count, 10);

        const dataQuery = `
            SELECT 
                v.volume_id,
                v.volume_number,
                v.publication_year,
                j.display_name AS journal_name,
                COUNT(i.issue_id)::integer AS total_issues,
                'PUBLISHED' AS status,
                (v.volume_id % 10) * 10 + 10 AS progress
            FROM "Volume" v
            LEFT JOIN "Journal" j ON v.journal_id = j.journal_id
            LEFT JOIN "Issue" i ON v.volume_id = i.volume_id AND i.is_deleted = false
            WHERE v.is_deleted = false
            GROUP BY v.volume_id, j.display_name
            ORDER BY v.publication_year DESC, v.volume_number DESC
            LIMIT $1 OFFSET $2;
        `;

        const dataResult = await pool.query(dataQuery, [limit, offset]);

        return { items: dataResult.rows, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } };
    } catch (error) {
        logger.error('Lỗi khi lấy Volume & Issue Status (Admin Service):', error);
        throw error;
    }
};

/**
 * Lấy toàn bộ danh sách trạng thái Volume & Issue để export CSV.
 *
 * @async
 * @returns {Promise<Array<object>>}
 * @throws {Error} Ném lỗi nếu truy vấn CSDL thất bại.
 */
export const exportVolumeIssueStatus = async () => {
    try {
        const dataQuery = `
            SELECT 
                v.volume_id,
                v.volume_number,
                v.publication_year,
                j.display_name AS journal_name,
                COUNT(i.issue_id)::integer AS total_issues,
                'PUBLISHED' AS status,
                (v.volume_id % 10) * 10 + 10 AS progress
            FROM "Volume" v
            LEFT JOIN "Journal" j ON v.journal_id = j.journal_id
            LEFT JOIN "Issue" i ON v.volume_id = i.volume_id AND i.is_deleted = false
            WHERE v.is_deleted = false
            GROUP BY v.volume_id, j.display_name
            ORDER BY v.publication_year DESC, v.volume_number DESC;
        `;

        const dataResult = await pool.query(dataQuery);

        return dataResult.rows;
    } catch (error) {
        logger.error('Lỗi khi lấy dữ liệu Volume & Issue Status để export (Admin Service):', error);
        throw error;
    }
};

/**
 * Lấy danh sách người dùng (User) dành cho Admin, hỗ trợ tìm kiếm, lọc, sắp xếp và phân trang.
 *
 * @async
 * @param {object} options - Tùy chọn truy vấn.
 * @param {string} [options.search] - Từ khóa tìm kiếm (email, first_name, last_name).
 * @param {string} [options.role] - Lọc theo role.
 * @param {string} [options.status] - Lọc theo status.
 * @param {number} [options.page=1] - Trang hiện tại.
 * @param {number} [options.limit=10] - Số lượng bản ghi trên mỗi trang.
 * @param {string} [options.sortBy='created_at'] - Trường cần sắp xếp.
 * @param {'ASC'|'DESC'} [options.sortOrder='DESC'] - Thứ tự sắp xếp.
 * @returns {Promise<{items: Array<object>, pagination: object}>}
 * @throws {Error} Ném lỗi nếu truy vấn CSDL thất bại.
 */
export const getUsersList = async (options = {}) => {
    const {
        search,
        role,
        status,
        page = 1,
        limit = 10,
        sortBy = 'email',
        sortOrder = 'DESC'
    } = options;

    const offset = (page - 1) * limit;
    const queryParams = [];
    const whereClauses = [];
    let paramIndex = 1;

    if (search) {
        whereClauses.push(`(first_name ILIKE $${paramIndex} OR last_name ILIKE $${paramIndex} OR email ILIKE $${paramIndex})`);
        queryParams.push(`%${search}%`);
        paramIndex++;
    }

    if (role) {
        whereClauses.push(`role = $${paramIndex++}`);
        queryParams.push(role);
    }

    if (status) {
        whereClauses.push(`status = $${paramIndex++}`);
        queryParams.push(status);
    }

    const whereString = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    // Đảm bảo chỉ được sắp xếp trên các cột cho phép để tránh SQL Injection
    const allowedSortBy = ['email', 'first_name', 'last_name', 'role', 'status'];
    const safeSortBy = allowedSortBy.includes(sortBy) ? sortBy : 'email';
    const safeSortOrder = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const countQuery = `SELECT COUNT(*) FROM "user" ${whereString};`;
    const dataQuery = `
        SELECT user_id, email, type, status, role, last_name, first_name, url_image, date_of_birth, gender
        FROM "user"
        ${whereString}
        ORDER BY "${safeSortBy}" ${safeSortOrder}
        LIMIT $${paramIndex++} OFFSET $${paramIndex++};
    `;

    try {
        const countParams = queryParams.slice();
        const dataParams = [...queryParams, limit, offset];

        const [countResult, dataResult] = await Promise.all([
            pool.query(countQuery, countParams),
            pool.query(dataQuery, dataParams)
        ]);

        const total = parseInt(countResult.rows[0].count, 10);

        return { 
            items: dataResult.rows, 
            pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } 
        };
    } catch (error) {
        logger.error('Lỗi khi lấy danh sách User (Admin Service):', error);
        throw error;
    }
};

/**
 * Lấy thông tin chi tiết của một người dùng theo ID.
 *
 * @async
 * @param {string} userId - UUID của người dùng.
 * @returns {Promise<object|null>} Trả về đối tượng người dùng hoặc null nếu không tìm thấy.
 * @throws {Error} Ném lỗi nếu truy vấn CSDL thất bại.
 */
export const getUserDetailById = async (userId) => {
    try {
        const query = `
            SELECT user_id, email, type, status, role, last_name, first_name, url_image, date_of_birth, gender
            FROM "user"
            WHERE user_id = $1;
        `;
        const result = await pool.query(query, [userId]);

        if (result.rows.length === 0) {
            return null;
        }

        return result.rows[0];
    } catch (error) {
        logger.error(`Lỗi khi lấy chi tiết User ID ${userId} (Admin Service):`, error);
        throw error;
    }
};