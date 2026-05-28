import { loginOrCreateWithGoogle } from '../services/google.service.js';
import logger from '../utils/logger.js';

/**
 * API Đăng nhập / Đăng ký bằng Google ID Token
 */
export const googleLogin = async (req, res) => {
  try {
    const { idToken } = req.body;

    if (!idToken || !idToken.trim()) {
      return res.status(400).json({
        success: false,
        message: 'idToken không được để trống'
      });
    }

    const data = await loginOrCreateWithGoogle(idToken);

    logger.info(`[Google Auth]: Đăng nhập/Đăng ký Google thành công cho tài khoản: ${data.user.email}`);

    return res.status(200).json({
      success: true,
      message: 'Đăng nhập bằng Google thành công',
      data
    });
  } catch (error) {
    if (!error.statusCode || error.statusCode === 500) {
      logger.error('Lỗi hệ thống trong controller đăng nhập Google:', error);
    }
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.statusCode ? error.message : 'Có lỗi xảy ra ở server'
    });
  }
};
