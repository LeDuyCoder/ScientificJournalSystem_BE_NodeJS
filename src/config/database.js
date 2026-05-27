import pkg from 'pg';
import dotenv from 'dotenv';
import logger from '../utils/logger.js';

dotenv.config();

const { Pool } = pkg;

const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  max: 20, // Số lượng kết nối tối đa trong pool
  idleTimeoutMillis: 30000, // Đóng các kết nối không dùng sau 30 giây
  connectionTimeoutMillis: 2000, // Trả về lỗi nếu kết nối quá 2 giây không được
});

// Kiểm tra kết nối khi khởi động server
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    logger.error('Kết nối tới PostgreSQL thất bại!', err);
  } else {
    logger.db(`Kết nối tới PostgreSQL thành công lúc: ${res.rows[0].now}`);
  }
});

export default pool;