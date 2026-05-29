import { test, describe, beforeEach, afterEach } from "node:test";
import assert from "node:assert";

import {
  getTrendingKeywords,
  getWatchedKeywordArticles,
} from "../../../services/keyword.service.js";
import pool from "../../../config/database.js";
import logger from "../../../utils/logger.js";

describe("Keyword Service Unit Test Suite", () => {
  let originalQuery;
  let originalLoggerError;
  let mockQueryCalls = [];
  let queryResolveValue;

  beforeEach(() => {
    originalQuery = pool.query;
    originalLoggerError = logger.error;
    mockQueryCalls = [];
    queryResolveValue = null;

    let callCount = 0;
    pool.query = async (text, values) => {
      mockQueryCalls.push({ text, values });
      callCount++;
      if (queryResolveValue) {
        return Array.isArray(queryResolveValue)
          ? queryResolveValue[callCount - 1]
          : queryResolveValue;
      }
      return { rows: [] };
    };

    logger.error = () => {};
  });

  afterEach(() => {
    pool.query = originalQuery;
    logger.error = originalLoggerError;
  });

  // ==========================================
  // getTrendingKeywords
  // ==========================================
  describe("getTrendingKeywords()", () => {
    test("Thành công: Trả về danh sách keywords với params mặc định (sort_by=count, limit=20)", async () => {
      const mockRows = [
        {
          keyword_id: 1,
          keyword: "Machine Learning",
          count: "45",
          avg_score: "0.85",
          total_score: "38.25",
        },
        {
          keyword_id: 2,
          keyword: "Deep Learning",
          count: "38",
          avg_score: "0.79",
          total_score: "30.02",
        },
      ];
      queryResolveValue = { rows: mockRows };

      const result = await getTrendingKeywords(1, {});

      assert.strictEqual(mockQueryCalls.length, 1);
      assert.match(mockQueryCalls[0].text, /ORDER BY count DESC/);
      assert.strictEqual(result.sort_by, "count");
      assert.strictEqual(result.total, 2);
      assert.ok(Array.isArray(result.keywords));
    });

    test("Thành công: Sắp xếp theo score khi sort_by=score", async () => {
      queryResolveValue = { rows: [] };

      await getTrendingKeywords(1, { sort_by: "score" });

      assert.strictEqual(mockQueryCalls.length, 1);
      assert.match(mockQueryCalls[0].text, /ORDER BY avg_score DESC/);
    });

    test("Thành công: Giới hạn số lượng theo limit", async () => {
      queryResolveValue = { rows: [] };

      await getTrendingKeywords(1, { limit: "5" });

      assert.strictEqual(mockQueryCalls.length, 1);
      assert.deepStrictEqual(mockQueryCalls[0].values, [1, 5]);
    });

    test("Thành công: Giới hạn tối đa 100 dù truyền limit lớn hơn", async () => {
      queryResolveValue = { rows: [] };

      await getTrendingKeywords(1, { limit: "999" });

      assert.strictEqual(mockQueryCalls.length, 1);
      assert.deepStrictEqual(mockQueryCalls[0].values, [1, 100]);
    });

    test("Thành công: Fallback về count khi sort_by không hợp lệ", async () => {
      queryResolveValue = { rows: [] };

      await getTrendingKeywords(1, { sort_by: "invalid" });

      assert.strictEqual(mockQueryCalls.length, 1);
      assert.match(mockQueryCalls[0].text, /ORDER BY count DESC/);
    });

    test("Thành công: Trả về mảng rỗng khi không có data", async () => {
      queryResolveValue = { rows: [] };

      const result = await getTrendingKeywords(999999, {});

      assert.strictEqual(result.total, 0);
      assert.deepStrictEqual(result.keywords, []);
    });
  });

  // ==========================================
  // getWatchedKeywordArticles
  // ==========================================
  describe("getWatchedKeywordArticles()", () => {
    const MOCK_USER_ID = "0028ddd0-d305-4aa1-8baa-2b1a2893c883";

    test("Thành công: Trả về danh sách bài báo với params mặc định (page=1, limit=10)", async () => {
      const mockArticles = [
        {
          article_id: 1,
          title: "Deep Learning in Medicine",
          publication_year: 2024,
          doi: "10.1234/abc",
          matched_keywords: ["Medicine", "Deep Learning"],
        },
      ];
      queryResolveValue = [{ rows: [{ total: "1" }] }, { rows: mockArticles }];

      const result = await getWatchedKeywordArticles(1, MOCK_USER_ID, {});

      assert.strictEqual(mockQueryCalls.length, 2);
      assert.strictEqual(result.page, 1);
      assert.strictEqual(result.limit, 10);
      assert.strictEqual(result.total, 1);
      assert.strictEqual(result.total_pages, 1);
      assert.ok(Array.isArray(result.data));
    });

    test("Thành công: Trả về mảng rỗng khi không có bài báo nào", async () => {
      queryResolveValue = [{ rows: [{ total: "0" }] }, { rows: [] }];

      const result = await getWatchedKeywordArticles(999999, MOCK_USER_ID, {});

      assert.strictEqual(result.total, 0);
      assert.strictEqual(result.total_pages, 0);
      assert.deepStrictEqual(result.data, []);
    });

    test("Thành công: Pagination đúng khi truyền page=2, limit=5", async () => {
      queryResolveValue = [{ rows: [{ total: "12" }] }, { rows: [] }];

      const result = await getWatchedKeywordArticles(1, MOCK_USER_ID, {
        page: "2",
        limit: "5",
      });

      assert.strictEqual(result.page, 2);
      assert.strictEqual(result.limit, 5);
      assert.strictEqual(result.total_pages, 3);
      assert.deepStrictEqual(mockQueryCalls[1].values, [1, MOCK_USER_ID, 5, 5]);
    });

    test("Thành công: Giới hạn tối đa limit=50 dù truyền lớn hơn", async () => {
      queryResolveValue = [{ rows: [{ total: "0" }] }, { rows: [] }];

      const result = await getWatchedKeywordArticles(1, MOCK_USER_ID, {
        limit: "999",
      });

      assert.strictEqual(result.limit, 50);
      assert.deepStrictEqual(mockQueryCalls[1].values, [
        1,
        MOCK_USER_ID,
        50,
        0,
      ]);
    });

    test("Thành công: page tối thiểu là 1 dù truyền số âm", async () => {
      queryResolveValue = [{ rows: [{ total: "0" }] }, { rows: [] }];

      const result = await getWatchedKeywordArticles(1, MOCK_USER_ID, {
        page: "-5",
      });

      assert.strictEqual(result.page, 1);
    });

    test("Thành công: matched_keywords trả về mảng rỗng nếu null", async () => {
      queryResolveValue = [
        { rows: [{ total: "1" }] },
        {
          rows: [
            {
              article_id: 1,
              title: "Test",
              publication_year: 2024,
              doi: null,
              matched_keywords: null,
            },
          ],
        },
      ];

      const result = await getWatchedKeywordArticles(1, MOCK_USER_ID, {});

      assert.deepStrictEqual(result.data[0].matched_keywords, []);
    });
  });
});
