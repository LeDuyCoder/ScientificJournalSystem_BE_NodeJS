import pool from '../config/database.js';
import logger from '../utils/logger.js';

/**
 * Kiểm tra sự tồn tại của người dùng dựa trên user_id (UUID).
 * @param {string} userId - UUID của người dùng.
 * @returns {Promise<boolean>}
 */
export const userExists = async (userId) => {
  try {
    const query = `SELECT 1 FROM "user" WHERE user_id = $1 LIMIT 1`;
    const result = await pool.query(query, [userId]);
    return result.rows.length > 0;
  } catch (error) {
    logger.error(`[Statistics Repository] Lỗi kiểm tra userExists (id: ${userId}):`, error.message);
    throw error;
  }
};

/**
 * Kiểm tra xem project có thuộc về user hay không.
 * @param {string|number} projectId - ID của project.
 * @param {string} userId - UUID của người dùng.
 * @returns {Promise<boolean>}
 */
export const projectBelongsToUser = async (projectId, userId) => {
  try {
    const query = `SELECT 1 FROM "Project" WHERE project_id = $1 AND user_id = $2 LIMIT 1`;
    const result = await pool.query(query, [BigInt(projectId), userId]);
    return result.rows.length > 0;
  } catch (error) {
    logger.error(`[Statistics Repository] Lỗi kiểm tra projectBelongsToUser (projectId: ${projectId}, userId: ${userId}):`, error.message);
    throw error;
  }
};

/**
 * Lấy danh sách thống kê số bài báo xuất bản theo năm của các project thuộc về user.
 * Hỗ trợ lọc theo projectId cụ thể và khoảng năm (fromYear, toYear).
 *
 * @param {Object} params
 * @param {string} params.userId - UUID của người dùng.
 * @param {string|number|null} params.projectId - ID của project (optional).
 * @param {number|null} params.fromYear - Năm bắt đầu (optional).
 * @param {number|null} params.toYear - Năm kết thúc (optional).
 * @returns {Promise<Array<Object>>}
 */
export const getPublicationTrendsByUserProjects = async ({ userId, projectId, fromYear, toYear }) => {
  try {
    // 1. Xác định các projects thuộc userId cần lấy bài báo
    // 2. Lấy các Volume, Issue, Article tương ứng qua Project_Journal -> Journal
    // 3. Sử dụng COALESCE để giải quyết fallback năm: Article -> Issue -> Volume
    // 4. Lọc theo is_deleted của Article
    const query = `
      WITH scoped_projects AS (
        SELECT p.project_id, p.subject_area
        FROM "Project" p
        WHERE p.user_id = $1
          AND ($2::bigint IS NULL OR p.project_id = $2::bigint)
      ),
      matched_articles AS (
        -- 1. Tìm article theo Project_Keyword
        SELECT a.article_id, a.publication_year, i.publication_year as issue_year, v.publication_year as vol_year, a.is_deleted
        FROM scoped_projects sp
        JOIN "Project_Keyword" pk ON pk.project_id = sp.project_id
        JOIN "Keyword_Article" ka ON ka.keyword_id = pk.keyword_id
        JOIN "Article" a ON a.article_id = ka.article_id
        JOIN "Issue" i ON i.issue_id = a.issue_id
        JOIN "Volume" v ON v.volume_id = i.volume_id
        UNION
        -- 2. Tìm article theo Project_Journal
        SELECT a.article_id, a.publication_year, i.publication_year as issue_year, v.publication_year as vol_year, a.is_deleted
        FROM scoped_projects sp
        JOIN "Project_Journal" pj ON pj.project_id = sp.project_id
        JOIN "Volume" v ON v.journal_id = pj.journal_id
        JOIN "Issue" i ON i.volume_id = v.volume_id
        JOIN "Article" a ON a.issue_id = i.issue_id
        UNION
        -- 3. Tìm article theo Subject_Area của Project
        SELECT a.article_id, a.publication_year, i.publication_year as issue_year, v.publication_year as vol_year, a.is_deleted
        FROM scoped_projects sp
        JOIN "Subject_Category" sc ON sc.subject_area_id = sp.subject_area
        JOIN "Journal_Subject_Category" jsc ON jsc.subject_category_id = sc.subject_category_id
        JOIN "Volume" v ON v.journal_id = jsc.journal_id
        JOIN "Issue" i ON i.volume_id = v.volume_id
        JOIN "Article" a ON a.issue_id = i.issue_id
        WHERE sp.subject_area IS NOT NULL
      ),
      article_years AS (
        SELECT DISTINCT
          article_id,
          COALESCE(publication_year, issue_year, vol_year)::integer AS year
        FROM matched_articles
        WHERE (is_deleted = false OR is_deleted IS NULL)
          AND COALESCE(publication_year, issue_year, vol_year) IS NOT NULL
      )
      SELECT
        ay.year,
        COUNT(ay.article_id)::integer AS "totalPublications"
      FROM article_years ay
      WHERE ($3::integer IS NULL OR ay.year >= $3::integer)
        AND ($4::integer IS NULL OR ay.year <= $4::integer)
      GROUP BY ay.year
      ORDER BY ay.year ASC;
    `;

    const values = [
      userId,
      projectId ? BigInt(projectId) : null,
      fromYear ? parseInt(fromYear, 10) : null,
      toYear ? parseInt(toYear, 10) : null
    ];

    const result = await pool.query(query, values);
    return result.rows;
  } catch (error) {
    logger.error('[Statistics Repository] Lỗi lấy getPublicationTrendsByUserProjects:', error.message);
    throw error;
  }
};
