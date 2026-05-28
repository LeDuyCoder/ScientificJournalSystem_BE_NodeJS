import { registerWithEmailPassword, activateAccount } from '../services/register.service.js';
import logger from '../utils/logger.js';

const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const register = async (req, res) => {
  try {
    const { email, password, first_name, last_name, date_of_birth, gender, role } = req.body;

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

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Mật khẩu phải có ít nhất 6 ký tự'
      });
    }

    if (role && !['STUDENT', 'LECTURER', 'RESEARCHER', 'ADMINISTRATOR'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Vai trò tài khoản không hợp lệ'
      });
    }

    const data = await registerWithEmailPassword({
      email,
      password,
      first_name,
      last_name,
      date_of_birth,
      gender,
      role
    });

    logger.info(`[Register]: Đăng ký thành công cho tài khoản: ${data.email} (Trạng thái: INACTIVE)`);

    return res.status(201).json({
      success: true,
      message: 'Đăng ký tài khoản thành công. Vui lòng kiểm tra email để kích hoạt tài khoản.',
      data
    });
  } catch (error) {
    if (!error.statusCode || error.statusCode === 500) {
      logger.error('Lỗi hệ thống trong controller đăng ký:', error);
    }
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.statusCode ? error.message : 'Có lỗi xảy ra ở server'
    });
  }
};

/**
 * API xác thực tài khoản qua Token gửi từ Email
 */
export const verify = async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Token kích hoạt không được để trống'
      });
    }

    const result = await activateAccount(token);

    if (result.alreadyActive) {
      logger.warn(`[Register]: Tài khoản ${result.email} đã được kích hoạt trước đó.`);
      return res.status(200).json({
        success: true,
        message: 'Tài khoản đã được kích hoạt từ trước. Bạn có thể đăng nhập.'
      });
    }

    logger.info(`[Register]: Kích hoạt tài khoản thành công cho email: ${result.email}`);

    return res.status(200).json({
      success: true,
      message: 'Kích hoạt tài khoản thành công! Bây giờ bạn có thể đăng nhập.'
    });
  } catch (error) {
    if (!error.statusCode || error.statusCode === 500) {
      logger.error('Lỗi hệ thống trong controller xác thực tài khoản:', error);
    }
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.statusCode ? error.message : 'Có lỗi xảy ra ở server'
    });
  }
};
