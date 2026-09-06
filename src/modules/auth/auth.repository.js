import prisma from '../../lib/prisma.js';

export const findUserByEmail = async (email) => {
  return await prisma.user.findUnique({
    where: { email: email.toLowerCase() }
  });
};

export const createUser = async (userData) => {
  return await prisma.user.create({
    data: userData
  });
};

export const findUserById = async (userId) => {
  return await prisma.user.findUnique({
    where: { user_id: userId }
  });
};

export const updateUserStatus = async (userId, status) => {
  return await prisma.user.update({
    where: { user_id: userId },
    data: { status }
  });
};

