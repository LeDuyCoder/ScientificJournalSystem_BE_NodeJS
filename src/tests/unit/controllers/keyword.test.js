import { test, describe, mock, afterEach } from "node:test";
import assert from "node:assert";

import {
  getTrendingKeywords,
  keywordServiceRef,
} from "../../../controllers/keyword.controller.js";

describe("Keyword Controller - getTrendingKeywords() Unit Test Suite", () => {
  afterEach(() => {
    mock.restoreAll();
  });

  const createMockResponse = () => {
    const res = {};
    res.status = (statusCode) => {
      res.statusCode = statusCode;
      return res;
    };
    res.json = (jsonData) => {
      res.body = jsonData;
      return res;
    };
    return res;
  };

  test("Thất bại: Trả về 400 nếu projectId không hợp lệ (không phải số nguyên)", async () => {
    const req = { params: { id: "abc" }, query: {} };
    const res = createMockResponse();

    await getTrendingKeywords(req, res);

    assert.strictEqual(res.statusCode, 400);
    assert.strictEqual(res.body.error, "Invalid project ID");
  });

  test("Thành công: Trả về 200 và danh sách keywords với params mặc định", async () => {
    const mockResult = {
      total: 2,
      sort_by: "count",
      keywords: [
        {
          id: 1,
          keyword: "Machine Learning",
          count: 45,
          avg_score: 0.85,
          total_score: 38.25,
        },
        {
          id: 2,
          keyword: "Deep Learning",
          count: 38,
          avg_score: 0.79,
          total_score: 30.02,
        },
      ],
    };

    mock.method(
      keywordServiceRef,
      "getTrendingKeywords",
      async () => mockResult,
    );

    const req = { params: { id: "1" }, query: {} };
    const res = createMockResponse();

    await getTrendingKeywords(req, res);

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body.total, 2);
    assert.strictEqual(res.body.sort_by, "count");
    assert.ok(Array.isArray(res.body.keywords));
  });

  test("Thành công: Trả về 200 và danh sách keywords với sort_by=score", async () => {
    const mockResult = {
      total: 2,
      sort_by: "score",
      keywords: [
        {
          id: 3,
          keyword: "Neural Network",
          count: 20,
          avg_score: 0.95,
          total_score: 19.0,
        },
        {
          id: 1,
          keyword: "Machine Learning",
          count: 45,
          avg_score: 0.85,
          total_score: 38.25,
        },
      ],
    };

    mock.method(
      keywordServiceRef,
      "getTrendingKeywords",
      async () => mockResult,
    );

    const req = { params: { id: "1" }, query: { sort_by: "score" } };
    const res = createMockResponse();

    await getTrendingKeywords(req, res);

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body.sort_by, "score");
  });

  test("Thành công: Trả về 200 và mảng rỗng khi project không có data", async () => {
    const mockResult = { total: 0, keywords: [] };

    mock.method(
      keywordServiceRef,
      "getTrendingKeywords",
      async () => mockResult,
    );

    const req = { params: { id: "999999" }, query: {} };
    const res = createMockResponse();

    await getTrendingKeywords(req, res);

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body.total, 0);
    assert.deepStrictEqual(res.body.keywords, []);
  });

  test("Thất bại: Trả về 500 khi service throw lỗi", async () => {
    mock.method(keywordServiceRef, "getTrendingKeywords", async () => {
      throw new Error("DB Error");
    });

    const req = { params: { id: "1" }, query: {} };
    const res = createMockResponse();

    await getTrendingKeywords(req, res);

    assert.strictEqual(res.statusCode, 500);
    assert.strictEqual(res.body.error, "Internal server error");
  });
});
