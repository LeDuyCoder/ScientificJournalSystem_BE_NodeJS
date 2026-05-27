import * as authService from '../services/auth.service.js';

const isValidEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

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

    const data = await authService.loginWithEmailPassword({
      email,
      password
    });

    return res.status(200).json({
      success: true,
      message: 'Đăng nhập thành công',
      data
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.statusCode ? error.message : 'Có lỗi xảy ra ở server'
    });
  }
};