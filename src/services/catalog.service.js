import pool from "../config/database.js";
import logger from "../utils/logger.js";

/**
 * Service lấy danh sách volume
 * @param {number} journalId
 * @returns {Promise<Array>}
 */
const getVolumes = async (journalId) => {
  try {
    let query = `
      SELECT
        v.volume_id,
        v.journal_id,
        j.display_name AS journal_name,
        v.volume_number,
        v.publication_year
      FROM "Volume" v
      JOIN "Journal" j
        ON v.journal_id = j.journal_id
    `;

    const values = [];

    // Filter theo journal_id
    if (journalId) {
      query += ` WHERE v.journal_id = $1`;
      values.push(parseInt(journalId));
    }

    query += `
      ORDER BY
        v.publication_year DESC,
        v.volume_number DESC
    `;

    const result = await pool.query(query, values);

    return result.rows;
  } catch (error) {
    logger.error("[Catalog Service] Lỗi khi lấy volumes:", error);
    throw error;
  }
};

/**
 * Service lấy danh sách issue
 * @param {number} volumeId
 * @returns {Promise<Array>}
 */
const getIssues = async (volumeId) => {
  try {
    let query = `
      SELECT
        issue_id,
        volume_id,
        issue_number,
        publication_year
      FROM "Issue"
    `;
    const values = [];

    // Filter theo volume_id
    if (volumeId) {
      query += ` WHERE volume_id = $1`;
      values.push(parseInt(volumeId));
    }
    query += `
      ORDER BY
        publication_year DESC,
        issue_number ASC
    `;
    const result = await pool.query(query, values);

    return result.rows;
  } catch (error) {
    logger.error("[Catalog Service] Lỗi khi lấy issues:", error);
    throw error;
  }
};

export default {
  getVolumes,
  getIssues,
};
