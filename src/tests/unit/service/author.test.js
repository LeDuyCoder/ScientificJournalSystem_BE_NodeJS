import { test, describe, mock, afterEach } from 'node:test';
import assert from 'node:assert';

import pool from '../../../config/database.js';
import { getAuthorById, getAuthorAreasBreakdownService } from '../../../services/author.service.js';

describe('Author Service Unit Test Suite', () => {
  afterEach(() => {
    mock.restoreAll();
  });

  test('getAuthorById() trả về thông tin tác giả khi tồn tại', async () => {
    const mockAuthor = {
      author_id: '321',
      display_name: 'Jason R. Westin'
    };

    const mockQuery = mock.method(pool, 'query', async () => ({ rows: [mockAuthor] }));

    const result = await getAuthorById(321);

    assert.deepStrictEqual(result, mockAuthor);
    assert.strictEqual(mockQuery.mock.calls.length, 1);
    assert.deepStrictEqual(mockQuery.mock.calls[0].arguments, ['SELECT * FROM "Author" WHERE "author_id" = $1', [321]]);
  });

  test('getAuthorById() trả về undefined khi không tìm thấy tác giả', async () => {
    mock.method(pool, 'query', async () => ({ rows: [] }));

    const result = await getAuthorById(999);

    assert.strictEqual(result, undefined);
  });

  test('getAuthorAreasBreakdownService() trả về danh sách breakdown', async () => {
    const mockRows = [
      {
        subject_category_id: 2,
        category_name: 'Oncology',
        article_count: 1,
        percentage: 100
      }
    ];

    const mockQuery = mock.method(pool, 'query', async () => ({ rows: mockRows }));

    const result = await getAuthorAreasBreakdownService(321);

    assert.deepStrictEqual(result, mockRows);
    assert.strictEqual(mockQuery.mock.calls.length, 1);
    const [sql, values] = mockQuery.mock.calls[0].arguments;
    assert.strictEqual(typeof sql, 'string');
    assert.deepStrictEqual(values, [321]);
    assert.match(sql, /FROM "Author_Article"/);
  });

  test('getAuthorAreasBreakdownService() ném lỗi khi query thất bại', async () => {
    mock.method(pool, 'query', async () => {
      throw new Error('DB failed');
    });

    await assert.rejects(async () => {
      await getAuthorAreasBreakdownService(321);
    }, {
      message: 'DB failed'
    });
  });
});
