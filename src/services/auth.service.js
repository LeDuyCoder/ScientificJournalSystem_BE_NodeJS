import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../config/database.js';

const buildLoginError = () => {
  const error = new Error('Email hoặc mật khẩu không đúng');
  error.statusCode = 401;
  return error;
};

const signToken = (user) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('Missing JWT_SECRET in environment variables');
  }

  return jwt.sign(
    {
      user_id: user.user_id,
      role: user.role
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || '1d'
    }
  );
};

export const loginWithEmailPassword = async ({ email, password }) => {
  const normalizedEmail = email.trim().toLowerCase();

  const query = `
    SELECT
      "user_id",
      "email",
      "password",
      "type",
      "status",
      "role",
      "last_name",
      "first_name",
      "url_image",
      "date_of_birth",
      "gender"
    FROM "user"
    WHERE LOWER("email") = $1
    LIMIT 1
  `;

  const result = await pool.query(query, [normalizedEmail]);
  const user = result.rows[0];

  if (!user) {
    throw buildLoginError();
  }

  if (user.type !== 'LOCAL') {
    const error = new Error('Tài khoản này không hỗ trợ đăng nhập bằng mật khẩu');
    error.statusCode = 403;
    throw error;
  }

  if (user.status !== 'ACTIVE') {
    const error = new Error(
      user.status === 'BANNED'
        ? 'Tài khoản đã bị khóa'
        : 'Tài khoản chưa được kích hoạt'
    );
    error.statusCode = 403;
    throw error;
  }

  if (!user.password) {
    throw buildLoginError();
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    throw buildLoginError();
  }

  const token = signToken(user);

  return {
    token,
    user: {
      user_id: user.user_id,
      email: user.email,
      role: user.role,
      status: user.status,
      last_name: user.last_name,
      first_name: user.first_name,
      url_image: user.url_image,
      date_of_birth: user.date_of_birth,
      gender: user.gender
    }
  };
};