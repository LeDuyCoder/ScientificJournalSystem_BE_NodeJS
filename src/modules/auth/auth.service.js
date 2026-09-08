import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import {
  findUserByEmail,
  createUser,
  findUserById,
  updateUserStatus,
  createPasswordResetToken,
  findPasswordResetToken,
  resetUserPasswordWithToken
} from './auth.repository.js';
import { emailHelper } from '../../utils/email.js';
import crypto from 'crypto';


export const loginUser = async (email, password) => {
  const user = await findUserByEmail(email);
  if (!user) {
    throw new Error('Email hoặc mật khẩu không đúng');
  }

  if (user.status !== 'ACTIVE') {
    throw new Error('Tài khoản đã bị khóa hoặc chưa được kích hoạt');
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new Error('Email hoặc mật khẩu không đúng');
  }

  const token = jwt.sign(
    { user_id: user.user_id, role: user.role, email: user.email },
    process.env.JWT_SECRET || 'secret',
    { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
  );

  const refreshToken = jwt.sign(
    { user_id: user.user_id },
    process.env.JWT_REFRESH_SECRET || 'secret_refresh',
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d' }
  );

  return { token, refreshToken, user };
};

export const registerUser = async (email, password, first_name, last_name, date_of_birth, gender, role = 'STUDENT') => {
  console.log('[auth.service] Checking existing user...');
  const existingUser = await findUserByEmail(email);
  if (existingUser) {
    throw new Error('Email này đã được sử dụng');
  }

  console.log('[auth.service] Generating salt with bcryptjs...');
  const salt = await bcrypt.genSalt(10);
  console.log('[auth.service] Hashing password with bcryptjs...');
  const password_hash = await bcrypt.hash(password, salt);

  console.log('[auth.service] Creating user in DB with status INACTIVE...');
  const newUser = await createUser({
    user_id: crypto.randomUUID(),
    email: email.toLowerCase(),
    password: password_hash,
    first_name,
    last_name,
    date_of_birth: date_of_birth ? new Date(date_of_birth) : null,
    gender: gender !== undefined ? gender : null,
    role,
    status: 'INACTIVE'
  });
  console.log('[auth.service] User created successfully');

  // Generating activation token
  const activationToken = jwt.sign(
    { user_id: newUser.user_id, email: newUser.email },
    process.env.JWT_SECRET || 'secret',
    { expiresIn: '24h' }
  );

  // Sending activation email
  try {
    console.log('[auth.service] Sending activation email to:', newUser.email);
    await emailHelper.sendActivationEmail(newUser.email, newUser.first_name || '', activationToken);
  } catch (mailError) {
    console.error('[auth.service] Lỗi gửi email xác nhận:', mailError.message || mailError);
  }

  return newUser;
};

export const verifyUserEmail = async (token) => {
  if (!token) {
    throw new Error('Mã xác thực không hợp lệ');
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
  } catch (err) {
    throw new Error('Liên kết kích hoạt không hợp lệ hoặc đã hết hạn');
  }

  const user = await findUserById(decoded.user_id);
  if (!user) {
    throw new Error('Tài khoản không tồn tại');
  }

  if (user.status === 'ACTIVE') {
    return { message: 'Tài khoản đã được kích hoạt từ trước' };
  }

  await updateUserStatus(user.user_id, 'ACTIVE');
  return { message: 'Kích hoạt tài khoản thành công' };
};

export const hashToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

export const requestPasswordReset = async (email) => {
  if (!email) {
    throw new Error('Email không được để trống');
  }

  const normalizedEmail = email.trim().toLowerCase();
  const user = await findUserByEmail(normalizedEmail);

  // Tránh email enumeration attack
  if (!user) {
    return {
      success: true,
      message: 'Nếu email tồn tại trong hệ thống, link đặt lại mật khẩu sẽ được gửi đến email của bạn'
    };
  }

  if (user.type && user.type !== 'LOCAL') {
    const error = new Error('Tài khoản không hỗ trợ đặt lại mật khẩu bằng email');
    error.statusCode = 403;
    throw error;
  }

  const resetToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = hashToken(resetToken);
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 phút

  await createPasswordResetToken({
    userId: user.user_id,
    tokenHash,
    expiresAt
  });

  try {
    await emailHelper.sendResetPasswordEmail(
      normalizedEmail,
      user.first_name || '',
      resetToken
    );
  } catch (error) {
    console.error('[auth.service] Lỗi gửi email đặt lại mật khẩu:', error);
    throw new Error('Không thể gửi email đặt lại mật khẩu. Vui lòng thử lại sau.');
  }

  return {
    success: true,
    message: 'Nếu email tồn tại trong hệ thống, link đặt lại mật khẩu sẽ được gửi đến email của bạn'
  };
};

export const resetPassword = async (token, newPassword) => {
  if (!token) {
    const error = new Error('Mã khôi phục không hợp lệ');
    error.statusCode = 400;
    throw error;
  }

  if (!newPassword || newPassword.length < 6) {
    const error = new Error('Mật khẩu mới phải có tối thiểu 6 ký tự');
    error.statusCode = 400;
    throw error;
  }

  const tokenHash = hashToken(token);
  const tokenData = await findPasswordResetToken(tokenHash);

  if (!tokenData) {
    const error = new Error('Token không hợp lệ hoặc đã hết hạn');
    error.statusCode = 400;
    throw error;
  }

  if (tokenData.used_at) {
    const error = new Error('Token này đã được sử dụng');
    error.statusCode = 400;
    throw error;
  }

  if (new Date(tokenData.expires_at) <= new Date()) {
    const error = new Error('Token đã hết hạn');
    error.statusCode = 400;
    throw error;
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(newPassword, salt);

  await resetUserPasswordWithToken({
    userId: tokenData.user_id,
    tokenId: tokenData.token_id,
    newPasswordHash: passwordHash
  });

  return {
    success: true,
    message: 'Đặt lại mật khẩu thành công'
  };
};


