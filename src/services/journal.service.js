import pool from "../config/database.js";

/**
 * Lấy danh sách journal có hỗ trợ tìm kiếm theo tên và phân trang.
 *
 * @async
 * @param {Object} params - Tham số đầu vào.
 * @param {string} [params.search] - Tên journal cần tìm kiếm.
 * @param {number} [params.page=1] - Trang hiện tại.
 * @param {number} [params.limit=10] - Số lượng bản ghi mỗi trang.
 * @returns {Promise<{ items: Array<Object>, total: number }>} Danh sách journal và tổng số lượng bản ghi phù hợp.
 */
export const getJournals = async ({ search, page = 1, limit = 10 } = {}) => {
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.max(1, parseInt(limit, 10) || 10);
  const offset = (pageNum - 1) * limitNum;

  let query = `
    SELECT 
      journal_id::text AS journal_id,
      display_name,
      issn,
      type,
      coverage,
      is_open_access,
      is_oa_diamond
    FROM "Journal"
  `;
  
  let countQuery = `SELECT COUNT(*)::integer AS total FROM "Journal"`;
  
  const queryParams = [];
  const countParams = [];
  
  // 1. Xử lý phần WHERE (Dùng chung biến đếm để tránh lệch $1, $2)
  if (search && search.trim() !== '') {
    const searchTerm = `%${search.trim()}%`;
    
    queryParams.push(searchTerm); // Sẽ là $1 của query
    countParams.push(searchTerm); // Sẽ là $1 của countQuery
    
    query += ` WHERE display_name ILIKE $1`;
    countQuery += ` WHERE display_name ILIKE $1`;
  }

  // 2. Xử lý phần ORDER BY, LIMIT, OFFSET cho câu query chính
  // Xác định số thứ tự ($) tiếp theo dựa vào độ dài hiện tại của mảng queryParams
  const limitPlaceholder = `$${queryParams.length + 1}`;
  const offsetPlaceholder = `$${queryParams.length + 2}`;

  queryParams.push(limitNum, offset);
  query += ` ORDER BY display_name ASC LIMIT ${limitPlaceholder} OFFSET ${offsetPlaceholder}`;

  // 3. Thực thi song song
  const [itemsRes, countRes] = await Promise.all([
    pool.query(query, queryParams),
    pool.query(countQuery, countParams)
  ]);

  return {
    items: itemsRes.rows,
    total: countRes.rows[0]?.total || 0
  };
};

export const getJournalsById = async (id) => {
  try{
    const query = `
      SELECT 
        journal_id::text AS journal_id,
        display_name,
        issn,
        type,
        coverage,
        is_open_access,
        is_oa_diamond
      FROM "Journal"
      WHERE journal_id = $1
    `;

    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0];
  }catch(error){
    logger.error('Lỗi khi lấy danh sách journal trong catalog:', error);
    throw error;
  }
}