import jwt from 'jsonwebtoken';
import { createLog } from '../../services/log.service.js'; // keep relative path for now if log service is still legacy

export const requireAuthFastify = async (request, reply) => {
  try {
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return reply.code(401).send({
        success: false,
        message: 'Không tìm thấy token xác thực hoặc token không hợp lệ'
      });
    }

    const token = authHeader.split(' ')[1];
    if (!process.env.JWT_SECRET) {
      return reply.code(500).send({
        success: false,
        message: 'Lỗi cấu hình JWT trên server'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    request.user = decoded;
  } catch (error) {
    return reply.code(401).send({
      success: false,
      message: 'Token xác thực không hợp lệ hoặc đã hết hạn'
    });
  }
};

export const verifyTokenFastify = async (request, reply) => {
  let accessToken = null;
  const authHeader = request.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    accessToken = authHeader.split(' ')[1];
  }
  if (!accessToken && request.cookies) {
    accessToken = request.cookies.access_token;
  }
  if (!accessToken) {
    return reply.code(401).send({
      success: false,
      code: "ACCESS_TOKEN_MISSING",
      message: "Bạn chưa đăng nhập hoặc phiên làm việc đã hết hạn"
    });
  }
  try {
    const decoded = jwt.verify(accessToken, process.env.JWT_SECRET);
    request.user = decoded; 
  } catch (error) {
    return reply.code(401).send({
      success: false,
      code: "ACCESS_TOKEN_EXPIRED",
      message: "Access token không hợp lệ hoặc đã hết hạn"
    });
  }
};

export const verifyAdminFastify = async (request, reply) => {
  if (!request.user) {
    return reply.code(401).send({
      success: false,
      message: 'Xác thực không thành công, không tìm thấy thông tin người dùng.',
      code: 'UNAUTHENTICATED'
    });
  }
  if (request.user.role !== 'ADMINISTRATOR') {
    return reply.code(403).send({
      success: false,
      message: 'Bạn không có quyền truy cập tài nguyên này',
      code: 'NO_PERMISSION'
    });
  }
}
