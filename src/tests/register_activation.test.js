import test from 'node:test';
import assert from 'node:assert';
import { mock } from 'node:test';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../app.js';
import pool from '../config/database.js';
import * as emailUtils from '../utils/email.js';

test.after(async () => {
  await pool.end();
});

test.describe('Register & Account Activation (SMTP Flow)', () => {
  test.afterEach(() => {
    mock.reset();
  });

  test('Đăng ký tài khoản thành công - Trạng thái mặc định là INACTIVE và gọi hàm gửi Email', async () => {
    // Giả lập check email chưa tồn tại
    let checkQueryCalled = false;
    let insertQueryCalled = false;
    const testUserEmail = 'newuser@gmail.com';

    mock.method(pool, 'query', async (sql, params) => {
      if (sql.includes('SELECT 1 FROM "user"')) {
        checkQueryCalled = true;
        return { rows: [] }; // Chưa tồn tại email
      }
      if (sql.includes('INSERT INTO "user"')) {
        insertQueryCalled = true;
        // Trả về user với status 'INACTIVE'
        return {
          rows: [{
            user_id: 'a8e9c612-40db-4ff0-87a0-0f8b3b4f6cf7',
            email: testUserEmail,
            type: 'LOCAL',
            status: 'INACTIVE',
            role: 'STUDENT',
            first_name: 'Hao',
            last_name: 'Phung'
          }]
        };
      }
      return { rows: [] };
    });

    // Mock hàm gửi email
    let emailSent = false;
    let sentTo = '';
    let sentToken = '';
    mock.method(emailUtils.emailHelper, 'sendActivationEmail', async (email, firstName, token) => {
      emailSent = true;
      sentTo = email;
      sentToken = token;
    });

    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: testUserEmail,
        password: 'Password123',
        first_name: 'Hao',
        last_name: 'Phung',
        role: 'STUDENT'
      });

    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.body.success, true);
    assert.ok(res.body.message.includes('Vui lòng kiểm tra email'));
    assert.strictEqual(res.body.data.status, 'INACTIVE');
    
    assert.ok(checkQueryCalled);
    assert.ok(insertQueryCalled);
    assert.ok(emailSent);
    assert.strictEqual(sentTo, testUserEmail);
    assert.ok(sentToken.length > 0);
  });

  test('Xác thực kích hoạt tài khoản thành công qua API GET /verify', async () => {
    const userId = 'a8e9c612-40db-4ff0-87a0-0f8b3b4f6cf7';
    const testToken = jwt.sign(
      { user_id: userId, email: 'newuser@gmail.com' },
      process.env.JWT_SECRET || 'scientific_journal_secret_key',
      { expiresIn: '24h' }
    );

    let selectQueryCalled = false;
    let updateQueryCalled = false;

    mock.method(pool, 'query', async (sql, params) => {
      if (sql.includes('SELECT "user_id", "status"')) {
        selectQueryCalled = true;
        return { rows: [{ user_id: userId, status: 'INACTIVE', email: 'newuser@gmail.com' }] };
      }
      if (sql.includes('UPDATE "user" SET "status" = \'ACTIVE\'')) {
        updateQueryCalled = true;
        return { rows: [{ email: 'newuser@gmail.com' }] };
      }
      return { rows: [] };
    });

    const res = await request(app)
      .get(`/api/v1/auth/verify?token=${testToken}`);

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.message, 'Kích hoạt tài khoản thành công! Bây giờ bạn có thể đăng nhập.');
    assert.ok(selectQueryCalled);
    assert.ok(updateQueryCalled);
  });

  test('Lỗi 400 khi kích hoạt tài khoản bằng token hết hạn hoặc sai định dạng', async () => {
    const invalidToken = 'invalid-token-string';

    const res = await request(app)
      .get(`/api/v1/auth/verify?token=${invalidToken}`);

    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.success, false);
    assert.strictEqual(res.body.message, 'Token kích hoạt không hợp lệ hoặc đã hết hạn');
  });

  test('Lỗi 400 khi kích hoạt tài khoản không truyền token', async () => {
    const res = await request(app)
      .get('/api/v1/auth/verify');

    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.success, false);
    assert.strictEqual(res.body.message, 'Token kích hoạt không được để trống');
  });
});
