import pool from "../../config/database.js";
import logger from "../../utils/logger.js";

export const getIssues = async ({ page = 1, limit = 10, volume_id, journal_id }) => {
    const offset = (page - 1) * limit;
    const values = [];
    const whereClauses = ['i.is_deleted = false'];

    if (volume_id) {
        values.push(Number(volume_id));
        whereClauses.push(`i.volume_id = $${values.length}`);
    }

    if (journal_id) {
        values.push(Number(journal_id));
        whereClauses.push(`v.journal_id = $${values.length}`);
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const dataQuery = `
        SELECT 
            i.issue_id::text, i.volume_id::text, i.issue_number, i.publication_year,
            v.journal_id::text, v.volume_number
        FROM "Issue" i
        JOIN "Volume" v ON i.volume_id = v.volume_id
        ${whereSql}
        ORDER BY i.publication_year DESC, i.issue_number DESC
        LIMIT $${values.length + 1} OFFSET $${values.length + 2};
    `;

    const countQuery = `
        SELECT COUNT(i.issue_id) AS total
        FROM "Issue" i
        JOIN "Volume" v ON i.volume_id = v.volume_id
        ${whereSql};
    `;

    const [dataResult, countResult] = await Promise.all([
        pool.query(dataQuery, [...values, limit, offset]),
        pool.query(countQuery, values)
    ]);

    const total = parseInt(countResult.rows[0].total, 10);

    return {
        items: dataResult.rows,
        pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            totalPages: Math.ceil(total / limit)
        }
    };
};

export const issueExist = async (id) => {
    const query = `SELECT 1 FROM "Issue" WHERE issue_id = $1`;
    const result = await pool.query(query, [BigInt(id)]);
    return result.rows.length > 0;
};

export const issueIsDeleted = async (id) => {
    const query = `SELECT 1 FROM "Issue" WHERE issue_id = $1 AND is_deleted = true`;
    const result = await pool.query(query, [BigInt(id)]);
    return result.rows.length > 0;
};

export const checkDuplicateIssue = async (volume_id, issue_number, excludeId = null) => {
    let query = `SELECT 1 FROM "Issue" WHERE volume_id = $1 AND issue_number = $2 AND is_deleted = false`;
    const params = [BigInt(volume_id), parseInt(issue_number, 10)];
    if (excludeId !== null) {
        query += ` AND issue_id != $3`;
        params.push(BigInt(excludeId));
    }
    const result = await pool.query(query, params);
    return result.rows.length > 0;
};

export const createIssue = async (data) => {
    const { volume_id, issue_number, publication_year } = data;
    const query = `
        INSERT INTO "Issue" (volume_id, issue_number, publication_year, is_deleted)
        VALUES ($1, $2, $3, false)
        RETURNING issue_id::text, volume_id::text, issue_number, publication_year, is_deleted;
    `;
    const values = [BigInt(volume_id), parseInt(issue_number, 10), parseInt(publication_year, 10)];
    const result = await pool.query(query, values);
    return result.rows[0];
};

export const getIssueById = async (id) => {
    const query = `
        SELECT 
            i.issue_id::text, i.volume_id::text, i.issue_number, i.publication_year, i.is_deleted,
            v.journal_id::text, v.volume_number
        FROM "Issue" i
        JOIN "Volume" v ON i.volume_id = v.volume_id
        WHERE i.issue_id = $1 AND i.is_deleted = false;
    `;
    const result = await pool.query(query, [BigInt(id)]);
    return result.rows[0] || null;
};

export const getIssueByIdInternal = async (id) => {
    const query = `
        SELECT 
            i.issue_id::text, i.volume_id::text, i.issue_number, i.publication_year, i.is_deleted,
            v.journal_id::text, v.volume_number
        FROM "Issue" i
        JOIN "Volume" v ON i.volume_id = v.volume_id
        WHERE i.issue_id = $1;
    `;
    const result = await pool.query(query, [BigInt(id)]);
    return result.rows[0] || null;
};

export const updateIssue = async (id, data) => {
    const allowedFields = ["issue_number", "publication_year"];
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
    if (updateParts.length === 0) return null;
    values.push(BigInt(id));
    const query = `
        UPDATE "Issue" SET ${updateParts.join(", ")}
        WHERE issue_id = $${placeholderIndex} AND is_deleted = false
        RETURNING issue_id::text, volume_id::text, issue_number, publication_year, is_deleted;
    `;
    const result = await pool.query(query, values);
    return result.rows[0] || null;
};

export const deleteIssue = async (id) => {
    const query = `
        UPDATE "Issue" SET is_deleted = true
        WHERE issue_id = $1 AND is_deleted = false
        RETURNING issue_id::text, volume_id::text, issue_number, publication_year, is_deleted;
    `;
    const result = await pool.query(query, [BigInt(id)]);
    return result.rows[0] || null;
};

export const restoreIssue = async (id) => {
    const query = `
        UPDATE "Issue" SET is_deleted = false
        WHERE issue_id = $1 AND is_deleted = true
        RETURNING issue_id::text, volume_id::text, issue_number, publication_year, is_deleted;
    `;
    const result = await pool.query(query, [BigInt(id)]);
    return result.rows[0] || null;
};
