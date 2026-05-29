import test from 'node:test';
import assert from 'node:assert';
import { mock } from 'node:test';
import keywordService from '../../../services/keyword.service.js';
import pool from '../../../config/database.js';

test.after(async () => {
  await pool.end();
});

test.describe('Keyword Service - Watched Keywords Unit Test Suite', () => {

  test.afterEach(() => {
    mock.reset();
  });

  // ==========================================
  // 1. validateKeywordIds
  // ==========================================
  test.describe('validateKeywordIds()', () => {

    test('Trả về true nếu mảng rỗng hoặc undefined', async () => {
      assert.strictEqual(await keywordService.validateKeywordIds([]), true);
      assert.strictEqual(await keywordService.validateKeywordIds(undefined), true);
    });

    test('Trả về true nếu tất cả keyword_ids tồn tại', async () => {
      mock.method(pool, 'query', async () => ({ rows: [{ keyword_id: 1 }, { keyword_id: 5 }] }));
      const isValid = await keywordService.validateKeywordIds([1, 5]);
      assert.strictEqual(isValid, true);
    });

    test('Trả về false nếu có keyword_id không tồn tại', async () => {
      mock.method(pool, 'query', async () => ({ rows: [{ keyword_id: 1 }] })); // Thiếu 5
      const isValid = await keywordService.validateKeywordIds([1, 5]);
      assert.strictEqual(isValid, false);
    });

    test('Dedupe keyword_ids trước khi query', async () => {
      let capturedParams = null;
      mock.method(pool, 'query', async (sql, params) => {
        capturedParams = params;
        return { rows: [{ keyword_id: 2 }] };
      });

      await keywordService.validateKeywordIds([2, 2, 2]);
      assert.deepStrictEqual(capturedParams[0], [2]);
    });
  });

  // ==========================================
  // 2. syncWatchedKeywords
  // ==========================================
  test.describe('syncWatchedKeywords()', () => {
    test('Trả về true ngay lập tức nếu keywordIds rỗng', async () => {
      const mockClient = { query: mock.fn(), release: mock.fn() };
      mock.method(pool, 'connect', async () => mockClient);
      const result = await keywordService.syncWatchedKeywords(123, []);
      assert.strictEqual(result, true);
      assert.strictEqual(mockClient.query.mock.calls.length, 0); // Không gọi DB
    });

    test('Chỉ chèn các keyword mới và hợp lệ', async () => {
      const mockClient = {
        query: mock.fn(async (sql) => {
          if (sql === 'BEGIN' || sql === 'COMMIT' || sql.includes('INSERT')) return { rows: [] };
          if (sql.includes('SELECT keyword_id FROM "Project_Keyword"')) return { rows: [{ keyword_id: '1' }] }; // Đã tồn tại 1
          if (sql.includes('SELECT keyword_id FROM "Keyword"')) return { rows: [{ keyword_id: '5' }] }; // Chỉ có 5 là hợp lệ, 999 không hợp lệ
          return { rows: [] };
        }),
        release: mock.fn()
      };
      mock.method(pool, 'connect', async () => mockClient);

      // Input: 1 (đã có), 5 (mới, hợp lệ), 999 (mới, không hợp lệ), 5 (trùng input)
      const result = await keywordService.syncWatchedKeywords(123, [1, 5, 999, 5]);

      assert.strictEqual(result, true);
      // Calls: BEGIN, SELECT (existing), SELECT (valid), INSERT (5), COMMIT => 5 calls
      assert.strictEqual(mockClient.query.mock.calls.length, 5);
      assert.strictEqual(mockClient.query.mock.calls[0].arguments[0], 'BEGIN');
      assert.ok(mockClient.query.mock.calls[1].arguments[0].includes('Project_Keyword'));
      assert.ok(mockClient.query.mock.calls[2].arguments[0].includes('Keyword'));
      assert.ok(mockClient.query.mock.calls[3].arguments[0].includes('INSERT'));
      assert.deepStrictEqual(mockClient.query.mock.calls[3].arguments[1], [123, 5]);
      assert.strictEqual(mockClient.query.mock.calls[4].arguments[0], 'COMMIT');
    });

    test('Không làm gì và COMMIT nếu tất cả keywords đã tồn tại', async () => {
      const mockClient = {
        query: mock.fn(async (sql) => {
          if (sql === 'BEGIN' || sql === 'COMMIT') return { rows: [] };
          if (sql.includes('Project_Keyword')) return { rows: [{ keyword_id: '1' }, { keyword_id: '5' }] };
          return { rows: [] };
        }),
        release: mock.fn()
      };
      mock.method(pool, 'connect', async () => mockClient);

      await keywordService.syncWatchedKeywords(123, [1, 5]);

      // Calls: BEGIN, SELECT (existing), COMMIT => 3 calls
      assert.strictEqual(mockClient.query.mock.calls.length, 3);
      assert.strictEqual(mockClient.query.mock.calls[2].arguments[0], 'COMMIT');
    });

    test('Rollback và ném lỗi nếu có lỗi DB', async () => {
      const mockClient = {
        query: mock.fn(async (sql) => {
          if (sql === 'BEGIN') return;
          throw new Error('DB Error');
        }),
        release: mock.fn()
      };
      mock.method(pool, 'connect', async () => mockClient);

      await assert.rejects(
        async () => await keywordService.syncWatchedKeywords(123, [1]),
        { message: 'DB Error' }
      );

      // Phải có lệnh ROLLBACK
      assert.ok(mockClient.query.mock.calls.some(call => call.arguments[0] === 'ROLLBACK'));
    });
  });

});
