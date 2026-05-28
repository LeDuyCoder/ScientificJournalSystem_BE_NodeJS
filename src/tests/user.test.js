import test from 'node:test';
import assert from 'node:assert';
import { mock } from 'node:test';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../app.js';
import pool from '../config/database.js';

test.after(async () => {
  await pool.end();
});

test.describe('User Profile APIs (DELETE & PUT /api/v1/users/me)', () => {
  test.afterEach(() => {
    mock.reset();
  });

  // --- DELETE TESTS ---
  test('Lỗi 401 khi tự xóa tài khoản mà không truyền token', async () => {
    const res = await request(app)
      .delete('/api/v1/users/me');

    assert.strictEqual(res.status, 401);
    assert.strictEqual(res.body.success, false);
    assert.strictEqual(res.body.message, 'Vui lòng đăng nhập để thực hiện hành động này.');
  });

  test('Lỗi 401 khi tự xóa tài khoản bằng token không hợp lệ', async () => {
    const res = await request(app)
      .delete('/api/v1/users/me')
      .set('Authorization', 'Bearer invalid-token-string');

    assert.strictEqual(res.status, 401);
    assert.strictEqual(res.body.success, false);
    assert.strictEqual(res.body.message, 'Token đã hết hạn hoặc không hợp lệ. Vui lòng đăng nhập lại.');
  });

  test('Xóa tài khoản thành công khi có Token hợp lệ', async () => {
    const userId = 'a8e9c612-40db-4ff0-87a0-0f8b3b4f6cf7';
    const testEmail = 'tester_delete@gmail.com';
    const testToken = jwt.sign(
      { user_id: userId, email: testEmail },
      process.env.JWT_SECRET || 'scientific_journal_secret_key',
      { expiresIn: '1h' }
    );

    let deleteQueryCalled = false;
    mock.method(pool, 'query', async (sql, params) => {
      if (sql.includes('DELETE FROM "user" WHERE "user_id" = $1')) {
        deleteQueryCalled = true;
        assert.strictEqual(params[0], userId);
        return {
          rows: [{
            user_id: userId,
            email: testEmail
          }]
        };
      }
      return { rows: [] };
    });

    const res = await request(app)
      .delete('/api/v1/users/me')
      .set('Authorization', `Bearer ${testToken}`);

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(res.body.message.includes(`Xóa tài khoản ${testEmail} thành công!`));
    assert.strictEqual(res.body.data.user_id, userId);
    assert.ok(deleteQueryCalled);
  });

  // --- PUT TESTS ---
  test('Lỗi 401 khi cập nhật tài khoản mà không truyền token', async () => {
    const res = await request(app)
      .put('/api/v1/users/me')
      .send({ first_name: 'John' });

    assert.strictEqual(res.status, 401);
    assert.strictEqual(res.body.success, false);
    assert.strictEqual(res.body.message, 'Vui lòng đăng nhập để thực hiện hành động này.');
  });

  test('Cập nhật tài khoản thành công khi có Token hợp lệ', async () => {
    const userId = 'a8e9c612-40db-4ff0-87a0-0f8b3b4f6cf7';
    const testEmail = 'tester_update@gmail.com';
    const testToken = jwt.sign(
      { user_id: userId, email: testEmail },
      process.env.JWT_SECRET || 'scientific_journal_secret_key',
      { expiresIn: '1h' }
    );

    let updateQueryCalled = false;
    mock.method(pool, 'query', async (sql, params) => {
      if (sql.includes('UPDATE "user"')) {
        updateQueryCalled = true;
        assert.strictEqual(params[0], userId);
        assert.strictEqual(params[1], 'Hao');
        assert.strictEqual(params[2], 'Phung');
        return {
          rows: [{
            user_id: userId,
            email: testEmail,
            first_name: 'Hao',
            last_name: 'Phung',
            date_of_birth: '1999-01-27',
            gender: true,
            url_image: 'https://example.com/avatar.jpg'
          }]
        };
      }
      return { rows: [] };
    });

    const res = await request(app)
      .put('/api/v1/users/me')
      .set('Authorization', `Bearer ${testToken}`)
      .send({
        first_name: 'Hao',
        last_name: 'Phung',
        date_of_birth: '1999-01-27',
        gender: true,
        url_image: 'https://example.com/avatar.jpg'
      });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.message, 'Cập nhật thông tin cá nhân thành công!');
    assert.strictEqual(res.body.data.first_name, 'Hao');
    assert.strictEqual(res.body.data.last_name, 'Phung');
    assert.ok(updateQueryCalled);
  });
});
