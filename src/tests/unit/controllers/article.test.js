import test from 'node:test';
import assert from 'node:assert';
import { mock } from 'node:test';
import request from 'supertest';
import jwt from 'jsonwebtoken';

// Đảm bảo JWT_SECRET luôn có giá trị khi chạy test
process.env.JWT_SECRET = process.env.JWT_SECRET || 'scientific_journal_secret_key';

import app from '../../../app.js';
import pool from '../../../config/database.js';

const JWT_SECRET = process.env.JWT_SECRET;
const userId = 'a8e9c612-40db-4ff0-87a0-0f8b3b4f6cf7';
const testToken = jwt.sign({ user_id: userId, role: 'STUDENT', email: 'test@example.com' }, JWT_SECRET);

test.after(async () => {
  await pool.end();
});

test.describe('Article Controller - GET /api/v1/articles Unit Test Suite', () => {

  test.afterEach(() => {
    mock.reset();
  });

  // ==========================================
  // 1. Kiểm tra xác thực (Authentication)
  // ==========================================
  test.describe('Authentication', () => {
    test('Lỗi 401 - Không truyền Token xác thực', async () => {
      const res = await request(app)
        .get('/api/v1/articles?keywords=Machine Learning');

      assert.strictEqual(res.status, 401);
      assert.strictEqual(res.body.success, false);
    });

    test('Lỗi 401 - Token không hợp lệ', async () => {
      const res = await request(app)
        .get('/api/v1/articles?keywords=Machine Learning')
        .set('Authorization', 'Bearer invalid_token_here');

      assert.strictEqual(res.status, 401);
      assert.strictEqual(res.body.success, false);
    });

    test('Lỗi 401 - Sai định dạng Authorization header (không có Bearer)', async () => {
      const res = await request(app)
        .get('/api/v1/articles?keywords=Machine Learning')
        .set('Authorization', testToken);

      assert.strictEqual(res.status, 401);
      assert.strictEqual(res.body.success, false);
    });
  });

  // ==========================================
  // 2. Kiểm tra validation (Input)
  // ==========================================
  test.describe('Validation', () => {
    test('Lỗi 400 - Thiếu tham số keywords', async () => {
      const res = await request(app)
        .get('/api/v1/articles')
        .set('Authorization', `Bearer ${testToken}`);

      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.body.success, false);
      assert.ok(res.body.message.includes('keywords'));
    });

    test('Lỗi 400 - keywords là chuỗi rỗng', async () => {
      const res = await request(app)
        .get('/api/v1/articles?keywords=')
        .set('Authorization', `Bearer ${testToken}`);

      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.body.success, false);
    });

    test('Lỗi 400 - keywords chỉ chứa khoảng trắng', async () => {
      const res = await request(app)
        .get('/api/v1/articles?keywords=%20%20%20')
        .set('Authorization', `Bearer ${testToken}`);

      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.body.success, false);
    });

    test('Lỗi 400 - keywords chỉ chứa dấu phẩy (tách ra thành mảng rỗng)', async () => {
      const res = await request(app)
        .get('/api/v1/articles?keywords=,,,')
        .set('Authorization', `Bearer ${testToken}`);

      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.body.success, false);
      assert.strictEqual(res.body.message, 'Danh sách keyword không hợp lệ!');
    });
  });

  // ==========================================
  // 3. Trường hợp thành công
  // ==========================================
  test.describe('Success Cases', () => {
    test('Thành công: Tìm bài báo với 1 keyword', async () => {
      const mockArticles = [
        {
          article_id: 101,
          title: 'Deep Learning for NLP',
          abstract: 'A survey on DL...',
          publication_year: 2024,
          doi: 'https://doi.org/10.1000/ex1',
          created_at: '2024-01-15T00:00:00.000Z'
        }
      ];

      mock.method(pool, 'query', async (sql, params) => {
        if (typeof sql === 'string' && sql.includes('COUNT')) {
          return { rows: [{ total: '1' }] };
        }
        return { rows: mockArticles };
      });

      const res = await request(app)
        .get('/api/v1/articles?keywords=Deep Learning')
        .set('Authorization', `Bearer ${testToken}`);

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.message, 'Lấy danh sách bài báo thành công!');
      assert.strictEqual(res.body.data.articles.length, 1);
      assert.strictEqual(res.body.data.articles[0].title, 'Deep Learning for NLP');
      assert.strictEqual(res.body.data.pagination.total, 1);
    });

    test('Thành công: Tìm bài báo với nhiều keywords (phân tách bằng dấu phẩy)', async () => {
      const mockArticles = [
        { article_id: 101, title: 'Article 1', abstract: null, publication_year: 2024, doi: null, created_at: null },
        { article_id: 102, title: 'Article 2', abstract: null, publication_year: 2023, doi: null, created_at: null },
        { article_id: 103, title: 'Article 3', abstract: null, publication_year: 2022, doi: null, created_at: null }
      ];

      mock.method(pool, 'query', async (sql, params) => {
        if (typeof sql === 'string' && sql.includes('COUNT')) {
          return { rows: [{ total: '3' }] };
        }
        return { rows: mockArticles };
      });

      const res = await request(app)
        .get('/api/v1/articles?keywords=Machine Learning,Deep Learning,Neural Network')
        .set('Authorization', `Bearer ${testToken}`);

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.data.articles.length, 3);
      assert.strictEqual(res.body.data.pagination.total, 3);
    });

    test('Thành công: Trả về mảng rỗng khi không có bài báo phù hợp', async () => {
      mock.method(pool, 'query', async (sql, params) => {
        if (typeof sql === 'string' && sql.includes('COUNT')) {
          return { rows: [{ total: '0' }] };
        }
        return { rows: [] };
      });

      const res = await request(app)
        .get('/api/v1/articles?keywords=xyznonexistentkeyword')
        .set('Authorization', `Bearer ${testToken}`);

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.data.articles.length, 0);
      assert.strictEqual(res.body.data.pagination.total, 0);
      assert.strictEqual(res.body.data.pagination.total_pages, 0);
    });
  });

  // ==========================================
  // 4. Phân trang (Pagination)
  // ==========================================
  test.describe('Pagination', () => {
    test('Sử dụng giá trị mặc định khi không truyền limit và page', async () => {
      mock.method(pool, 'query', async (sql, params) => {
        if (typeof sql === 'string' && sql.includes('COUNT')) {
          return { rows: [{ total: '100' }] };
        }
        return { rows: [] };
      });

      const res = await request(app)
        .get('/api/v1/articles?keywords=AI')
        .set('Authorization', `Bearer ${testToken}`);

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.data.pagination.page, 1);
      assert.strictEqual(res.body.data.pagination.limit, 20);
      assert.strictEqual(res.body.data.pagination.total, 100);
      assert.strictEqual(res.body.data.pagination.total_pages, 5);
    });

    test('Phân trang đúng khi truyền limit và page tùy chỉnh', async () => {
      let capturedParams = null;

      mock.method(pool, 'query', async (sql, params) => {
        if (typeof sql === 'string' && sql.includes('COUNT')) {
          return { rows: [{ total: '50' }] };
        }
        capturedParams = params;
        return { rows: [] };
      });

      const res = await request(app)
        .get('/api/v1/articles?keywords=AI&limit=10&page=3')
        .set('Authorization', `Bearer ${testToken}`);

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.data.pagination.page, 3);
      assert.strictEqual(res.body.data.pagination.limit, 10);
      assert.strictEqual(res.body.data.pagination.total, 50);
      assert.strictEqual(res.body.data.pagination.total_pages, 5);

      // Kiểm tra offset = (page - 1) * limit = (3-1)*10 = 20
      assert.strictEqual(capturedParams[0], 10);  // limit
      assert.strictEqual(capturedParams[1], 20);  // offset
    });
  });

  // ==========================================
  // 5. Xử lý lỗi Server
  // ==========================================
  test.describe('Server Error', () => {
    test('Lỗi 500 - Database query thất bại', async () => {
      mock.method(pool, 'query', async () => {
        throw new Error('Database connection lost');
      });

      const res = await request(app)
        .get('/api/v1/articles?keywords=AI')
        .set('Authorization', `Bearer ${testToken}`);

      assert.strictEqual(res.status, 500);
      assert.strictEqual(res.body.success, false);
      assert.strictEqual(res.body.message, 'Có lỗi xảy ra ở Server!');
    });
  });
});
