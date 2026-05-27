import jwt from 'jsonwebtoken';

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
