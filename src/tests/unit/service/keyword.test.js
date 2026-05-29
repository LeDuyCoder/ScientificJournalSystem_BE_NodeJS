import { test, describe, beforeEach, afterEach } from "node:test";
import assert from "node:assert";

import { getTrendingKeywords } from "../../../services/keyword.service.js";
import pool from "../../../config/database.js";
import logger from "../../../utils/logger.js";

describe("Keyword Service - getTrendingKeywords() Unit Test Suite", () => {
  let originalQuery;
  let originalLoggerError;
  let mockQueryCalls = [];
  let queryResolveValue;

  beforeEach(() => {
    originalQuery = pool.query;
    originalLoggerError = logger.error;

    mockQueryCalls = [];
    queryResolveValue = null;

    pool.query = async (text, values) => {
      mockQueryCalls.push({ text, values });
      return queryResolveValue || { rows: [] };
    };

    logger.error = () => {};
  });

  afterEach(() => {
    pool.query = originalQuery;
    logger.error = originalLoggerError;
  });

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
