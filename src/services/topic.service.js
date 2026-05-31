import pool from '../config/database.js';
import logger from '../utils/logger.js';

/**
 * Tìm Topic theo ID.
 *
 * @async
 * @param {number|string} topicId - ID của topic cần tra cứu.
 * @returns {Promise<Object|null>} Đối tượng topic hoặc null nếu không tìm thấy.
 */
export const getTopicById = async (topicId) => {
    const query = `SELECT "topic_id", "display_name" FROM "Topic" WHERE "topic_id" = $1`;
    const result = await pool.query(query, [topicId]);
    return result.rows[0] || null;
};

/**
 * Lấy danh sách bài báo thuộc một topic (qua primary_topic hoặc Sub_Topic).
 *
 * Luồng JOIN:
 *   - Article.primary_topic = topic_id  (bài báo có primary topic trùng)
 *   - Sub_Topic(article_id, topic_id)   (bài báo được gắn sub-topic)
 *
 * @async
 * @param {number} topicId - ID của topic.
 * @param {number} limit   - Số bài tối đa trả về.
 * @param {number} offset  - Vị trí bắt đầu (phân trang).
 * @returns {Promise<Array<Object>>} Danh sách bài báo.
 */
export const getArticlesByTopicId = async (topicId, limit = 10, offset = 0) => {
    const query = `
        SELECT DISTINCT
            a."article_id",
            a."title",
            a."publication_year",
            a."doi"
        FROM "Article" a
        LEFT JOIN "Sub_Topic" st ON st."article_id" = a."article_id"
        WHERE a."primary_topic" = $1
           OR st."topic_id" = $1
        ORDER BY a."publication_year" DESC NULLS LAST, a."article_id" DESC
        LIMIT $2 OFFSET $3
    `;

    const result = await pool.query(query, [topicId, limit, offset]);
    return result.rows;
};

/**
 * Đếm tổng số bài báo thuộc một topic.
 *
 * @async
 * @param {number} topicId - ID của topic.
 * @returns {Promise<number>} Tổng số bài báo.
 */
export const countArticlesByTopicId = async (topicId) => {
    const query = `
        SELECT COUNT(DISTINCT a."article_id") AS "total"
        FROM "Article" a
        LEFT JOIN "Sub_Topic" st ON st."article_id" = a."article_id"
        WHERE a."primary_topic" = $1
           OR st."topic_id" = $1
    `;

    const result = await pool.query(query, [topicId]);
    return parseInt(result.rows[0].total);
};

export const createSubTopicArticleRelationships = async (articleId, topicIds, primaryTopicId) => {
    try {
        // 1. Kiểm tra đầu vào, nếu mảng rỗng thì thoát sớm
        if (!topicIds || topicIds.length === 0) {
            return;
        }

        const targetPrimaryId = primaryTopicId ? Number(primaryTopicId) : null;

        const uniqueTopicIds = [
            ...new Set(
                topicIds
                    .map(id => Number(id))
                    .filter(id => id !== targetPrimaryId)
            )
        ];

        if (uniqueTopicIds.length === 0) {
            logger.info('Không có chủ đề phụ nào hợp lệ để thêm (hoặc đã bị trùng với Chủ đề chính).');
            return;
        }

        const query = `
            INSERT INTO "Sub_Topic" (article_id, topic_id)
            SELECT $1, unnest($2::bigint[])
            ON CONFLICT DO NOTHING
        `;

    
        await pool.query(query, [articleId, uniqueTopicIds]);

        logger.info(
            `Đã tạo ${uniqueTopicIds.length} quan hệ chủ đề phụ - bài báo`
        );

    } catch (error) {
        logger.error(
            'Lỗi khi tạo quan hệ chủ đề phụ - bài báo:',
            error
        );
        throw error;
    }
};

/**
 * Cập nhật toàn bộ mối quan hệ chủ đề phụ cho bài báo (Chuẩn RESTful PUT)
 * - Bước 1: Xóa toàn bộ quan hệ chủ đề phụ cũ của bài báo này
 * - Bước 2: Gọi lại hàm create để chèn danh sách mới sạch sẽ
 * * @param {number|string} articleId - ID của bài báo cần cập nhật
 * @param {number[]} topicIds - Mảng các ID chủ đề phụ mới (ví dụ: [3, 4, 5])
 * @param {number|string|null} primaryTopicId - ID chủ đề chính để đối chiếu lọc trùng
 */
export const updateSubTopicArticleRelationships = async (articleId, topicIds, primaryTopicId) => {
    try {
        if (!articleId) {
            throw new Error('Thiếu articleId khi gọi hàm updateSubTopicArticleRelationships');
        }

        const deleteQuery = `
            DELETE FROM "Sub_Topic"
            WHERE "article_id" = $1;
        `;
        await pool.query(deleteQuery, [articleId]);

        await createSubTopicArticleRelationships(articleId, topicIds, primaryTopicId);

        logger.info(`Đã cập nhật làm mới toàn bộ quan hệ chủ đề phụ cho bài báo ID: ${articleId}`);

    } catch (error) {
        logger.error(`Lỗi khi cập nhật quan hệ chủ đề phụ cho bài báo ID ${articleId}:`, error);
        throw error;
    }
};

export const topicExists = async (topicId) => {
    try {
        const queryText = `SELECT 1 FROM "Topic" WHERE "topic_id" = $1`;
        const res = await pool.query(queryText, [topicId]);
        return res.rowCount > 0;
    } catch (error) {
        logger.error('Lỗi khi kiểm tra tồn tại của chủ đề:', error);
        throw error;
    }  
}