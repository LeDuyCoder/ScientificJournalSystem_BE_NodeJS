import test from 'node:test';
import assert from 'node:assert';
import { mock } from 'node:test';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import app from '../app.js';
import pool from '../config/database.js';

// Tạo mật khẩu đã băm giả lập cho các trường hợp kiểm thử
const hashedPassword = await bcrypt.hash('123456', 10);

// Đóng database pool sau khi tất cả test kết thúc để tránh treo tiến trình
test.after(async () => {
  await pool.end();
});

test.describe('Authentication API - POST /api/v1/auth/login', () => {

  test.afterEach(() => {
    // Reset các mock sau mỗi test case
    mock.reset();
  });

  // 1. Trường hợp: Đăng nhập thành công
  test('Đăng nhập thành công với thông tin hợp lệ (status: ACTIVE, type: LOCAL)', async () => {
    mock.method(pool, 'query', async (sql, params) => {
      return {
        rows: [{
          user_id: 'a8e9c612-40db-4ff0-87a0-0f8b3b4f6cf7',
          email: 'test@gmail.com',
          password: hashedPassword,
          type: 'LOCAL',
          status: 'ACTIVE',
          role: 'STUDENT',
          last_name: 'Văn A',
          first_name: 'Nguyễn',
          url_image: 'http://example.com/image.png',
          date_of_birth: '1999-01-01',
          gender: true
        }]
      };
    });

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'test@gmail.com',
        password: '123456'
      });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.message, 'Đăng nhập thành công');
    assert.ok(res.body.data.token);
    assert.strictEqual(res.body.data.user.email, 'test@gmail.com');
  });

  // 2. Trường hợp: Sai mật khẩu
  test('Lỗi 401 - Sai mật khẩu', async () => {
    mock.method(pool, 'query', async (sql, params) => {
      return {
        rows: [{
          user_id: 'a8e9c612-40db-4ff0-87a0-0f8b3b4f6cf7',
          email: 'test@gmail.com',
          password: hashedPassword,
          type: 'LOCAL',
          status: 'ACTIVE',
          role: 'STUDENT'
        }]
      };
    });

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'test@gmail.com',
        password: 'wrongpassword'
      });

    assert.strictEqual(res.status, 401);
    assert.strictEqual(res.body.success, false);
    assert.strictEqual(res.body.message, 'Email hoặc mật khẩu không đúng');
  });

  // 3. Trường hợp: Tài khoản không tồn tại
  test('Lỗi 401 - Tài khoản không tồn tại', async () => {
    mock.method(pool, 'query', async (sql, params) => {
      return { rows: [] };
    });

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'notfound@gmail.com',
        password: '123456'
      });

    assert.strictEqual(res.status, 401);
    assert.strictEqual(res.body.success, false);
    assert.strictEqual(res.body.message, 'Email hoặc mật khẩu không đúng');
  });

  // 4. Trường hợp: Tài khoản bị khóa (BANNED)
  test('Lỗi 403 - Tài khoản bị khóa (BANNED)', async () => {
    mock.method(pool, 'query', async (sql, params) => {
      return {
        rows: [{
          user_id: 'a8e9c612-40db-4ff0-87a0-0f8b3b4f6cf7',
          email: 'banned@gmail.com',
          password: hashedPassword,
          type: 'LOCAL',
          status: 'BANNED',
          role: 'STUDENT'
        }]
      };
    });

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'banned@gmail.com',
        password: '123456'
      });

    assert.strictEqual(res.status, 403);
    assert.strictEqual(res.body.success, false);
    assert.strictEqual(res.body.message, 'Tài khoản đã bị khóa');
  });
});
