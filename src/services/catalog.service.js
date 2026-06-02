import pool from '../config/database.js';

/**
 * Lấy danh sách các lĩnh vực lớn (Subject Area) trong hệ thống.
 *
 * @async
 * @returns {Promise<Array<Object>>} Danh sách các subject areas.
 */
export const getSubjectAreas = async () => {
  const query = `
    SELECT 
      subject_area_id::text AS subject_area_id,
      display_name,
      description
    FROM "Subject_Area"
    ORDER BY display_name ASC
  `;
  const res = await pool.query(query);
  return res.rows;
};

/**
 * Lấy danh sách chuyên ngành hẹp (Subject Category), có hỗ trợ lọc theo Subject Area.
 *
 * @async
 * @param {Object} params - Tham số lọc.
 * @param {string} [params.subjectAreaId] - ID của lĩnh vực lớn cần lọc.
 * @returns {Promise<Array<Object>>} Danh sách chuyên ngành hẹp.
 */
export const getSubjectCategories = async ({ subjectAreaId } = {}) => {
  let query = `
    SELECT 
      subject_category_id::text AS subject_category_id,
      subject_area_id::text AS subject_area_id,
      display_name,
      description
    FROM "Subject_Category"
  `;
  const params = [];

  if (subjectAreaId && subjectAreaId.trim() !== '') {
    params.push(subjectAreaId.trim());
    query += ` WHERE subject_area_id = $1`;
  }

  query += ` ORDER BY display_name ASC`;
  const res = await pool.query(query, params);
  return res.rows;
};

/**
 * Lấy lịch sử xếp hạng (ranking) của một journal cụ thể kèm theo bộ lọc động.
 *
 * @async
 * @param {string} journalId - ID của journal cần lấy lịch sử ranking.
 * @param {Object} [filters] - Các bộ lọc bổ sung.
 * @param {number|string} [filters.year] - Năm cần lọc.
 * @param {string} [filters.metric_code] - Mã chỉ số (SJR, H_INDEX, RANK...).
 * @param {string} [filters.quartile] - Phân hạng cần lọc (Q1, Q2, Q3, Q4).
 * @param {string} [filters.source] - Nguồn dữ liệu (SCIMAGO, SCOPUS, WOS).
 * @returns {Promise<Array<Object>>} Danh sách lịch sử xếp hạng đã định dạng.
 * @throws {Error} Lỗi 404 nếu journal không tồn tại.
 */
export const getJournalRankings = async (journalId, filters = {}) => {
  // 1. Kiểm tra xem journal có tồn tại trong hệ thống không
  const journalCheck = await pool.query(
    'SELECT 1 FROM "Journal" WHERE journal_id = $1',
    [journalId]
  );

  if (journalCheck.rows.length === 0) {
    const error = new Error('Tạp chí không tồn tại');
    error.statusCode = 404;
    throw error;
  }

  // 2. Xây dựng câu truy vấn động lấy rankings
  let query = `
    SELECT 
      jr.journal_ranking_id::text AS journal_ranking_id,
      jr.journal_id::text AS journal_id,
      jr.year,
      jr.source,
      rm.code AS metric_code,
      rm.display_name AS metric_name,
      rm.metric_type,
      jr.value_txt,
      jr.value_float,
      jr.value_int,
      sc.subject_category_id::text AS subject_category_id,
      sc.display_name AS category_display_name
    FROM "Journal_Ranking" jr
    INNER JOIN "Ranking_Metric" rm ON rm.metric_id = jr.metric_id
    LEFT JOIN "Subject_Category" sc ON sc.subject_category_id = jr.subject_category_id
    WHERE jr.journal_id = $1
  `;

  const values = [journalId];
  let paramCount = 1;

  if (filters.year) {
    paramCount++;
    query += ` AND jr.year = $${paramCount}`;
    values.push(parseInt(filters.year, 10));
  }

  if (filters.metric_code && filters.metric_code.trim() !== '') {
    paramCount++;
    query += ` AND UPPER(rm.code) = UPPER($${paramCount})`;
    values.push(filters.metric_code.trim());
  }

  if (filters.quartile && filters.quartile.trim() !== '') {
    paramCount++;
    query += ` AND UPPER(jr.value_txt) = UPPER($${paramCount}) AND rm.metric_type = 'QUARTILE'`;
    values.push(filters.quartile.trim());
  }

  if (filters.source && filters.source.trim() !== '') {
    paramCount++;
    query += ` AND UPPER(jr.source::text) = UPPER($${paramCount})`;
    values.push(filters.source.trim());
  }

  query += ` ORDER BY jr.year DESC, rm.code ASC`;

  const res = await pool.query(query, values);

  // 3. Định dạng lại trường value dựa theo metric_type và nhóm theo năm
  const list = res.rows.map(row => {
    let value = null;
    if (row.metric_type === 'QUARTILE') {
      value = row.value_txt;
    } else if (row.metric_type === 'SCORE') {
      value = row.value_float !== null ? Number(row.value_float) : null;
    } else if (row.metric_type === 'INTEGER') {
      value = row.value_int !== null ? Number(row.value_int) : null;
    } else {
      value = row.value_txt !== null ? row.value_txt :
              row.value_float !== null ? Number(row.value_float) :
              row.value_int !== null ? Number(row.value_int) : null;
    }

    return {
      journal_ranking_id: row.journal_ranking_id,
      journal_id: row.journal_id,
      year: row.year,
      source: row.source,
      metric_code: row.metric_code,
      metric_name: row.metric_name,
      metric_type: row.metric_type,
      value,
      subject_category: row.subject_category_id ? {
        subject_category_id: row.subject_category_id,
        display_name: row.category_display_name
      } : null
    };
  });

  const grouped = {};
  for (const item of list) {
    const yr = String(item.year);
    if (!grouped[yr]) {
      grouped[yr] = [];
    }
    grouped[yr].push(item);
  }
  return grouped;
};

/**
 * Lấy danh sách Volume, hỗ trợ lọc theo journal_id.
 *
 * @async
 * @param {Object} [params] - Tham số lọc.
 * @param {string|number} [params.journalId] - ID của journal cần lọc.
 * @returns {Promise<Array<Object>>} Danh sách Volume.
 */
export const getVolumes = async ({ journalId } = {}) => {
  let query = `
    SELECT 
      v.volume_id::text AS volume_id,
      v.journal_id::text AS journal_id,
      j.display_name AS journal_name,
      v.volume_number,
      v.publication_year
    FROM "Volume" v
    LEFT JOIN "Journal" j ON j.journal_id = v.journal_id
  `;
  const params = [];

  if (journalId) {
    query += ` WHERE v.journal_id = $1`;
    params.push(journalId);
  }

  query += ` ORDER BY v.publication_year DESC, v.volume_number DESC`;
  const res = await pool.query(query, params);
  return res.rows;
};

/**
 * Lấy danh sách Issue, hỗ trợ lọc theo volume_id.
 *
 * @async
 * @param {Object} [params] - Tham số lọc.
 * @param {string|number} [params.volumeId] - ID của volume cần lọc.
 * @returns {Promise<Array<Object>>} Danh sách Issue.
 */
export const getIssues = async ({ volumeId } = {}) => {
  let query = `
    SELECT 
      issue_id::text AS issue_id,
      volume_id::text AS volume_id,
      issue_number,
      publication_year
    FROM "Issue"
  `;
  const params = [];

  if (volumeId) {
    query += ` WHERE volume_id = $1`;
    params.push(volumeId);
  }

  query += ` ORDER BY publication_year DESC, issue_number DESC`;
  const res = await pool.query(query, params);
  return res.rows;
};
