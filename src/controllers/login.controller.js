import { loginWithEmailPassword } from '../services/login.service.js';
import logger from '../utils/logger.js';

/**
 * Kiểm tra định dạng của một chuỗi email có hợp lệ hay không
 * @param {string} email - Chuỗi email cần kiểm tra
 * @returns {boolean} Trả về true nếu định dạng hợp lệ, ngược lại là false
 */
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * API Đăng nhập cho tài khoản Local bằng Email và Mật khẩu
 * @param {Object} req - Express request object
 * @param {Object} req.body - Dữ liệu yêu cầu đăng nhập của người dùng
 * @param {string} req.body.email - Địa chỉ email đăng nhập
 * @param {string} req.body.password - Mật khẩu đăng nhập
 * @param {Object} res - Express response object
 * @returns {Promise<Object>} JSON response chứa access token và thông tin người dùng
 */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !email.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Email không được để trống'
      });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'Email không đúng định dạng'
      });
    }

    if (!password || !password.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Password không được để trống'
      });
    }

    const data = await loginWithEmailPassword({ email, password });

    return res.status(200).json({
      success: true,
      message: 'Đăng nhập thành công',
      data
    });
  } catch (error) {
    if (!error.statusCode || error.statusCode === 500) {
      logger.error('Lỗi hệ thống trong controller đăng nhập:', error);
    }
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.statusCode ? error.message : 'Có lỗi xảy ra ở server'
    });
  }
};
