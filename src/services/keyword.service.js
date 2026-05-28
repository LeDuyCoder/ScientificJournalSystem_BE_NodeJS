import pool from "../config/database.js";

const getTrendingKeywords = async (projectId, queryParams) => {
  // Giới hạn tối đa 100 kết quả, mặc định 20 nếu không truyền
  const limit = Math.min(parseInt(queryParams.limit) || 20, 100);

  // Chỉ chấp nhận sort_by là "count" hoặc "score", mặc định là "count"
  const sortBy = ["count", "score"].includes(queryParams.sort_by)
    ? queryParams.sort_by
    : "count";

  // Quyết định sắp xếp theo tần suất hoặc điểm score
  const orderClause =
    sortBy === "score"
      ? "avg_score DESC, count DESC" // ưu tiên điểm cao nhất
      : "count DESC, avg_score DESC"; // ưu tiên xuất hiện nhiều nhất

  const query = `
    SELECT 
      k.keyword_id,
      k.display_name                      AS keyword,
      COUNT(ka.article_id)                AS count,       -- đếm số lần xuất hiện
      ROUND(AVG(ka.score)::numeric, 2)    AS avg_score,   -- điểm trung bình
      ROUND(SUM(ka.score)::numeric, 2)    AS total_score  -- tổng điểm
    FROM "Keyword" k
    -- Lần lượt JOIN để tìm đường từ Keyword → Project
    JOIN "Keyword_Article" ka  ON ka.keyword_id  = k.keyword_id
    JOIN "Article" a           ON a.article_id   = ka.article_id
    JOIN "Issue" i             ON i.issue_id     = a.issue_id
    JOIN "Volume" v            ON v.volume_id    = i.volume_id
    JOIN "Journal" j           ON j.journal_id   = v.journal_id
    JOIN "Project_Journal" pj  ON pj.journal_id  = j.journal_id
    WHERE pj.project_id = $1       -- lọc đúng project
    GROUP BY k.keyword_id, k.display_name  -- gom nhóm theo từng keyword
    ORDER BY ${orderClause}        -- sắp xếp theo count hoặc score
    LIMIT $2;                      -- chỉ lấy tối đa 20
  `;

  // Thực thi query với projectId và limit
  const { rows } = await pool.query(query, [projectId, limit]);

  // Không có dữ liệu thì trả về mảng rỗng
  if (!rows.length) return { total: 0, keywords: [] };

  // Format và trả về kết quả
  return {
    total: rows.length,
    sort_by: sortBy,
    keywords: rows.map((k) => ({
      id: k.keyword_id,
      keyword: k.keyword,
      count: parseInt(k.count), // chuyển sang số nguyên
      avg_score: parseFloat(k.avg_score), // chuyển sang số thực
      total_score: parseFloat(k.total_score),
    })),
  };
};

export default { getTrendingKeywords };
