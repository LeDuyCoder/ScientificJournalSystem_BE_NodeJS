import pool from '../config/database.js';

export const getProfileData = async () => {
  // Giả lập dữ liệu lấy từ Database lên
  const mockUser = {
    id: "SE190001",
    username: "Nguyễn Văn A",
    role: "Backend Developer",
    skills: ["Node.js", "Express", "Flutter", "Java"]
  };
  
  return mockUser;
};

/**
 * Xóa tài khoản theo user_id
 * @param {string} userId 
 * @returns {Promise<Object>}
 */
export const deleteUserById = async (userId) => {
  const query = `DELETE FROM "user" WHERE "user_id" = $1 RETURNING "user_id", "email"`;
  const result = await pool.query(query, [userId]);

  if (result.rows.length === 0) {
    const error = new Error('Tài khoản không tồn tại hoặc đã bị xóa trước đó');
    error.statusCode = 404;
    throw error;
  }

  return result.rows[0];
};

/**
 * Cập nhật thông tin tài khoản người dùng
 * @param {string} userId 
 * @param {Object} updateData 
 * @returns {Promise<Object>}
 */
export const updateUserProfile = async (userId, updateData) => {
  const fields = [];
  const values = [userId];
  let index = 2;

  const allowedFields = ['first_name', 'last_name', 'date_of_birth', 'gender', 'url_image'];
  for (const field of allowedFields) {
    if (updateData[field] !== undefined) {
      fields.push(`"${field}" = $${index}`);
      values.push(updateData[field]);
      index++;
    }
  }

  if (fields.length === 0) {
    // Nếu không truyền dữ liệu gì đổi, trả về thông tin user hiện tại
    const query = `SELECT "user_id", "email", "first_name", "last_name", "date_of_birth", "gender", "url_image", "role", "status", "type" FROM "user" WHERE "user_id" = $1`;
    const result = await pool.query(query, [userId]);
    return result.rows[0];
  }

  const query = `
    UPDATE "user"
    SET ${fields.join(', ')}
    WHERE "user_id" = $1
    RETURNING "user_id", "email", "first_name", "last_name", "date_of_birth", "gender", "url_image", "role", "status", "type"
  `;

  const result = await pool.query(query, values);
  if (result.rows.length === 0) {
    const error = new Error('Không tìm thấy tài khoản để cập nhật');
    error.statusCode = 404;
    throw error;
  }

  return result.rows[0];
};