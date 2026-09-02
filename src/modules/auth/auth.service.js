import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { findUserByEmail, createUser } from './auth.repository.js';

export const loginUser = async (email, password) => {
  const user = await findUserByEmail(email);
  if (!user) {
    throw new Error('Email hoặc mật khẩu không đúng');
  }

  if (user.status !== 'ACTIVE') {
    throw new Error('Tài khoản đã bị khóa hoặc chưa được kích hoạt');
  }

  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) {
    throw new Error('Email hoặc mật khẩu không đúng');
  }

  const token = jwt.sign(
    { user_id: user.user_id, role: user.role, email: user.email },
    process.env.JWT_SECRET || 'secret',
    { expiresIn: '24h' }
  );

  return { token, user };
};

export const registerUser = async (email, password, fullname, role = 'STUDENT') => {
  const existingUser = await findUserByEmail(email);
  if (existingUser) {
    throw new Error('Email này đã được sử dụng');
  }

  const salt = await bcrypt.genSalt(10);
  const password_hash = await bcrypt.hash(password, salt);

  const newUser = await createUser({
    email: email.toLowerCase(),
    password_hash,
    fullname,
    role,
    status: 'ACTIVE'
  });

  return newUser;
};
