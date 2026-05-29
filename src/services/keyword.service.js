import pool from "../config/database.js";
import logger from "../utils/logger.js";

/**
 * Lấy Top 20 từ khóa trending của project
 */
const getTrendingKeywords = async (projectId, queryParams) => {
  const limit = Math.min(parseInt(queryParams.limit) || 20, 100);
  const sortBy = ["count", "score"].includes(queryParams.sort_by)
    ? queryParams.sort_by
    : "count";
  const orderClause =
    sortBy === "score"
      ? "avg_score DESC, count DESC"
      : "count DESC, avg_score DESC";

  const query = `
    SELECT 
      k.keyword_id,
      k.display_name                      AS keyword,
      COUNT(ka.article_id)                AS count,
      ROUND(AVG(ka.score)::numeric, 2)    AS avg_score,
      ROUND(SUM(ka.score)::numeric, 2)    AS total_score
    FROM "Project_Keyword" pk
    JOIN "Project" p          ON p.project_id  = pk.project_id
    JOIN "Keyword" k          ON k.keyword_id  = pk.keyword_id
    JOIN "Keyword_Article" ka ON ka.keyword_id = k.keyword_id
    JOIN "Article" a          ON a.article_id  = ka.article_id
    WHERE pk.project_id = $1
    GROUP BY k.keyword_id, k.display_name
    ORDER BY ${orderClause}
    LIMIT $2;
  `;

  const { rows } = await pool.query(query, [projectId, limit]);

  if (!rows.length) return { total: 0, keywords: [] };

  return {
    total: rows.length,
    sort_by: sortBy,
    keywords: rows.map((k) => ({
      id: k.keyword_id,
      keyword: k.keyword,
      count: parseInt(k.count),
      avg_score: parseFloat(k.avg_score),
      total_score: parseFloat(k.total_score),
    })),
  };
};

/**
 * Kiểm tra xem các keyword_ids có tồn tại trong bảng Keyword hay không
 * @param {Array<number|string>} keywordIds
 * @returns {Promise<boolean>}
 */
const validateKeywordIds = async (keywordIds) => {
  if (!keywordIds || keywordIds.length === 0) return true;
  
  const uniqueIds = [...new Set(keywordIds)];
  
  const query = `
    SELECT keyword_id
    FROM "Keyword"
    WHERE keyword_id = ANY($1::bigint[])
  `;
  const result = await pool.query(query, [uniqueIds]);
  return result.rows.length === uniqueIds.length;
};

/**
 * Cập nhật danh sách từ khóa theo dõi của dự án (chỉ thêm, không xóa)
 * @param {string|number} projectId 
 * @param {Array<number|string>} keywordIds 
 */
const syncWatchedKeywords = async (projectId, keywordIds) => {
  if (!keywordIds || keywordIds.length === 0) return true;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Loại bỏ duplicate từ input
    const uniqueIds = [...new Set(keywordIds)];

    // 2. Lấy danh sách keywords đã tồn tại cho project này
    const existingResult = await client.query(
      `SELECT keyword_id FROM "Project_Keyword" WHERE project_id = $1`,
      [projectId]
    );
    const existingIds = new Set(existingResult.rows.map(row => Number(row.keyword_id)));

    // 3. Lọc ra keywords mới (chưa tồn tại)
    const newKeywordIds = uniqueIds.filter(id => !existingIds.has(id));

    if (newKeywordIds.length === 0) {
      await client.query('COMMIT');
      return true; // Không có keywords mới để thêm
    }

    // 4. Validate keywords tồn tại trong bảng Keyword
    const validationResult = await client.query(
      `SELECT keyword_id FROM "Keyword" WHERE keyword_id = ANY($1::bigint[])`,
      [newKeywordIds]
    );
    const validIds = new Set(validationResult.rows.map(row => Number(row.keyword_id)));

    // 5. Chỉ INSERT những keywords hợp lệ
    const idsToInsert = newKeywordIds.filter(id => validIds.has(id));
    
    if (idsToInsert.length > 0) {
      for (const kwId of idsToInsert) {
        await client.query(
          `INSERT INTO "Project_Keyword" (project_id, keyword_id) VALUES ($1, $2)`,
          [projectId, kwId]
        );
      }
    }

    await client.query('COMMIT');
    return true;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

export default { getTrendingKeywords, validateKeywordIds, syncWatchedKeywords };
