import jwt from 'jsonwebtoken';
import { createLog } from '../services/log.service.js';

// EXPRESS MIDDLEWARES (LEGACY)
export const requireAuth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Không tìm thấy token' });
    }
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Token không hợp lệ' });
  }
};

export const verifyToken = (req, res, next) => {
  let accessToken = null;
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    accessToken = authHeader.split(' ')[1];
  }
  if (!accessToken && req.cookies) {
    accessToken = req.cookies.access_token;
  }
  if (!accessToken) {
    return res.status(401).json({ success: false, message: "Chưa đăng nhập" });
  }
  try {
    const decoded = jwt.verify(accessToken, process.env.JWT_SECRET);
    req.user = decoded; 
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: "Token không hợp lệ" });
  }
};

export const verifyAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Chưa xác thực' });
  }
  if (req.user.role !== 'ADMINISTRATOR') {
    return res.status(403).json({ success: false, message: 'Không có quyền' });
  }
  next();
}
