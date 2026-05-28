import jwt from 'jsonwebtoken';
import logger from '../utils/logger.js';


/**
 * Middleware xác thực người dùng bằng JWT Token để có quyền thao tác với Project
 */
export const requireAuth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Không tìm thấy token xác thực hoặc token không hợp lệ'
      });
    }

    const token = authHeader.split(' ')[1];
    if (!process.env.JWT_SECRET) {
      return res.status(500).json({
        success: false,
        message: 'Lỗi cấu hình JWT trên server'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Dữ liệu giải mã: { user_id, role, ... }
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Token xác thực không hợp lệ hoặc đã hết hạn'
    });
  }
};

/**
 * Middleware xác thực người dùng bằng JWT Token
 */
export const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    logger.warn('[Auth]: Xác thực thất bại: Thiếu hoặc sai định dạng Authorization header.');
    return res.status(401).json({
      success: false,
      message: 'Vui lòng đăng nhập để thực hiện hành động này.'
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'scientific_journal_secret_key');
    req.user = decoded; // Gán thông tin user vào request (gồm user_id, email, role, etc)
    logger.info(`[Auth]: Xác thực thành công cho người dùng: ${decoded.email}`);
    next();
  } catch (error) {
    logger.error('[Auth]: Xác thực thất bại: Token hết hạn hoặc không hợp lệ.', error);
    return res.status(401).json({
      success: false,
      message: 'Token đã hết hạn hoặc không hợp lệ. Vui lòng đăng nhập lại.'
    });
  }
};

