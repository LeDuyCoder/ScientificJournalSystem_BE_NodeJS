import test from 'node:test';
import assert from 'node:assert';
import { mock } from 'node:test';
import request from 'supertest';
import jwt from 'jsonwebtoken';

import app from '../../../app.js';
import pool from '../../../config/database.js';
import keywordService from '../../../services/keyword.service.js';

const JWT_SECRET = process.env.JWT_SECRET;
const userId = 'a8e9c612-40db-4ff0-87a0-0f8b3b4f6cf7';
const testToken = jwt.sign({ user_id: userId, role: 'STUDENT', email: 'test@example.com' }, JWT_SECRET);

test.after(async () => {
  await pool.end();
});

test.describe('Keyword Controller - POST /api/v1/projects/:id/keywords/watch Unit Test Suite', () => {

  test.afterEach(() => {
    mock.reset();
  });

  // ==========================================
  // 1. Kiểm tra xác thực (Authentication)
  // ==========================================
  test.describe('Authentication', () => {
    test('Lỗi 401 - Không truyền Token xác thực', async () => {
      const res = await request(app)
        .post('/api/v1/projects/1/keywords/watch')
        .send({ keyword_ids: [1] });

      assert.strictEqual(res.status, 401);
      assert.strictEqual(res.body.success, false);
    });
  });

  // ==========================================
  // 2. Kiểm tra validation (Input)
  // ==========================================
  test.describe('Validation', () => {
    test('Lỗi 400 - Project ID không hợp lệ', async () => {
      const res = await request(app)
        .post('/api/v1/projects/abc/keywords/watch')
        .set('Authorization', `Bearer ${testToken}`)
        .send({ keyword_ids: [1] });

      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.body.success, false);
      assert.strictEqual(res.body.message, 'ID dự án không hợp lệ');
    });

    test('Lỗi 400 - keyword_ids không tồn tại hoặc không phải mảng', async () => {
      const res = await request(app)
        .post('/api/v1/projects/1/keywords/watch')
        .set('Authorization', `Bearer ${testToken}`)
        .send({ keyword_ids: "not_array" });

      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.body.success, false);
      assert.strictEqual(res.body.message, 'keyword_ids phải là một mảng');
    });

    test('Lỗi 400 - keyword_ids chứa phần tử không hợp lệ (số âm, chuỗi)', async () => {
      const res = await request(app)
        .post('/api/v1/projects/1/keywords/watch')
        .set('Authorization', `Bearer ${testToken}`)
        .send({ keyword_ids: [1, -5, "abc"] });

      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.body.success, false);
      assert.strictEqual(res.body.message, 'Các phần tử trong keyword_ids phải là số nguyên dương');
    });

    test('Lỗi 404 - Project không tồn tại hoặc không phải chủ sở hữu', async () => {
      mock.method(pool, 'query', async () => ({ rows: [] })); // Check project fail

      const res = await request(app)
        .post('/api/v1/projects/1/keywords/watch')
        .set('Authorization', `Bearer ${testToken}`)
        .send({ keyword_ids: [1] });

      assert.strictEqual(res.status, 404);
      assert.strictEqual(res.body.success, false);
      assert.strictEqual(res.body.message, 'Không tìm thấy dự án hoặc bạn không có quyền truy cập dự án này');
    });

    test('Lỗi 400 - Keyword ID không tồn tại trong DB', async () => {
      mock.method(pool, 'query', async () => ({ rows: [{ 1: 1 }] })); // Check project pass
      mock.method(keywordService, 'validateKeywordIds', async () => false); // Validate keyword fail

      const res = await request(app)
        .post('/api/v1/projects/1/keywords/watch')
        .set('Authorization', `Bearer ${testToken}`)
        .send({ keyword_ids: [1] });

      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.body.success, false);
      assert.strictEqual(res.body.message, 'Một hoặc nhiều Keyword ID không tồn tại trong hệ thống');
    });
  });

  // ==========================================
  // 3. Trường hợp thành công
  // ==========================================
  test.describe('Success Cases', () => {
    test('Thành công (201) - Cập nhật list keywords hợp lệ', async () => {
      mock.method(pool, 'query', async () => ({ rows: [{ 1: 1 }] })); // Check project pass
      mock.method(keywordService, 'validateKeywordIds', async () => true); // Validate keyword pass
      mock.method(keywordService, 'syncWatchedKeywords', async () => true); // Sync pass

      const res = await request(app)
        .post('/api/v1/projects/1/keywords/watch')
        .set('Authorization', `Bearer ${testToken}`)
        .send({ keyword_ids: [1, 2, 3] });

      assert.strictEqual(res.status, 201);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.message, 'Cập nhật danh sách từ khóa theo dõi thành công');
    });

    test('Thành công (201) - Gửi mảng rỗng (unwatch all)', async () => {
      mock.method(pool, 'query', async () => ({ rows: [{ 1: 1 }] })); // Check project pass
      mock.method(keywordService, 'syncWatchedKeywords', async () => true); // Sync pass

      const res = await request(app)
        .post('/api/v1/projects/1/keywords/watch')
        .set('Authorization', `Bearer ${testToken}`)
        .send({ keyword_ids: [] });

      assert.strictEqual(res.status, 201);
      assert.strictEqual(res.body.success, true);
    });
  });

  // ==========================================
  // 4. Lỗi hệ thống
  // ==========================================
  test.describe('Server Error', () => {
    test('Lỗi 500 - Exception trong DB query', async () => {
      mock.method(pool, 'query', async () => {
        throw new Error('Database connection lost');
      });

      const res = await request(app)
        .post('/api/v1/projects/1/keywords/watch')
        .set('Authorization', `Bearer ${testToken}`)
        .send({ keyword_ids: [1] });

      assert.strictEqual(res.status, 500);
      assert.strictEqual(res.body.success, false);
      assert.strictEqual(res.body.message, 'Có lỗi xảy ra ở Server!');
    });
  });
});
