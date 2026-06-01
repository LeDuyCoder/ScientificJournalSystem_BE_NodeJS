import pool from "../config/database.js";
import logger from "../utils/logger.js";


/**
 * Kiểm tra xem một số báo (Issue) có tồn tại trong hệ thống hay không.
 *
 * @param {number|string} issueId - ID của số báo cần kiểm tra
 * @returns {Promise<boolean>} `true` nếu số báo tồn tại, ngược lại `false`
 * @throws {Error} Ném lỗi khi truy vấn CSDL gặp sự cố
 */
export const issueExists = async (issueId) => {
    try {
        const queryText = `SELECT 1 FROM "Issue" WHERE "issue_id" = $1`;
        const res = await pool.query(queryText, [issueId]);
        return res.rowCount > 0;
    } catch (error) {
        logger.error('Lỗi khi kiểm tra tồn tại của số báo:', error);
        throw error;
    }  
}