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

export const createPasswordResetToken = async ({ userId, tokenHash, expiresAt }) => {
  return await prisma.password_Reset_Token.create({
    data: {
      user_id: userId,
      token_hash: tokenHash,
      expires_at: expiresAt
    }
  });
};

export const findPasswordResetToken = async (tokenHash) => {
  return await prisma.password_Reset_Token.findFirst({
    where: { token_hash: tokenHash }
  });
};

export const resetUserPasswordWithToken = async ({ userId, tokenId, newPasswordHash }) => {
  return await prisma.$transaction([
    prisma.user.update({
      where: { user_id: userId },
      data: { password: newPasswordHash }
    }),
    prisma.password_Reset_Token.update({
      where: { token_id: tokenId },
      data: { used_at: new Date() }
    })
  ]);
};


