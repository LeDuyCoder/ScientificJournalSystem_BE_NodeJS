import { test, describe, before, after, afterEach } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import { mock } from 'node:test';
import app from '../app.js';
import pool from '../config/database.js';
import jwt from 'jsonwebtoken';

describe('Google Authentication API (POST /api/v1/auth/google)', () => {
  let originalFetch;

  before(() => {
    originalFetch = globalThis.fetch;
  });

  after(async () => {
    globalThis.fetch = originalFetch;
    await pool.end();
  });

  afterEach(() => {
    mock.reset();
  });

  test('Đăng nhập Google thành công - Đăng ký tài khoản mới khi chưa tồn tại', async () => {
    const mockGooglePayload = {
      email: 'newgoogleuser@gmail.com',
      given_name: 'John',
      family_name: 'Doe',
      picture: 'https://avatar-url.com/john.jpg'
    };

    // Mock global fetch to return Google user details
    mock.method(globalThis, 'fetch', async (url) => {
      return {
        ok: true,
        json: async () => mockGooglePayload
      };
    });

    let checkQueryCalled = false;
    let insertQueryCalled = false;

    // Mock DB queries
    mock.method(pool, 'query', async (sql, params) => {
      const normalizedSql = sql.replace(/\s+/g, ' ');
      if (normalizedSql.includes('SELECT "user_id"') && normalizedSql.includes('FROM "user"')) {
        checkQueryCalled = true;
        return { rows: [] }; // Không tìm thấy user
      }
      if (normalizedSql.includes('INSERT INTO "user"')) {
        insertQueryCalled = true;
        return {
          rows: [{
            user_id: 'a8e9c612-40db-4ff0-87a0-0f8b3b4f6cf7',
            email: mockGooglePayload.email,
            type: 'GOOGLE',
            status: 'ACTIVE',
            role: 'STUDENT',
            first_name: mockGooglePayload.given_name,
            last_name: mockGooglePayload.family_name,
            url_image: mockGooglePayload.picture
          }]
        };
      }
      return { rows: [] };
    });

    const res = await request(app)
      .post('/api/v1/auth/google')
      .send({ idToken: 'valid-mock-google-token' });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.message, 'Đăng nhập bằng Google thành công');
    assert.ok(res.body.data.token);
    assert.strictEqual(res.body.data.user.email, 'newgoogleuser@gmail.com');
    assert.strictEqual(res.body.data.user.status, 'ACTIVE');

    assert.ok(checkQueryCalled);
    assert.ok(insertQueryCalled);
  });

  test('Đăng nhập Google thành công - Tự động kích hoạt tài khoản nếu trạng thái cũ là INACTIVE', async () => {
    const mockGooglePayload = {
      email: 'inactiveuser@gmail.com',
      given_name: 'Jane',
      family_name: 'Doe',
      picture: 'https://avatar-url.com/jane.jpg'
    };

    mock.method(globalThis, 'fetch', async (url) => {
      return {
        ok: true,
        json: async () => mockGooglePayload
      };
    });

    let selectQueryCalled = false;
    let updateStatusQueryCalled = false;

    mock.method(pool, 'query', async (sql, params) => {
      const normalizedSql = sql.replace(/\s+/g, ' ');
      if (normalizedSql.includes('SELECT "user_id"') && normalizedSql.includes('FROM "user"')) {
        selectQueryCalled = true;
        return {
          rows: [{
            user_id: 'a8e9c612-40db-4ff0-87a0-0f8b3b4f6cf7',
            email: 'inactiveuser@gmail.com',
            type: 'LOCAL',
            status: 'INACTIVE', // Trạng thái cũ là INACTIVE
            role: 'STUDENT',
            first_name: 'Jane',
            last_name: 'Doe'
          }]
        };
      }
      if (normalizedSql.includes('UPDATE "user" SET "status" = \'ACTIVE\'')) {
        updateStatusQueryCalled = true;
        return { rows: [] };
      }
      if (normalizedSql.includes('UPDATE "user" SET "type" = \'GOOGLE\'')) {
        return { rows: [] };
      }
      return { rows: [] };
    });

    const res = await request(app)
      .post('/api/v1/auth/google')
      .send({ idToken: 'valid-mock-google-token' });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(selectQueryCalled);
    assert.ok(updateStatusQueryCalled);
    assert.strictEqual(res.body.data.user.status, 'ACTIVE'); // Trở thành ACTIVE
  });

  test('Lỗi 403 khi tài khoản Google liên kết đã bị khóa (BANNED)', async () => {
    const mockGooglePayload = {
      email: 'banneduser@gmail.com',
      given_name: 'Banned',
      family_name: 'User'
    };

    mock.method(globalThis, 'fetch', async (url) => {
      return {
        ok: true,
        json: async () => mockGooglePayload
      };
    });

    mock.method(pool, 'query', async (sql, params) => {
      const normalizedSql = sql.replace(/\s+/g, ' ');
      if (normalizedSql.includes('SELECT "user_id"') && normalizedSql.includes('FROM "user"')) {
        return {
          rows: [{
            user_id: 'banned-uuid',
            email: 'banneduser@gmail.com',
            type: 'GOOGLE',
            status: 'BANNED',
            role: 'STUDENT'
          }]
        };
      }
      return { rows: [] };
    });

    const res = await request(app)
      .post('/api/v1/auth/google')
      .send({ idToken: 'banned-token' });

    assert.strictEqual(res.status, 403);
    assert.strictEqual(res.body.success, false);
    assert.strictEqual(res.body.message, 'Tài khoản đã bị khóa');
  });

  test('Lỗi 400 khi Google ID Token không hợp lệ', async () => {
    mock.method(globalThis, 'fetch', async (url) => {
      return {
        ok: false,
        json: async () => ({ error_description: 'Invalid Value' })
      };
    });

    const res = await request(app)
      .post('/api/v1/auth/google')
      .send({ idToken: 'invalid-token' });

    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.success, false);
    assert.strictEqual(res.body.message, 'Invalid Value');
  });
});
