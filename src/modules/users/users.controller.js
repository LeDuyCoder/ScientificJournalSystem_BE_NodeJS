import { getProfile, updateProfile, deleteProfile } from './users.service.js';

export const getMe = async (request, reply) => {
  try {
    const userId = request.user.user_id;
    const user = await getProfile(userId);

    return reply.send({
      success: true,
      message: 'Lấy thông tin người dùng thành công',
      data: user
    });
  } catch (error) {
    if (error.message === 'Người dùng không tồn tại') {
      return reply.code(404).send({ success: false, message: error.message });
    }
    return reply.code(500).send({ success: false, message: 'Lỗi máy chủ cục bộ' });
  }
};

export const updateMe = async (request, reply) => {
  try {
    const userId = request.user.user_id;
    const updateData = request.body;
    const updatedUser = await updateProfile(userId, updateData);

    return reply.send({
      success: true,
      message: 'Cập nhật thông tin cá nhân thành công!',
      data: updatedUser
    });
  } catch (error) {
    if (error.message === 'Người dùng không tồn tại') {
      return reply.code(404).send({ success: false, message: error.message });
    }
    return reply.code(400).send({ success: false, message: error.message });
  }
};

export const deleteMe = async (request, reply) => {
  try {
    const userId = request.user.user_id;
    const email = request.user.email;
    await deleteProfile(userId);

    reply.clearCookie('access_token');
    reply.clearCookie('refresh_token');

    return reply.send({
      success: true,
      message: `Xóa tài khoản ${email} thành công!`,
      data: { user_id: userId }
    });
  } catch (error) {
    if (error.message === 'Người dùng không tồn tại') {
      return reply.code(404).send({ success: false, message: error.message });
    }
    return reply.code(500).send({ success: false, message: 'Lỗi máy chủ cục bộ' });
  }
};

// Cập nhật bằng params ID (cần trùng khớp ID với người dùng đang đăng nhập dựa theo logic cũ)
export const updateUserById = async (request, reply) => {
  try {
    const targetUserId = request.params.id;
    const currentUserId = request.user.user_id;

    if (targetUserId !== currentUserId) {
      return reply.code(403).send({ success: false, message: 'Bạn không có quyền sửa thông tin người khác' });
    }

    const updateData = request.body;
    const updatedUser = await updateProfile(targetUserId, updateData);

    return reply.send({
      success: true,
      message: 'Cập nhật thành công',
      data: updatedUser
    });
  } catch (error) {
    return reply.code(400).send({ success: false, message: error.message });
  }
};
