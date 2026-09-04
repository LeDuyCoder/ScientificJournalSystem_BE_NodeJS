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
