import pool from '../config/database.js';
import logger from '../utils/logger.js';

/**
 * Kiểm tra xem project có thuộc về user hay không.
 * (Tái sử dụng logic, tuy nhiên ở đây cung cấp một function riêng cho dashboard context).
 * 
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
    logger.error(`[Dashboard Repository] Lỗi kiểm tra projectBelongsToUser (projectId: ${projectId}, userId: ${userId}):`, error.message);
    throw error;
  }
};

/**
 * Lấy danh sách từ khóa thịnh hành theo tùy chọn bộ lọc và metric.
 * 
 * @param {Object} params
 * @param {string} params.userId - UUID của người dùng từ Access Token.
 * @param {number|null} params.projectId - ID của project (optional).
 * @param {number|null} params.fromYear - Năm xuất bản bắt đầu (optional).
 * @param {number|null} params.toYear - Năm xuất bản kết thúc (optional).
 * @param {string} params.metric - Metric cần tính (articleCount, citationCount, avgScore).
 * @param {number} params.limit - Số lượng từ khóa tối đa lấy ra.
 * @returns {Promise<Array<Object>>}
 */
export const getTrendingKeywords = async ({ userId, projectId, fromYear, toYear, metric, limit }) => {
  try {
    // Determine the sorting logic based on the requested metric
    let orderByClause = '';
    if (metric === 'articleCount') {
      orderByClause = '"articleCount" DESC, keyword ASC';
    } else if (metric === 'citationCount') {
      orderByClause = '"citationCount" DESC, keyword ASC';
    } else if (metric === 'avgScore') {
      orderByClause = '"avgScore" DESC, keyword ASC';
    } else {
      orderByClause = '"articleCount" DESC, keyword ASC';
    }

    const query = `
      WITH scoped_projects AS (
        SELECT p.project_id, p.subject_area
        FROM "Project" p
        WHERE p.user_id = $1
          AND ($2::bigint IS NULL OR p.project_id = $2::bigint)
      ), matched_articles AS (
        -- 1. Tìm article theo Project_Keyword
        SELECT a.article_id, a.publication_year, a.citation_count, a.is_deleted
        FROM scoped_projects sp
        JOIN "Project_Keyword" pk ON pk.project_id = sp.project_id
        JOIN "Keyword_Article" ka ON ka.keyword_id = pk.keyword_id
        JOIN "Article" a ON a.article_id = ka.article_id
        UNION
        -- 2. Tìm article theo Project_Journal
        SELECT a.article_id, a.publication_year, a.citation_count, a.is_deleted
        FROM scoped_projects sp
        JOIN "Project_Journal" pj ON pj.project_id = sp.project_id
        JOIN "Volume" v ON v.journal_id = pj.journal_id
        JOIN "Issue" i ON i.volume_id = v.volume_id
        JOIN "Article" a ON a.issue_id = i.issue_id
        UNION
        -- 3. Tìm article theo Subject_Area của Project
        SELECT a.article_id, a.publication_year, a.citation_count, a.is_deleted
        FROM scoped_projects sp
        JOIN "Subject_Category" sc ON sc.subject_area_id = sp.subject_area
        JOIN "Journal_Subject_Category" jsc ON jsc.subject_category_id = sc.subject_category_id
        JOIN "Volume" v ON v.journal_id = jsc.journal_id
        JOIN "Issue" i ON i.volume_id = v.volume_id
        JOIN "Article" a ON a.issue_id = i.issue_id
        WHERE sp.subject_area IS NOT NULL
      ), keyword_metrics AS (
        SELECT
          k.keyword_id,
          k.display_name AS keyword,
          COUNT(DISTINCT ma.article_id)::integer AS "articleCount",
          COALESCE(SUM(COALESCE(ma.citation_count, 0)), 0)::bigint AS "citationCount",
          COALESCE(AVG(ka.score), 0)::numeric AS "avgScore"
        FROM matched_articles ma
        JOIN "Keyword_Article" ka ON ka.article_id = ma.article_id
        JOIN "Keyword" k ON k.keyword_id = ka.keyword_id
        WHERE (ma.is_deleted = false OR ma.is_deleted IS NULL)
          AND ($3::integer IS NULL OR ma.publication_year >= $3::integer)
          AND ($4::integer IS NULL OR ma.publication_year <= $4::integer)
        GROUP BY k.keyword_id, k.display_name
      )
      SELECT *
      FROM keyword_metrics
      ORDER BY ${orderByClause}
      LIMIT $5::integer;
    `;

    const values = [
      userId,
      projectId ? BigInt(projectId) : null,
      fromYear ? parseInt(fromYear, 10) : null,
      toYear ? parseInt(toYear, 10) : null,
      limit ? parseInt(limit, 10) : 10
    ];

    const result = await pool.query(query, values);
    return result.rows;
  } catch (error) {
    logger.error('[Dashboard Repository] Lỗi lấy getTrendingKeywords:', error.message);
    throw error;
  }
};
