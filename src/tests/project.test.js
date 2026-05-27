import test from 'node:test';
import assert from 'node:assert';
import { mock } from 'node:test';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../app.js';
import pool from '../config/database.js';

const JWT_SECRET = process.env.JWT_SECRET || 'scientific_journal_secret_key';
const userId = 'a8e9c612-40db-4ff0-87a0-0f8b3b4f6cf7';
const testToken = jwt.sign({ user_id: userId, role: 'STUDENT' }, JWT_SECRET);

test.after(async () => {
  await pool.end();
});

test.describe('Project Management API - CRUD Operations (BIGINT)', () => {

  test.afterEach(() => {
    mock.reset();
  });

  // ==========================================
  // 1. GET /api/v1/projects - Lấy danh sách dự án
  // ==========================================
  test.describe('GET /api/v1/projects', () => {
    test('Lấy danh sách dự án thành công (Đã xác thực)', async () => {
      const mockProjects = [
        {
          project_id: '12',
          title: 'Dự án nghiên cứu AI',
          subject_area: 1,
          created_at: '2026-05-27T10:00:00.000Z'
        }
      ];

      mock.method(pool, 'query', async (sql, params) => {
        return { rows: mockProjects };
      });

      const res = await request(app)
        .get('/api/v1/projects')
        .set('Authorization', `Bearer ${testToken}`);

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.data.length, 1);
      assert.strictEqual(res.body.data[0].title, 'Dự án nghiên cứu AI');
      assert.strictEqual(res.body.data[0].project_id, '12');
    });

    test('Lỗi 401 - Chưa xác thực (Không truyền Token)', async () => {
      const res = await request(app)
        .get('/api/v1/projects');

      assert.strictEqual(res.status, 401);
      assert.strictEqual(res.body.success, false);
      assert.strictEqual(res.body.message, 'Không tìm thấy token xác thực hoặc token không hợp lệ');
    });
  });

  // ==========================================
  // 2. GET /api/v1/projects/:id - Chi tiết dự án
  // ==========================================
  test.describe('GET /api/v1/projects/:id', () => {
    test('Lấy chi tiết dự án thành công', async () => {
      const projectId = '12';
      
      let queryCallCount = 0;
      mock.method(pool, 'query', async (sql, params) => {
        queryCallCount++;
        if (queryCallCount === 1) {
          // Lấy thông tin chung của project và Subject Area từ bảng "Project"
          return {
            rows: [{
              project_id: projectId,
              title: 'Dự án nghiên cứu AI',
              user_id: userId,
              subject_area: 1,
              created_at: '2026-05-27T10:00:00.000Z',
              subject_area_name: 'Computer Science',
              subject_area_description: 'CS Area'
            }]
          };
        } else if (queryCallCount === 2) {
          // Lấy danh sách Subject Category từ "Subject_Category_Project"
          return {
            rows: [{
              subject_category_id: 10,
              display_name: 'Artificial Intelligence',
              description: 'AI Category',
              subject_area_id: 1
            }]
          };
        } else {
          // Lấy danh sách Journal từ "Project_Journal"
          return {
            rows: [{
              journal_id: 100,
              display_name: 'Journal of Machine Learning Research',
              issn: '1532-4435'
            }]
          };
        }
      });

      const res = await request(app)
        .get(`/api/v1/projects/${projectId}`)
        .set('Authorization', `Bearer ${testToken}`);

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.data.title, 'Dự án nghiên cứu AI');
      assert.strictEqual(res.body.data.subject_area.display_name, 'Computer Science');
      assert.strictEqual(res.body.data.subject_categories[0].display_name, 'Artificial Intelligence');
      assert.strictEqual(res.body.data.journals[0].display_name, 'Journal of Machine Learning Research');
    });

    test('Lỗi 400 - ID dự án không hợp lệ (không phải số nguyên)', async () => {
      const res = await request(app)
        .get('/api/v1/projects/not-a-number')
        .set('Authorization', `Bearer ${testToken}`);

      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.body.success, false);
      assert.strictEqual(res.body.message, 'ID dự án không hợp lệ');
    });

    test('Lỗi 404 - Dự án không tồn tại hoặc không thuộc quyền sở hữu', async () => {
      mock.method(pool, 'query', async (sql, params) => {
        return { rows: [] };
      });

      const res = await request(app)
        .get('/api/v1/projects/999')
        .set('Authorization', `Bearer ${testToken}`);

      assert.strictEqual(res.status, 404);
      assert.strictEqual(res.body.success, false);
      assert.strictEqual(res.body.message, 'Không tìm thấy dự án hoặc bạn không có quyền truy cập dự án này');
    });
  });

  // ==========================================
  // 3. POST /api/v1/projects - Tạo mới dự án
  // ==========================================
  test.describe('POST /api/v1/projects', () => {
    test('Tạo dự án thành công', async () => {
      let queryCallCount = 0;
      mock.method(pool, 'query', async (sql, params) => {
        queryCallCount++;
        if (queryCallCount === 1) {
          // Check subject_area
          return { rows: [{ 1: 1 }] };
        } else if (queryCallCount === 2) {
          // Check subject_category_ids
          return { rows: [{ subject_category_id: 10 }, { subject_category_id: 11 }] };
        } else {
          // Check journal_ids
          return { rows: [{ journal_id: 100 }] };
        }
      });

      const mockClient = {
        query: async (sql, params) => {
          if (sql.includes('INSERT INTO "Project"')) {
            return {
              rows: [{
                project_id: '12',
                user_id: userId,
                title: 'Dự án Nghiên Cứu Mới',
                subject_area: 1,
                created_at: '2026-05-27T10:00:00.000Z'
              }]
            };
          }
          return { rows: [] };
        },
        release: () => {}
      };
      mock.method(pool, 'connect', async () => mockClient);

      const res = await request(app)
        .post('/api/v1/projects')
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          title: 'Dự án Nghiên Cứu Mới',
          subject_area: 1,
          subject_category_ids: [10, 11],
          journal_ids: [100]
        });

      assert.strictEqual(res.status, 201);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.data.title, 'Dự án Nghiên Cứu Mới');
      assert.strictEqual(res.body.data.project_id, '12');
    });

    test('Lỗi 400 - Thiếu tiêu đề dự án', async () => {
      const res = await request(app)
        .post('/api/v1/projects')
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          title: '',
          subject_area: 1
        });

      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.body.success, false);
      assert.strictEqual(res.body.message, 'Tiêu đề dự án không được để trống');
    });

    test('Lỗi 400 - Subject Area ID không tồn tại', async () => {
      mock.method(pool, 'query', async (sql, params) => {
        // Kiểm tra Area trả về rỗng (không tồn tại)
        return { rows: [] };
      });

      const res = await request(app)
        .post('/api/v1/projects')
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          title: 'Dự án Lỗi',
          subject_area: 999
        });

      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.body.success, false);
      assert.ok(res.body.message.includes('không tồn tại'));
    });
  });

  // ==========================================
  // 4. PUT /api/v1/projects/:id - Cập nhật dự án
  // ==========================================
  test.describe('PUT /api/v1/projects/:id', () => {
    test('Cập nhật dự án thành công', async () => {
      const projectId = '12';
      
      let queryCallCount = 0;
      mock.method(pool, 'query', async (sql, params) => {
        queryCallCount++;
        if (queryCallCount === 1) {
          // Check ownership
          return { rows: [{ 1: 1 }] };
        } else if (queryCallCount === 2) {
          // Check subject_area
          return { rows: [{ 1: 1 }] };
        } else if (queryCallCount === 3) {
          // Check subject_category_ids
          return { rows: [{ subject_category_id: 10 }] };
        } else {
          // Check journal_ids
          return { rows: [{ journal_id: 100 }] };
        }
      });

      const mockClient = {
        query: async (sql, params) => {
          return { rows: [] };
        },
        release: () => {}
      };
      mock.method(pool, 'connect', async () => mockClient);

      const res = await request(app)
        .put(`/api/v1/projects/${projectId}`)
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          title: 'Dự án Cập Nhật',
          subject_area: 2,
          subject_category_ids: [10],
          journal_ids: [100]
        });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.message, 'Cập nhật dự án thành công');
    });

    test('Lỗi 400 - ID dự án không hợp lệ khi cập nhật', async () => {
      const res = await request(app)
        .put('/api/v1/projects/not-a-number')
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          title: 'Dự án Cập Nhật'
        });

      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.body.success, false);
      assert.strictEqual(res.body.message, 'ID dự án không hợp lệ');
    });

    test('Lỗi 404 - Dự án cần cập nhật không tồn tại hoặc không thuộc quyền sở hữu', async () => {
      mock.method(pool, 'query', async (sql, params) => {
        // Trả về rỗng ở bước check ownership
        return { rows: [] };
      });

      const res = await request(app)
        .put('/api/v1/projects/999')
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          title: 'Dự án Cập Nhật'
        });

      assert.strictEqual(res.status, 404);
      assert.strictEqual(res.body.success, false);
      assert.strictEqual(res.body.message, 'Không tìm thấy dự án hoặc bạn không có quyền truy cập dự án này');
    });
  });

  // ==========================================
  // 5. GET /api/v1/projects/:id/analytics - Thống kê dự án
  // ==========================================
  test.describe('GET /api/v1/projects/:id/analytics', () => {
    test('Lấy dữ liệu thống kê dự án thành công', async () => {
      const projectId = '12';
      let queryCallCount = 0;

      mock.method(pool, 'query', async (sql, params) => {
        queryCallCount++;
        if (queryCallCount === 1) {
          // Check ownership
          return { rows: [{ 1: 1 }] };
        } else if (queryCallCount === 2) {
          // Thống kê bài báo theo năm
          return {
            rows: [
              { year: 2023, article_count: 150 },
              { year: 2024, article_count: 185 }
            ]
          };
        } else {
          // So sánh chỉ số các tạp chí
          return {
            rows: [
              {
                journal_name: 'Journal A',
                metric_code: 'IF',
                metric_type: 'SCORE',
                value_txt: null,
                value_int: null,
                value_float: 5.4,
                year: 2024
              },
              {
                journal_name: 'Journal B',
                metric_code: 'Q',
                metric_type: 'QUARTILE',
                value_txt: 'Q1',
                value_int: null,
                value_float: null,
                year: 2024
              },
              {
                journal_name: 'Journal C',
                metric_code: 'HINDEX',
                metric_type: 'INTEGER',
                value_txt: null,
                value_int: 25,
                value_float: null,
                year: 2023
              }
            ]
          };
        }
      });

      const res = await request(app)
        .get(`/api/v1/projects/${projectId}/analytics`)
        .set('Authorization', `Bearer ${testToken}`);

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.message, 'Lấy dữ liệu thống kê dự án thành công');
      
      // Kiểm tra Chart 1
      assert.ok(Array.isArray(res.body.data.article_volume_trend));
      assert.strictEqual(res.body.data.article_volume_trend.length, 2);
      assert.strictEqual(res.body.data.article_volume_trend[0].year, 2023);
      assert.strictEqual(res.body.data.article_volume_trend[0].article_count, 150);

      // Kiểm tra Chart 2
      assert.ok(Array.isArray(res.body.data.journal_metrics_comparison));
      assert.strictEqual(res.body.data.journal_metrics_comparison.length, 3);
      
      // Journal A: SCORE -> value_float (5.4)
      assert.strictEqual(res.body.data.journal_metrics_comparison[0].journal_name, 'Journal A');
      assert.strictEqual(res.body.data.journal_metrics_comparison[0].metric_code, 'IF');
      assert.strictEqual(res.body.data.journal_metrics_comparison[0].value, 5.4);

      // Journal B: QUARTILE -> value_txt ('Q1')
      assert.strictEqual(res.body.data.journal_metrics_comparison[1].journal_name, 'Journal B');
      assert.strictEqual(res.body.data.journal_metrics_comparison[1].metric_code, 'Q');
      assert.strictEqual(res.body.data.journal_metrics_comparison[1].value, 'Q1');

      // Journal C: INTEGER -> value_int (25)
      assert.strictEqual(res.body.data.journal_metrics_comparison[2].journal_name, 'Journal C');
      assert.strictEqual(res.body.data.journal_metrics_comparison[2].metric_code, 'HINDEX');
      assert.strictEqual(res.body.data.journal_metrics_comparison[2].value, 25);
    });

    test('Lỗi 400 - ID dự án không hợp lệ khi lấy thống kê', async () => {
      const res = await request(app)
        .get('/api/v1/projects/not-a-number/analytics')
        .set('Authorization', `Bearer ${testToken}`);

      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.body.success, false);
      assert.strictEqual(res.body.message, 'ID dự án không hợp lệ');
    });

    test('Lỗi 401 - Chưa xác thực', async () => {
      const res = await request(app)
        .get('/api/v1/projects/12/analytics');

      assert.strictEqual(res.status, 401);
      assert.strictEqual(res.body.success, false);
      assert.strictEqual(res.body.message, 'Không tìm thấy token xác thực hoặc token không hợp lệ');
    });

    test('Lỗi 404 - Dự án không tồn tại hoặc không thuộc sở hữu', async () => {
      mock.method(pool, 'query', async (sql, params) => {
        return { rows: [] };
      });

      const res = await request(app)
        .get('/api/v1/projects/999/analytics')
        .set('Authorization', `Bearer ${testToken}`);

      assert.strictEqual(res.status, 404);
      assert.strictEqual(res.body.success, false);
      assert.strictEqual(res.body.message, 'Không tìm thấy dự án hoặc bạn không có quyền truy cập dự án này');
    });
  });
});

