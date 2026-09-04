import prisma from '../../lib/prisma.js';

export const findUserById = async (userId) => {
  return await prisma.user.findUnique({
    where: { user_id: userId }
  });
};

export const updateUser = async (userId, data) => {
  return await prisma.user.update({
    where: { user_id: userId },
    data
  });
};

export const deleteUser = async (userId) => {
  return await prisma.user.delete({
    where: { user_id: userId }
  });
};
