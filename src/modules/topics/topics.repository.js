import pool from "../../config/database.js";
import logger from "../../utils/logger.js";

export const getTopicById = async (topicId) => {
    const query = `
        SELECT 
            t.topic_id::text AS topic_id, 
            t.display_name, 
            t.score,
            t.subject_area_id::text AS subject_area_id,
            t.subject_category_id::text AS subject_category_id,
            t.is_deleted,
            sa.display_name AS subject_area_name,
            sc.display_name AS subject_category_name
        FROM "Topic" t
        LEFT JOIN "Subject_Area" sa ON t.subject_area_id = sa.subject_area_id
        LEFT JOIN "Subject_Category" sc ON t.subject_category_id = sc.subject_category_id
        WHERE t.topic_id = $1 AND t.is_deleted = false
    `;
    const result = await pool.query(query, [BigInt(topicId)]);
    return result.rows[0] || null;
};

export const checkDuplicateTopic = async (displayName, excludeId = null) => {
    let queryName = `SELECT 1 FROM "Topic" WHERE display_name = $1 AND is_deleted = false`;
    const paramsName = [displayName.trim()];
    if (excludeId !== null) {
        queryName += ` AND topic_id != $2`;
        paramsName.push(BigInt(excludeId));
    }
    const resName = await pool.query(queryName, paramsName);

    return {
        duplicateName: resName.rows.length > 0
    };
};

export const createTopic = async (data) => {
    const { display_name, score = 0, subject_area_id, subject_category_id } = data;
    const trimmedName = display_name.trim();

    const query = `
        INSERT INTO "Topic" (display_name, score, subject_area_id, subject_category_id, is_deleted)
        VALUES ($1, $2, $3, $4, false)
        RETURNING 
            topic_id::text AS topic_id, 
            display_name, 
            score,
            subject_area_id::text AS subject_area_id,
            subject_category_id::text AS subject_category_id,
            is_deleted;
    `;
    const result = await pool.query(query, [
        trimmedName,
        score,
        subject_area_id ? BigInt(subject_area_id) : null,
        subject_category_id ? BigInt(subject_category_id) : null
    ]);
    return result.rows[0];
};

export const getTopics = async ({
    page = 1,
    limit = 10,
    search,
    subject_area_id,
    subject_category_id,
    sort_by = "display_name",
    sort_order = "asc"
} = {}) => {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit, 10) || 10);
    const offset = (pageNum - 1) * limitNum;

    let baseQuery = `
        FROM "Topic" t
        LEFT JOIN "Subject_Area" sa ON t.subject_area_id = sa.subject_area_id
        LEFT JOIN "Subject_Category" sc ON t.subject_category_id = sc.subject_category_id
        WHERE t.is_deleted = false
    `;
    const queryParams = [];

    if (subject_area_id !== undefined && subject_area_id !== null && subject_area_id.toString().trim() !== "") {
        queryParams.push(BigInt(subject_area_id));
        baseQuery += ` AND t.subject_area_id = $${queryParams.length}`;
    }

    if (subject_category_id !== undefined && subject_category_id !== null && subject_category_id.toString().trim() !== "") {
        queryParams.push(BigInt(subject_category_id));
        baseQuery += ` AND t.subject_category_id = $${queryParams.length}`;
    }

    if (search !== undefined && search !== null && search.toString().trim() !== "") {
        queryParams.push(`%${search.toString().trim()}%`);
        baseQuery += ` AND t.display_name ILIKE $${queryParams.length}`;
    }

    const countQuery = `SELECT COUNT(*)::integer AS total ${baseQuery}`;
    const countRes = await pool.query(countQuery, queryParams);
    const total = countRes.rows[0]?.total || 0;

    const allowedSortFields = ["topic_id", "display_name", "score"];
    const sortField = allowedSortFields.includes(sort_by) ? sort_by : "display_name";
    const sortDir = sort_order.toLowerCase() === "desc" ? "DESC" : "ASC";

    queryParams.push(limitNum, offset);
    const dataQuery = `
        SELECT 
            t.topic_id::text AS topic_id, 
            t.display_name, 
            t.score,
            t.subject_area_id::text AS subject_area_id,
            t.subject_category_id::text AS subject_category_id,
            t.is_deleted,
            sa.display_name AS subject_area_name,
            sc.display_name AS subject_category_name
        ${baseQuery}
        ORDER BY t."${sortField}" ${sortDir}
        LIMIT $${queryParams.length - 1} OFFSET $${queryParams.length}
    `;

    const dataRes = await pool.query(dataQuery, queryParams);
    return {
        items: dataRes.rows,
        total
    };
};

export const getArticlesByTopicId = async (topicId, limit = 10, offset = 0) => {
    const query = `
        SELECT DISTINCT
            a."article_id",
            a."title",
            a."publication_year",
            a."doi"
        FROM "Article" a
        LEFT JOIN "Sub_Topic" st ON st."article_id" = a."article_id"
        WHERE (a."primary_topic" = $1 OR st."topic_id" = $1)
          AND a."is_deleted" = false
        ORDER BY a."publication_year" DESC NULLS LAST, a."article_id" DESC
        LIMIT $2 OFFSET $3
    `;
    const result = await pool.query(query, [topicId, limit, offset]);
    return result.rows;
};

export const countArticlesByTopicId = async (topicId) => {
    const query = `
        SELECT COUNT(DISTINCT a."article_id") AS "total"
        FROM "Article" a
        LEFT JOIN "Sub_Topic" st ON st."article_id" = a."article_id"
        WHERE (a."primary_topic" = $1 OR st."topic_id" = $1)
          AND a."is_deleted" = false
    `;
    const result = await pool.query(query, [topicId]);
    return parseInt(result.rows[0].total);
};

export const createSubTopicArticleRelationships = async (articleId, topicIds, primaryTopicId) => {
    if (!topicIds || topicIds.length === 0) return;

    const targetPrimaryId = primaryTopicId ? Number(primaryTopicId) : null;
    const uniqueTopicIds = [
        ...new Set(topicIds.map(id => Number(id)).filter(id => id !== targetPrimaryId))
    ];

    if (uniqueTopicIds.length === 0) return;

    const query = `
        INSERT INTO "Sub_Topic" (article_id, topic_id)
        SELECT $1, unnest($2::bigint[])
        ON CONFLICT DO NOTHING
    `;
    await pool.query(query, [articleId, uniqueTopicIds]);
};

export const updateSubTopicArticleRelationships = async (articleId, topicIds, primaryTopicId) => {
    if (!articleId) throw new Error('Thiếu articleId');

    const deleteQuery = `DELETE FROM "Sub_Topic" WHERE "article_id" = $1;`;
    await pool.query(deleteQuery, [articleId]);

    await createSubTopicArticleRelationships(articleId, topicIds, primaryTopicId);
};

export const topicExists = async (topicId) => {
    const queryText = `SELECT 1 FROM "Topic" WHERE "topic_id" = $1`;
    const res = await pool.query(queryText, [topicId]);
    return res.rowCount > 0;
};

export const topicIsDeleted = async (id) => {
    const query = `SELECT 1 FROM "Topic" WHERE topic_id = $1 AND is_deleted = true`;
    const result = await pool.query(query, [BigInt(id)]);
    return result.rows.length > 0;
};

export const updateTopic = async (id, data) => {
    const allowedFields = ["display_name", "score", "subject_area_id", "subject_category_id"];
    const updateParts = [];
    const values = [];
    let placeholderIndex = 1;

    for (const field of allowedFields) {
        if (data[field] !== undefined) {
            updateParts.push(`"${field}" = $${placeholderIndex}`);
            values.push(data[field]);
            placeholderIndex++;
        }
    }

    if (updateParts.length === 0) return null;

    values.push(BigInt(id));
    const query = `
        UPDATE "Topic"
        SET ${updateParts.join(", ")}
        WHERE topic_id = $${placeholderIndex} AND is_deleted = false
        RETURNING *;
    `;

    const result = await pool.query(query, values);
    return result.rows.length > 0 ? result.rows[0] : null;
};

export const deleteTopic = async (id) => {
    const query = `
        UPDATE "Topic"
        SET is_deleted = true
        WHERE topic_id = $1 AND is_deleted = false
        RETURNING *;
    `;
    const result = await pool.query(query, [BigInt(id)]);
    return result.rows.length > 0 ? result.rows[0] : null;
};

export const restoreTopic = async (id) => {
    const query = `
        UPDATE "Topic"
        SET is_deleted = false
        WHERE topic_id = $1 AND is_deleted = true
        RETURNING *;
    `;
    const result = await pool.query(query, [BigInt(id)]);
    return result.rows.length > 0 ? result.rows[0] : null;
};
