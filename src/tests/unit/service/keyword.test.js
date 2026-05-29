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
    test('Xóa keyword cũ và thêm keyword mới thành công', async () => {
      const mockClient = {
        query: mock.fn(async () => ({ rows: [] })),
        release: mock.fn()
      };
      mock.method(pool, 'connect', async () => mockClient);

      const result = await keywordService.syncWatchedKeywords(123, [1, 5]);

      assert.strictEqual(result, true);
      assert.strictEqual(mockClient.query.mock.calls.length, 5); // BEGIN, DELETE, 2x INSERT, COMMIT
      assert.strictEqual(mockClient.query.mock.calls[0].arguments[0], 'BEGIN');
      assert.ok(mockClient.query.mock.calls[1].arguments[0].includes('DELETE FROM "Project_Keyword"'));
      assert.ok(mockClient.query.mock.calls[2].arguments[0].includes('INSERT INTO "Project_Keyword"'));
      assert.deepStrictEqual(mockClient.query.mock.calls[2].arguments[1], [123, 1]);
      assert.deepStrictEqual(mockClient.query.mock.calls[3].arguments[1], [123, 5]);
      assert.strictEqual(mockClient.query.mock.calls[4].arguments[0], 'COMMIT');
    });

    test('Dedupe keyword_ids khi thêm mới', async () => {
      const mockClient = {
        query: mock.fn(async () => ({ rows: [] })),
        release: mock.fn()
      };
      mock.method(pool, 'connect', async () => mockClient);

      await keywordService.syncWatchedKeywords(123, [5, 5, 5]);

      assert.strictEqual(mockClient.query.mock.calls.length, 4); // BEGIN, DELETE, 1x INSERT, COMMIT
      assert.deepStrictEqual(mockClient.query.mock.calls[2].arguments[1], [123, 5]);
    });

    test('Chỉ xóa keyword cũ nếu truyền mảng rỗng', async () => {
      const mockClient = {
        query: mock.fn(async () => ({ rows: [] })),
        release: mock.fn()
      };
      mock.method(pool, 'connect', async () => mockClient);

      await keywordService.syncWatchedKeywords(123, []);

      assert.strictEqual(mockClient.query.mock.calls.length, 3); // BEGIN, DELETE, COMMIT
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

      assert.strictEqual(mockClient.query.mock.calls[2].arguments[0], 'ROLLBACK');
    });
  });

});
