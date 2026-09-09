import pool from "../../config/database.js";
import logger from "../../utils/logger.js";

export const volumeExist = async (id) => {
  const query = `SELECT 1 FROM "Volume" WHERE volume_id = $1`;
  const result = await pool.query(query, [BigInt(id)]);
  return result.rows.length > 0;
};

export const volumeIsDeleted = async (id) => {
  const query = `SELECT 1 FROM "Volume" WHERE volume_id = $1 AND is_deleted = true`;
  const result = await pool.query(query, [BigInt(id)]);
  return result.rows.length > 0;
};

export const checkDuplicateVolume = async (journalId, volumeNumber, excludeId = null) => {
  let query = `
    SELECT 1 FROM "Volume" 
    WHERE journal_id = $1 AND volume_number = $2 AND is_deleted = false
  `;
  const params = [BigInt(journalId), parseInt(volumeNumber, 10)];

  if (excludeId !== null) {
    query += ` AND volume_id != $3`;
    params.push(BigInt(excludeId));
  }

  const result = await pool.query(query, params);
  return result.rows.length > 0;
};

export const createVolume = async (data) => {
  const { journal_id, volume_number, publication_year } = data;
  const query = `
    INSERT INTO "Volume" (journal_id, volume_number, publication_year, is_deleted)
    VALUES ($1, $2, $3, false)
    RETURNING 
      volume_id::text AS volume_id, 
      journal_id::text AS journal_id, 
      volume_number, 
      publication_year, 
      is_deleted;
  `;
  const values = [BigInt(journal_id), parseInt(volume_number, 10), parseInt(publication_year, 10)];
  const result = await pool.query(query, values);
  return result.rows[0];
};

export const getVolumes = async ({
  page = 1,
  limit = 10,
  search,
  journal_id,
  publication_year,
  sort_by = "volume_number",
  sort_order = "asc"
} = {}) => {
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.max(1, parseInt(limit, 10) || 10);
  const offset = (pageNum - 1) * limitNum;

  let baseQuery = `
    FROM "Volume"
    WHERE is_deleted = false
  `;
  const queryParams = [];

  if (journal_id !== undefined && journal_id !== null && journal_id !== "") {
    queryParams.push(BigInt(journal_id));
    baseQuery += ` AND journal_id = $${queryParams.length}`;
  }

  if (publication_year !== undefined && publication_year !== null && publication_year !== "") {
    queryParams.push(parseInt(publication_year, 10));
    baseQuery += ` AND publication_year = $${queryParams.length}`;
  }

  if (search !== undefined && search !== null && search.toString().trim() !== "") {
    queryParams.push(`%${search.toString().trim()}%`);
    baseQuery += ` AND volume_number::text ILIKE $${queryParams.length}`;
  }

  const countQuery = `SELECT COUNT(*)::integer AS total ${baseQuery}`;
  const countRes = await pool.query(countQuery, queryParams);
  const total = countRes.rows[0]?.total || 0;

  const allowedSortFields = ["volume_id", "volume_number", "publication_year"];
  const sortField = allowedSortFields.includes(sort_by) ? sort_by : "volume_number";
  const sortDir = sort_order.toLowerCase() === "desc" ? "DESC" : "ASC";

  queryParams.push(limitNum, offset);
  const dataQuery = `
    SELECT 
      volume_id::text AS volume_id, 
      journal_id::text AS journal_id, 
      volume_number, 
      publication_year, 
      is_deleted
    ${baseQuery}
    ORDER BY "${sortField}" ${sortDir}
    LIMIT $${queryParams.length - 1} OFFSET $${queryParams.length}
  `;

  const dataRes = await pool.query(dataQuery, queryParams);
  return {
    items: dataRes.rows,
    total
  };
};

export const getVolumeById = async (id) => {
  const query = `
    SELECT 
      volume_id::text AS volume_id, 
      journal_id::text AS journal_id, 
      volume_number, 
      publication_year, 
      is_deleted
    FROM "Volume"
    WHERE volume_id = $1 AND is_deleted = false
  `;
  const result = await pool.query(query, [BigInt(id)]);
  return result.rows.length > 0 ? result.rows[0] : null;
};

export const getVolumeByIdInternal = async (id) => {
  const query = `
    SELECT 
      volume_id::text AS volume_id, 
      journal_id::text AS journal_id, 
      volume_number, 
      publication_year, 
      is_deleted
    FROM "Volume"
    WHERE volume_id = $1
  `;
  const result = await pool.query(query, [BigInt(id)]);
  return result.rows.length > 0 ? result.rows[0] : null;
};

export const updateVolume = async (id, data) => {
  const allowedFields = ["volume_number", "publication_year"];
  const updateParts = [];
  const values = [];
  let placeholderIndex = 1;

  for (const field of allowedFields) {
    if (data[field] !== undefined && data[field] !== null) {
      updateParts.push(`"${field}" = $${placeholderIndex}`);
      values.push(parseInt(data[field], 10));
      placeholderIndex++;
    }
  }

  if (updateParts.length === 0) {
    return null;
  }

  values.push(BigInt(id));
  const query = `
    UPDATE "Volume"
    SET ${updateParts.join(", ")}
    WHERE volume_id = $${placeholderIndex} AND is_deleted = false
    RETURNING 
      volume_id::text AS volume_id, 
      journal_id::text AS journal_id, 
      volume_number, 
      publication_year, 
      is_deleted;
  `;
  const result = await pool.query(query, values);
  return result.rows.length > 0 ? result.rows[0] : null;
};

export const deleteVolume = async (id) => {
  const query = `
    UPDATE "Volume"
    SET is_deleted = true
    WHERE volume_id = $1 AND is_deleted = false
    RETURNING 
      volume_id::text AS volume_id, 
      journal_id::text AS journal_id, 
      volume_number, 
      publication_year, 
      is_deleted;
  `;
  const result = await pool.query(query, [BigInt(id)]);
  return result.rows.length > 0 ? result.rows[0] : null;
};

export const restoreVolume = async (id) => {
  const query = `
    UPDATE "Volume"
    SET is_deleted = false
    WHERE volume_id = $1 AND is_deleted = true
    RETURNING 
      volume_id::text AS volume_id, 
      journal_id::text AS journal_id, 
      volume_number, 
      publication_year, 
      is_deleted;
  `;
  const result = await pool.query(query, [BigInt(id)]);
  return result.rows.length > 0 ? result.rows[0] : null;
};
