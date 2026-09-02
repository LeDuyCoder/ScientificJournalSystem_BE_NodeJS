import pool from "../../config/database.js";
import logger from "../../utils/logger.js";

export const subjectCategoryExist = async (id) => {
  const query = `SELECT 1 FROM "Subject_Category" WHERE subject_category_id = $1`;
  const result = await pool.query(query, [BigInt(id)]);
  return result.rows.length > 0;
};

export const subjectCategoryIsDeleted = async (id) => {
  const query = `SELECT 1 FROM "Subject_Category" WHERE subject_category_id = $1 AND is_deleted = true`;
  const result = await pool.query(query, [BigInt(id)]);
  return result.rows.length > 0;
};

export const checkDuplicateSubjectCategory = async (subjectAreaId, displayName, excludeId = null) => {
  let queryName = `
    SELECT 1 FROM "Subject_Category" 
    WHERE subject_area_id = $1 AND display_name = $2 AND is_deleted = false
  `;
  const paramsName = [BigInt(subjectAreaId), displayName.trim()];
  if (excludeId !== null) {
    queryName += ` AND subject_category_id != $3`;
    paramsName.push(BigInt(excludeId));
  }
  const resName = await pool.query(queryName, paramsName);
  return { duplicateName: resName.rows.length > 0 };
};

export const createSubjectCategory = async (data) => {
  const { subject_area_id, display_name, description } = data;
  const trimmedName = display_name.trim();
  const cleanDesc = description ? description.trim() : null;

  const query = `
    INSERT INTO "Subject_Category" (subject_area_id, display_name, description, is_deleted)
    VALUES ($1, $2, $3, false)
    RETURNING 
      subject_category_id::text AS subject_category_id, 
      subject_area_id::text AS subject_area_id,
      display_name, 
      description, 
      is_deleted;
  `;
  const result = await pool.query(query, [BigInt(subject_area_id), trimmedName, cleanDesc]);
  return result.rows[0];
};

export const getSubjectCategories = async (paramsInput = {}) => {
  const {
    page = 1,
    limit = 10,
    search,
    subject_area_id,
    sort_by = "display_name",
    sort_order = "asc"
  } = paramsInput;

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.max(1, parseInt(limit, 10) || 10);
  const offset = (pageNum - 1) * limitNum;

  let baseQuery = `
    FROM "Subject_Category"
    WHERE is_deleted = false
  `;
  const queryParams = [];

  if (subject_area_id !== undefined && subject_area_id !== null && subject_area_id.toString().trim() !== "") {
    queryParams.push(BigInt(subject_area_id));
    baseQuery += ` AND subject_area_id = $${queryParams.length}`;
  }

  if (search !== undefined && search !== null && search.toString().trim() !== "") {
    queryParams.push(`%${search.toString().trim()}%`);
    baseQuery += ` AND display_name ILIKE $${queryParams.length}`;
  }

  const countQuery = `SELECT COUNT(*)::integer AS total ${baseQuery}`;
  const countRes = await pool.query(countQuery, queryParams);
  const total = countRes.rows[0]?.total || 0;

  const allowedSortFields = ["subject_category_id", "display_name", "subject_area_id"];
  const sortField = allowedSortFields.includes(sort_by) ? sort_by : "display_name";
  const sortDir = sort_order.toLowerCase() === "desc" ? "DESC" : "ASC";

  queryParams.push(limitNum, offset);
  const dataQuery = `
    SELECT 
      subject_category_id::text AS subject_category_id, 
      subject_area_id::text AS subject_area_id,
      display_name, 
      description, 
      is_deleted
    ${baseQuery}
    ORDER BY "${sortField}" ${sortDir}
    LIMIT $${queryParams.length - 1} OFFSET $${queryParams.length}
  `;

  const dataRes = await pool.query(dataQuery, queryParams);
  return { items: dataRes.rows, total };
};

export const getSubjectCategoryById = async (id) => {
  const query = `
    SELECT 
      sc.subject_category_id::text AS subject_category_id, 
      sc.subject_area_id::text AS subject_area_id,
      sc.display_name, 
      sc.description, 
      sc.is_deleted,
      sa.display_name AS subject_area_name
    FROM "Subject_Category" sc
    LEFT JOIN "Subject_Area" sa ON sc.subject_area_id = sa.subject_area_id
    WHERE sc.subject_category_id = $1 AND sc.is_deleted = false
  `;
  const result = await pool.query(query, [BigInt(id)]);
  return result.rows.length > 0 ? result.rows[0] : null;
};

export const updateSubjectCategory = async (id, data) => {
  const allowedFields = ["subject_area_id", "display_name", "description"];
  const updateParts = [];
  const values = [];
  let placeholderIndex = 1;

  for (const field of allowedFields) {
    if (data[field] !== undefined) {
      updateParts.push(`"${field}" = $${placeholderIndex}`);
      let val = data[field];
      if (field === "subject_area_id") {
        val = BigInt(val);
      } else if (typeof val === "string") {
        val = val.trim();
      }
      values.push(val);
      placeholderIndex++;
    }
  }

  if (updateParts.length === 0) return null;

  values.push(BigInt(id));
  const query = `
    UPDATE "Subject_Category"
    SET ${updateParts.join(", ")}
    WHERE subject_category_id = $${placeholderIndex} AND is_deleted = false
    RETURNING 
      subject_category_id::text AS subject_category_id, 
      subject_area_id::text AS subject_area_id,
      display_name, 
      description, 
      is_deleted;
  `;
  const result = await pool.query(query, values);
  return result.rows.length > 0 ? result.rows[0] : null;
};

export const deleteSubjectCategory = async (id) => {
  const query = `
    UPDATE "Subject_Category"
    SET is_deleted = true
    WHERE subject_category_id = $1 AND is_deleted = false
    RETURNING 
      subject_category_id::text AS subject_category_id, 
      subject_area_id::text AS subject_area_id,
      display_name, 
      description, 
      is_deleted;
  `;
  const result = await pool.query(query, [BigInt(id)]);
  return result.rows.length > 0 ? result.rows[0] : null;
};

export const restoreSubjectCategory = async (id) => {
  const query = `
    UPDATE "Subject_Category"
    SET is_deleted = false
    WHERE subject_category_id = $1 AND is_deleted = true
    RETURNING 
      subject_category_id::text AS subject_category_id, 
      subject_area_id::text AS subject_area_id,
      display_name, 
      description, 
      is_deleted;
  `;
  const result = await pool.query(query, [BigInt(id)]);
  return result.rows.length > 0 ? result.rows[0] : null;
};

export const getSubjectCategoryStatistics = async (id) => {
  const parsedId = BigInt(id);

  const scRes = await pool.query(
    `SELECT display_name FROM "Subject_Category" WHERE subject_category_id = $1 AND is_deleted = false`,
    [parsedId]
  );
  if (scRes.rows.length === 0) return null;

  const { display_name } = scRes.rows[0];

  const journalsQuery = `
    SELECT COUNT(DISTINCT j.journal_id)::integer AS count
    FROM "Journal" j
    JOIN "Journal_Subject_Category" jsc ON j.journal_id = jsc.journal_id
    WHERE jsc.subject_category_id = $1 AND COALESCE(j.is_deleted, false) = false
  `;

  const articlesQuery = `
    SELECT COUNT(DISTINCT a.article_id)::integer AS count
    FROM "Article" a
    JOIN "Issue" i ON a.issue_id = i.issue_id
    JOIN "Volume" v ON i.volume_id = v.volume_id
    JOIN "Journal" j ON v.journal_id = j.journal_id
    JOIN "Journal_Subject_Category" jsc ON j.journal_id = jsc.journal_id
    WHERE jsc.subject_category_id = $1
      AND COALESCE(a.is_deleted, false) = false
      AND COALESCE(v.is_deleted, false) = false
      AND COALESCE(j.is_deleted, false) = false
  `;

  const authorsQuery = `
    SELECT COUNT(DISTINCT aa.author_id)::integer AS count
    FROM "Author_Article" aa
    JOIN "Article" a ON aa.article_id = a.article_id
    JOIN "Issue" i ON a.issue_id = i.issue_id
    JOIN "Volume" v ON i.volume_id = v.volume_id
    JOIN "Journal" j ON v.journal_id = j.journal_id
    JOIN "Journal_Subject_Category" jsc ON j.journal_id = jsc.journal_id
    WHERE jsc.subject_category_id = $1
      AND COALESCE(a.is_deleted, false) = false
      AND COALESCE(v.is_deleted, false) = false
      AND COALESCE(j.is_deleted, false) = false
  `;

  const [journalsRes, articlesRes, authorsRes] = await Promise.all([
    pool.query(journalsQuery, [parsedId]),
    pool.query(articlesQuery, [parsedId]),
    pool.query(authorsQuery, [parsedId])
  ]);

  return {
    subject_category_id: id.toString(),
    display_name,
    total_journals: journalsRes.rows[0]?.count || 0,
    total_articles: articlesRes.rows[0]?.count || 0,
    total_authors: authorsRes.rows[0]?.count || 0
  };
};
