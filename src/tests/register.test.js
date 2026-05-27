import test from 'node:test';
import assert from 'node:assert';
import { mock } from 'node:test';
import request from 'supertest';
import app from '../app.js';
import pool from '../config/database.js';

// Đóng database pool sau khi tất cả test kết thúc để tránh treo tiến trình
test.after(async () => {
  await pool.end();
});

test.describe('Authentication API - POST /api/v1/auth/register', () => {

  test.afterEach(() => {
    mock.reset();
  });

  test('Đăng ký thành công với thông tin hợp lệ', async () => {
    let queryCount = 0;
    mock.method(pool, 'query', async (sql, params) => {
      queryCount++;
      if (queryCount === 1) {
        // SELECT 1 (check email)
        return { rows: [] };
      } else {
        // INSERT INTO "user"
        return {
          rows: [{
            user_id: 'a8e9c612-40db-4ff0-87a0-0f8b3b4f6cf7',
            email: 'newuser@gmail.com',
            type: 'LOCAL',
            status: 'ACTIVE',
            role: 'LECTURER',
            first_name: 'Văn A',
            last_name: 'Nguyễn',
            date_of_birth: '1999-01-01',
            gender: true
          }]
        };
      }
    });

    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'newuser@gmail.com',
        password: 'password123',
        first_name: 'Văn A',
        last_name: 'Nguyễn',
        date_of_birth: '1999-01-01',
        gender: true
      });

    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.message, 'Đăng ký tài khoản thành công');
    assert.strictEqual(res.body.data.email, 'newuser@gmail.com');
  });

  test('Lỗi 409 - Email đã tồn tại', async () => {
    mock.method(pool, 'query', async (sql, params) => {
      // Mock check email tìm thấy tài khoản đã tồn tại
      return { rows: [{ 1: 1 }] };
    });

    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'existing@gmail.com',
        password: 'password123'
      });

    assert.strictEqual(res.status, 409);
    assert.strictEqual(res.body.success, false);
    assert.strictEqual(res.body.message, 'Email đã tồn tại');
  });

  test('Lỗi 400 - Thiếu email', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: '',
        password: 'password123'
      });

    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.success, false);
    assert.strictEqual(res.body.message, 'Email không được để trống');
  });

  test('Lỗi 400 - Mật khẩu ngắn hơn 6 ký tự', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'user@gmail.com',
        password: '123'
      });

    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.success, false);
    assert.strictEqual(res.body.message, 'Mật khẩu phải có ít nhất 6 ký tự');
  });
});
