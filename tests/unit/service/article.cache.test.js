import test from 'node:test';
import assert from 'node:assert';
import { mock } from 'node:test';

import pool from '../../../src/config/database.js';
import cacheService from '../../../src/services/cache.service.js';
import { 
    getAllArticles, 
    countAllArticles, 
    getArticleListStats,
    getArticleById,
    createArticle,
    updateArticle,
    deleteArticle,
    restoreArticle
} from '../../../src/services/article.service.js';

test.describe('Article Service Cache & Logic Unit Tests', () => {
    test.after(() => {
        process.exit(0);
    });

    test.afterEach(() => {
        mock.reset();
    });

    test.describe('getAllArticles (Cache Logic)', () => {
        test('Trả về dữ liệu từ Cache nếu có (Cache Hit)', async () => {
            const mockCachedData = [{ article_id: 1, title: 'Cached Article' }];
            
            mock.method(cacheService, 'get', async () => mockCachedData);
            mock.method(pool, 'query', async () => assert.fail('Should not query DB on cache hit'));

            const result = await getAllArticles({ limit: 10 });
            assert.deepStrictEqual(result, mockCachedData);
        });

        test('Query DB và lưu Cache nếu không có dữ liệu (Cache Miss)', async () => {
            const mockDbData = [{ article_id: 1, title: 'DB Article' }];
            
            mock.method(cacheService, 'get', async () => null);
            let setCalled = false;
            mock.method(cacheService, 'set', async (key, val) => {
                setCalled = true;
                assert.deepStrictEqual(val, mockDbData);
            });
            mock.method(pool, 'query', async () => ({ rows: mockDbData }));

            const result = await getAllArticles({ limit: 10 });
            assert.deepStrictEqual(result, mockDbData);
            assert.strictEqual(setCalled, true);
        });
    });

    test.describe('countAllArticles (Cache Logic)', () => {
        test('Trả về dữ liệu từ Cache nếu có (Cache Hit)', async () => {
            mock.method(cacheService, 'get', async () => 42);
            mock.method(pool, 'query', async () => assert.fail('Should not query DB'));

            const result = await countAllArticles();
            assert.strictEqual(result, 42);
        });

        test('Query DB và lưu Cache nếu Cache Miss', async () => {
            mock.method(cacheService, 'get', async () => null);
            let setCalled = false;
            mock.method(cacheService, 'set', async (key, val) => {
                setCalled = true;
                assert.strictEqual(val, 100);
            });
            mock.method(pool, 'query', async () => ({ rows: [{ total: '100' }] }));

            const result = await countAllArticles();
            assert.strictEqual(result, 100);
            assert.strictEqual(setCalled, true);
        });
    });

    test.describe('getArticleListStats (Cache Logic)', () => {
        test('Trả về Cache Hit', async () => {
            const cachedStats = { totalArticles: 10, openAccessCount: 5, authorsCount: 20, topicsCount: 5 };
            mock.method(cacheService, 'get', async () => cachedStats);
            mock.method(pool, 'query', async () => assert.fail('Should not query DB'));

            const result = await getArticleListStats();
            assert.deepStrictEqual(result, cachedStats);
        });

        test('Cache Miss - Query DB & Set Cache', async () => {
            mock.method(cacheService, 'get', async () => null);
            const dbStats = { totalArticles: 100, openAccessCount: 50, authorsCount: 200, topicsCount: 50 };
            
            let setCalled = false;
            mock.method(cacheService, 'set', async (key, val) => {
                setCalled = true;
                assert.deepStrictEqual(val, dbStats);
            });
            mock.method(pool, 'query', async () => ({ rows: [dbStats] }));

            const result = await getArticleListStats();
            assert.deepStrictEqual(result, dbStats);
            assert.strictEqual(setCalled, true);
        });
    });

    test.describe('Write Operations (Cache Invalidation)', () => {
        test('createArticle xóa cache by pattern', async () => {
            const mockNewArticle = { article_id: 1, title: 'New Article' };
            mock.method(pool, 'query', async () => ({ rows: [mockNewArticle] }));
            
            let delPatternCount = 0;
            let delCount = 0;
            mock.method(cacheService, 'delByPattern', async () => { delPatternCount++; });
            mock.method(cacheService, 'del', async () => { delCount++; });

            const result = await createArticle({ title: 'New Article', publication_year: 2026 });
            
            assert.deepStrictEqual(result, mockNewArticle);
            assert.strictEqual(delPatternCount, 2); // list:* and count:*
            assert.strictEqual(delCount, 1); // stats:all
        });

        test('deleteArticle xóa cache by pattern', async () => {
            const deletedArticle = { article_id: 1, is_deleted: true };
            mock.method(pool, 'query', async () => ({ rows: [deletedArticle] }));
            
            let delPatternCount = 0;
            let delCount = 0;
            mock.method(cacheService, 'delByPattern', async () => { delPatternCount++; });
            mock.method(cacheService, 'del', async () => { delCount++; });

            const result = await deleteArticle(1);
            
            assert.deepStrictEqual(result, deletedArticle);
            assert.strictEqual(delPatternCount, 2); // list:* and count:*
            assert.strictEqual(delCount, 2); // stats:all and detail:1
        });

        test('restoreArticle xóa cache by pattern', async () => {
            const restoredArticle = { article_id: 1, is_deleted: false };
            mock.method(pool, 'query', async () => ({ rows: [restoredArticle] }));
            
            let delPatternCount = 0;
            let delCount = 0;
            mock.method(cacheService, 'delByPattern', async () => { delPatternCount++; });
            mock.method(cacheService, 'del', async () => { delCount++; });

            const result = await restoreArticle(1);
            
            assert.deepStrictEqual(result, restoredArticle);
            assert.strictEqual(delPatternCount, 2); // list:* and count:*
            assert.strictEqual(delCount, 2); // stats:all and detail:1
        });
    });
});
