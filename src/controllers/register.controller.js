import { registerWithEmailPassword } from '../services/register.service.js';

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

    return res.status(201).json({
      success: true,
      message: 'Đăng ký tài khoản thành công',
      data
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.statusCode ? error.message : 'Có lỗi xảy ra ở server'
    });
  }
};
