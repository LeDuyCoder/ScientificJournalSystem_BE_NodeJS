import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { findUserByEmail, createUser } from './auth.repository.js';

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

  console.log('[auth.service] Creating user in DB...');
  const newUser = await createUser({
    user_id: crypto.randomUUID(),
    email: email.toLowerCase(),
    password: password_hash,
    first_name,
    last_name,
    date_of_birth: date_of_birth ? new Date(date_of_birth) : null,
    gender: gender !== undefined ? gender : null,
    role,
    status: 'ACTIVE'
  });
  console.log('[auth.service] User created successfully');

  return newUser;
};
