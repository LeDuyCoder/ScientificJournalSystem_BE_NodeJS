import test, { mock } from 'node:test';
import assert from 'node:assert';
import * as keywordService from '../../../services/keyword.service.js';
import pool from '../../../config/database.js';

test.after(async () => {
  await pool.end();
});

test.describe('Keyword Service Unit Test Suite', () => {
  let originalQuery;
  let mockQueryCalls;
  let queryResolveValue;
  let callCount;

  test.beforeEach(() => {
    originalQuery = pool.query;
    mockQueryCalls = [];
    queryResolveValue = null;
    callCount = 0;

    pool.query = async (text, values) => {
      mockQueryCalls.push({ text, values });
      callCount += 1;

      if (queryResolveValue !== null) {
        return Array.isArray(queryResolveValue)
          ? queryResolveValue[callCount - 1]
          : queryResolveValue;
      }

      return { rows: [] };
    };
  });

  test.afterEach(() => {
    pool.query = originalQuery;
    mock.restoreAll();
  });

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
      mock.method(pool, 'query', async () => ({ rows: [{ keyword_id: 1 }] }));
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

  test.describe('syncWatchedKeywords()', () => {
    test('Thêm keyword mới thành công', async () => {
      const mockClient = {
        query: mock.fn(async (sql) => {
          if (sql === 'BEGIN' || sql === 'COMMIT') return { rows: [] };
          if (sql.includes('FROM "Project_Keyword"')) return { rows: [] };
          if (sql.includes('FROM "Keyword"')) return { rows: [{ keyword_id: 1 }, { keyword_id: 5 }] };
          return { rows: [] };
        }),
        release: mock.fn(),
      };
      mock.method(pool, 'connect', async () => mockClient);

      const result = await keywordService.syncWatchedKeywords(123, [1, 5]);

      assert.strictEqual(result, true);
      assert.strictEqual(mockClient.query.mock.calls.length, 6);
      assert.strictEqual(mockClient.query.mock.calls[0].arguments[0], 'BEGIN');
      assert.ok(mockClient.query.mock.calls[1].arguments[0].includes('SELECT keyword_id FROM "Project_Keyword"'));
      assert.ok(mockClient.query.mock.calls[2].arguments[0].includes('SELECT keyword_id FROM "Keyword"'));
      assert.ok(mockClient.query.mock.calls[3].arguments[0].includes('INSERT INTO "Project_Keyword"'));
      assert.deepStrictEqual(mockClient.query.mock.calls[3].arguments[1], [123, 1]);
      assert.ok(mockClient.query.mock.calls[4].arguments[0].includes('INSERT INTO "Project_Keyword"'));
      assert.deepStrictEqual(mockClient.query.mock.calls[4].arguments[1], [123, 5]);
      assert.strictEqual(mockClient.query.mock.calls[5].arguments[0], 'COMMIT');
    });

    test('Dedupe keyword_ids khi thêm mới', async () => {
      const mockClient = {
        query: mock.fn(async (sql) => {
          if (sql === 'BEGIN' || sql === 'COMMIT') return { rows: [] };
          if (sql.includes('FROM "Project_Keyword"')) return { rows: [] };
          if (sql.includes('FROM "Keyword"')) return { rows: [{ keyword_id: 5 }] };
          return { rows: [] };
        }),
        release: mock.fn(),
      };
      mock.method(pool, 'connect', async () => mockClient);

      await keywordService.syncWatchedKeywords(123, [5, 5, 5]);

      assert.strictEqual(mockClient.query.mock.calls.length, 5);
      assert.deepStrictEqual(mockClient.query.mock.calls[2].arguments[1], [[5]]);
      assert.ok(mockClient.query.mock.calls[3].arguments[0].includes('INSERT INTO "Project_Keyword"'));
      assert.deepStrictEqual(mockClient.query.mock.calls[3].arguments[1], [123, 5]);
    });

    test('Không thêm gì khi tất cả keyword đã tồn tại', async () => {
      let callIndex = 0;
      const mockClient = {
        query: mock.fn(async (sql) => {
          callIndex += 1;
          if (sql === 'BEGIN' || sql === 'COMMIT' || sql === 'ROLLBACK') return { rows: [] };
          if (callIndex === 2) return { rows: [{ keyword_id: 5 }] };
          if (callIndex === 3) return { rows: [{ keyword_id: 5 }] };
          return { rows: [] };
        }),
        release: mock.fn(),
      };
      mock.method(pool, 'connect', async () => mockClient);

      await keywordService.syncWatchedKeywords(123, [5]);

      assert.strictEqual(mockClient.query.mock.calls.length, 3);
      assert.strictEqual(mockClient.query.mock.calls[2].arguments[0], 'COMMIT');
    });

    test('Trả về true ngay lập tức nếu không truyền keyword_ids', async () => {
      const spy = mock.fn();
      mock.method(pool, 'connect', async () => ({ query: spy, release: mock.fn() }));

      const result = await keywordService.syncWatchedKeywords(123, []);

      assert.strictEqual(result, true);
      assert.strictEqual(spy.mock.calls.length, 0);
    });

    test('Rollback và ném lỗi nếu có lỗi DB', async () => {
      const mockClient = {
        query: mock.fn(async (sql) => {
          if (sql === 'BEGIN' || sql === 'ROLLBACK') return { rows: [] };
          throw new Error('DB Error');
        }),
        release: mock.fn(),
      };
      mock.method(pool, 'connect', async () => mockClient);

      await assert.rejects(async () => await keywordService.syncWatchedKeywords(123, [1]), {
        message: 'DB Error',
      });

      assert.ok(mockClient.query.mock.calls.some((call) => call.arguments[0] === 'ROLLBACK'));
      assert.strictEqual(mockClient.release.mock.calls.length, 1);
    });
  });

  test.describe('addKeywordsToArticle()', () => {
    test('Trả về [] nếu input rỗng', async () => {
      const result = await keywordService.addKeywordsToArticle(1, []);
      assert.deepStrictEqual(result, []);
    });

    test('Thêm keyword mới và quan hệ article với keyword', async () => {
      const mockClient = {
        query: mock.fn(async (sql, params) => {
          if (sql === 'BEGIN' || sql === 'COMMIT') {
            return { rows: [] };
          }
          if (sql.includes('INSERT INTO "Keyword"')) {
            return { rows: [{ keyword_id: 1, display_name: 'AI' }] };
          }
          if (sql.includes('INSERT INTO "Keyword_Article"')) {
            return { rows: [] };
          }
          return { rows: [] };
        }),
        release: mock.fn(),
      };
      mock.method(pool, 'connect', async () => mockClient);

      const result = await keywordService.addKeywordsToArticle(42, [' AI ', 'AI', 'Machine Learning', '']);

      assert.deepStrictEqual(result, [{ keyword_id: 1, display_name: 'AI' }]);
      assert.strictEqual(mockClient.query.mock.calls[0].arguments[0], 'BEGIN');
      assert.ok(mockClient.query.mock.calls[1].arguments[0].includes('INSERT INTO "Keyword"'));
      assert.deepStrictEqual(mockClient.query.mock.calls[1].arguments[1], [['AI', 'Machine Learning']]);
      assert.ok(mockClient.query.mock.calls[2].arguments[0].includes('INSERT INTO "Keyword_Article"'));
      assert.deepStrictEqual(mockClient.query.mock.calls[2].arguments[1], [42, [1]]);
      assert.strictEqual(mockClient.query.mock.calls[3].arguments[0], 'COMMIT');
    });

    test('Commit và trả [] nếu upsert không trả rows', async () => {
      const mockClient = {
        query: mock.fn(async (sql) => {
          if (sql === 'BEGIN' || sql === 'COMMIT') {
            return { rows: [] };
          }
          return { rows: [] };
        }),
        release: mock.fn(),
      };
      mock.method(pool, 'connect', async () => mockClient);

      const result = await keywordService.addKeywordsToArticle(99, ['Empty']);
      assert.deepStrictEqual(result, []);
      assert.ok(mockClient.query.mock.calls.some((call) => call.arguments[0] === 'COMMIT'));
    });

    test('Rollback nếu có lỗi và ném ngoại lệ', async () => {
      const mockClient = {
        query: mock.fn(async (sql) => {
          if (sql === 'BEGIN' || sql === 'ROLLBACK') return { rows: [] };
          throw new Error('Insert failed');
        }),
        release: mock.fn(),
      };
      mock.method(pool, 'connect', async () => mockClient);

      await assert.rejects(async () => await keywordService.addKeywordsToArticle(1, ['Test']), {
        message: 'Insert failed',
      });

      assert.ok(mockClient.query.mock.calls.some((call) => call.arguments[0] === 'ROLLBACK'));
      assert.strictEqual(mockClient.release.mock.calls.length, 1);
    });
  });

  test.describe('getTrendingKeywords()', () => {
    test('Trả về danh sách keyword mặc định khi sort_by=count và limit=20', async () => {
      const mockRows = [
        {
          keyword_id: 1,
          keyword: 'Machine Learning',
          count: '45',
          avg_score: '0.85',
          total_score: '38.25',
        },
      ];
      queryResolveValue = { rows: mockRows };

      const result = await keywordService.getTrendingKeywords(1, {});

      assert.strictEqual(mockQueryCalls.length, 1);
      assert.match(mockQueryCalls[0].text, /ORDER BY count DESC/);
      assert.strictEqual(result.sort_by, 'count');
      assert.strictEqual(result.total, 1);
      assert.strictEqual(result.keywords[0].id, 1);
    });

    test('Sắp xếp theo score khi sort_by=score', async () => {
      queryResolveValue = { rows: [] };

      await keywordService.getTrendingKeywords(1, { sort_by: 'score' });
      assert.match(mockQueryCalls[0].text, /ORDER BY avg_score DESC/);
    });

    test('Giới hạn tối đa 100 dù truyền limit lớn hơn', async () => {
      queryResolveValue = { rows: [] };

      await keywordService.getTrendingKeywords(1, { limit: '999' });
      assert.deepStrictEqual(mockQueryCalls[0].values, [1, 100]);
    });

    test('Fallback về count khi sort_by không hợp lệ', async () => {
      queryResolveValue = { rows: [] };

      await keywordService.getTrendingKeywords(1, { sort_by: 'invalid' });
      assert.match(mockQueryCalls[0].text, /ORDER BY count DESC/);
    });

    test('Trả về mảng rỗng khi không có data', async () => {
      queryResolveValue = { rows: [] };

      const result = await keywordService.getTrendingKeywords(999999, {});
      assert.strictEqual(result.total, 0);
      assert.deepStrictEqual(result.keywords, []);
    });
  });

  test.describe('getWatchedKeywordArticles()', () => {
    const MOCK_USER_ID = '0028ddd0-d305-4aa1-8baa-2b1a2893c883';

    test('Trả về danh sách bài báo với page=1 và limit=10', async () => {
      const mockArticles = [
        {
          article_id: 1,
          title: 'Deep Learning in Medicine',
          publication_year: 2024,
          doi: '10.1234/abc',
          matched_keywords: ['Medicine', 'Deep Learning'],
        },
      ];
      queryResolveValue = [{ rows: [{ project_id: 1 }] }, { rows: [{ total: '1' }] }, { rows: mockArticles }];

      const result = await keywordService.getWatchedKeywordArticles(1, MOCK_USER_ID, {});

      assert.strictEqual(mockQueryCalls.length, 3);
      assert.strictEqual(result.page, 1);
      assert.strictEqual(result.limit, 10);
      assert.strictEqual(result.total, 1);
      assert.strictEqual(result.total_pages, 1);
      assert.deepStrictEqual(result.data[0].matched_keywords, ['Medicine', 'Deep Learning']);
    });

    test('Trả về mảng rỗng khi không có bài báo', async () => {
      queryResolveValue = [{ rows: [{ project_id: 1 }] }, { rows: [{ total: '0' }] }, { rows: [] }];

      const result = await keywordService.getWatchedKeywordArticles(999999, MOCK_USER_ID, {});
      assert.strictEqual(result.total, 0);
      assert.strictEqual(result.total_pages, 0);
      assert.deepStrictEqual(result.data, []);
    });

    test('Pagination đúng với page=2, limit=5', async () => {
      queryResolveValue = [{ rows: [{ project_id: 1 }] }, { rows: [{ total: '12' }] }, { rows: [] }];

      const result = await keywordService.getWatchedKeywordArticles(1, MOCK_USER_ID, { page: '2', limit: '5' });
      assert.strictEqual(result.page, 2);
      assert.strictEqual(result.limit, 5);
      assert.strictEqual(result.total_pages, 3);
      assert.deepStrictEqual(mockQueryCalls[2].values, [1, MOCK_USER_ID, 5, 5]);
    });

    test('Giới hạn tối đa limit=50 dù truyền lớn hơn', async () => {
      queryResolveValue = [{ rows: [{ project_id: 1 }] }, { rows: [{ total: '0' }] }, { rows: [] }];

      const result = await keywordService.getWatchedKeywordArticles(1, MOCK_USER_ID, { limit: '999' });
      assert.strictEqual(result.limit, 50);
      assert.deepStrictEqual(mockQueryCalls[2].values, [1, MOCK_USER_ID, 50, 0]);
    });

    test('page tối thiểu là 1 dù truyền số âm', async () => {
      queryResolveValue = [{ rows: [{ project_id: 1 }] }, { rows: [{ total: '0' }] }, { rows: [] }];

      const result = await keywordService.getWatchedKeywordArticles(1, MOCK_USER_ID, { page: '-5' });
      assert.strictEqual(result.page, 1);
    });

    test('matched_keywords trả về mảng rỗng nếu null', async () => {
      queryResolveValue = [{ rows: [{ project_id: 1 }] }, { rows: [{ total: '1' }] }, { rows: [
        {
          article_id: 1,
          title: 'Test',
          publication_year: 2024,
          doi: null,
          matched_keywords: null,
        },
      ] }];

      const result = await keywordService.getWatchedKeywordArticles(1, MOCK_USER_ID, {});
      assert.deepStrictEqual(result.data[0].matched_keywords, []);
    });
  });
});
