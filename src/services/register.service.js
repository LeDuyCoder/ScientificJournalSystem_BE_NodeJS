import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import pool from '../config/database.js';

export const registerWithEmailPassword = async ({
  email,
  password,
  first_name,
  last_name,
  date_of_birth,
  gender,
  role
}) => {
  const normalizedEmail = email.trim().toLowerCase();

  // 1. Kiểm tra email đã tồn tại hay chưa
  const checkQuery = `SELECT 1 FROM "user" WHERE LOWER("email") = $1 LIMIT 1`;
  const checkResult = await pool.query(checkQuery, [normalizedEmail]);

  if (checkResult.rows.length > 0) {
    const error = new Error('Email đã tồn tại');
    error.statusCode = 409;
    throw error;
  }

  // 2. Băm mật khẩu
  const hashedPassword = await bcrypt.hash(password, 10);
  const userId = crypto.randomUUID();

  // 3. Insert user mới vào Database
  const insertQuery = `
    INSERT INTO "user" (
      "user_id",
      "email",
      "password",
      "type",
      "status",
      "role",
      "first_name",
      "last_name",
      "date_of_birth",
      "gender"
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    RETURNING
      "user_id",
      "email",
      "type",
      "status",
      "role",
      "first_name",
      "last_name",
      "date_of_birth",
      "gender"
  `;

  const insertResult = await pool.query(insertQuery, [
    userId,
    normalizedEmail,
    hashedPassword,
    'LOCAL',
    'ACTIVE',
    role,
    first_name || null,
    last_name || null,
    date_of_birth || null,
    gender !== undefined ? gender : null
  ]);

  return insertResult.rows[0];
};
