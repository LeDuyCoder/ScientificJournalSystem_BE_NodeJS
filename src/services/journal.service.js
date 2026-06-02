import pool from "../config/database.js";
import logger from "../utils/logger.js";
import { publisherExist } from "./publisher.service.js";
import { zoneExist } from "./zone.service.js";

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

/**
 * Tạo mới một journal.
 *
 * @async
 * @param {Object} data - Dữ liệu journal cần tạo.
 * @returns {Promise<Object>} Journal mới được tạo.
 */
export const createJournal = async (data) => {
  try {
    // Nhận các field từ object data truyền vào
    let {
      source_id, publisher_id, country, region, display_name,
      type, is_open_access, is_oa_diamond, coverage, issn, scope_detail
    } = data;

    // Chuẩn hóa dữ liệu sang null nếu trống
    source_id = source_id || null;
    publisher_id = publisher_id || null;
    country = country || null;
    region = region || null;
    display_name = display_name || null;
    type = type || null;
    is_open_access = is_open_access ?? null;
    is_oa_diamond = is_oa_diamond ?? null;
    coverage = coverage || null;
    issn = issn || null;
    scope_detail = scope_detail || null;
    const is_deleted = false; 

    const query = `
        INSERT INTO "Journal" (
            source_id, publisher_id, country, region, display_name,
            type, is_open_access, is_oa_diamond, coverage, issn, scope_detail, is_deleted
        ) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING *;
    `;

    const values = [
        source_id,
        publisher_id ? BigInt(publisher_id) : null,
        country ? BigInt(country) : null,
        region ? BigInt(region) : null,
        display_name, type, is_open_access, is_oa_diamond, coverage, issn, scope_detail, is_deleted
    ];

    const result = await pool.query(query, values);
    return result.rows[0];

  } catch (error) {
    throw error;
  }
};

//viết documentation cho hàm updateJournal
/**
  * Cập nhật thông tin một journal.
  * - Nhận ID của journal cần cập nhật và dữ liệu mới từ tham số đầu vào.
  * - Kiểm tra tính hợp lệ của ID (phải là số nguyên dương).
  * - Cập nhật các trường được phép trong database nếu chúng tồn tại trong dữ liệu mới.
  * - Trả về thông tin journal đã cập nhật nếu thành công, hoặc null nếu không tìm thấy journal với ID đó, hoặc lỗi nếu có lỗi hệ thống.
  * Các trường được phép cập nhật bao gồm: source_id, publisher_id, country, region, display_name, type, is_open_access, is_oa_diamond, coverage, issn, scope_detail. Các trường publisher_id, country, region sẽ được chuyển sang kiểu BigInt trước khi cập nhật.
  * @async
  * @param {number|string} id - ID của journal cần cập nhật (có thể là số hoặc chuỗi số).
  * @param {Object} data - Dữ liệu mới để cập nhật cho journal, có thể chứa một hoặc nhiều trường trong số các trường được phép cập nhật.
  * @returns {Promise<Object|null>} Thông tin journal đã được cập nhật nếu thành công, null nếu không tìm thấy journal với ID đó, hoặc lỗi nếu có lỗi hệ thống.
*/ 
export const updateJournal = async (id, data) => {
  try {
    const allowedFields = [
      'source_id', 'publisher_id', 'country', 'region', 'display_name',
      'type', 'is_open_access', 'is_oa_diamond', 'coverage', 'issn', 'scope_detail'
    ];

    const updateParts = [];
    const values = [];
    let placeholderIndex = 1;

    for (const field of allowedFields) {
      if (data[field] !== undefined && data[field] !== null) {
        let value = data[field];

        if (['publisher_id', 'country', 'region'].includes(field)) {
          value = BigInt(value);
        }

        updateParts.push(`"${field}" = $${placeholderIndex}`);
        values.push(value);
        placeholderIndex++;
      }
    }

    if (updateParts.length === 0) {
      logger.warn(`Không có trường nào hợp lệ để cập nhật cho journal ID ${id}`);
      return null; 
    }

    values.push(BigInt(id));
    const idPlaceholder = `$${placeholderIndex}`;

    const query = `
        UPDATE "Journal" 
        SET ${updateParts.join(', ')}
        WHERE journal_id = ${idPlaceholder} AND is_deleted = false
        RETURNING *;
    `;

    const result = await pool.query(query, values);
    return result.rows.length ? result.rows[0] : null;

  } catch (error) {
    logger.error(`Lỗi khi cập nhật động journal với ID ${id}:`, error.message);
    throw error;
  }
};

export const deleteJournal = async () => {

}