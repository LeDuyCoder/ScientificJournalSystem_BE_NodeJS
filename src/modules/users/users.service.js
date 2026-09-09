import { findUserById, updateUser, deleteUser as deleteUserRepo } from './users.repository.js';

export const getProfile = async (userId) => {
  const user = await findUserById(userId);
  if (!user) {
    throw new Error('Người dùng không tồn tại');
  }
  // Loại bỏ các trường nhạy cảm
  const { password_hash, ...safeUser } = user;
  return safeUser;
};

export const updateProfile = async (userId, updateData) => {
  // Lọc chỉ cho phép update các trường này
  const allowedFields = ['first_name', 'last_name', 'date_of_birth', 'gender', 'url_image'];
  const data = {};
  
  for (const key of allowedFields) {
    if (updateData[key] !== undefined) {
      if (key === 'date_of_birth' && updateData[key]) {
        data[key] = new Date(updateData[key]);
      } else {
        data[key] = updateData[key];
      }
    }
  }

  if (Object.keys(data).length === 0) {
    throw new Error('Không có dữ liệu hợp lệ để cập nhật');
  }

  const updatedUser = await updateUser(userId, data);
  const { password_hash, ...safeUser } = updatedUser;
  return safeUser;
};

export const deleteProfile = async (userId) => {
  const user = await findUserById(userId);
  if (!user) {
    throw new Error('Người dùng không tồn tại');
  }
  await deleteUserRepo(userId);
  return true;
};
