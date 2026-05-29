import { test, describe, mock, afterEach } from "node:test";
import assert from "node:assert";

import {
  getTrendingKeywords,
  getWatchedKeywordArticles,
  keywordServiceRef,
} from "../../../controllers/keyword.controller.js";

describe("Keyword Controller Unit Test Suite", () => {
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

  // ==========================================
  // getTrendingKeywords
  // ==========================================
  describe("getTrendingKeywords()", () => {
    test("Thất bại: Trả về 400 nếu projectId không hợp lệ", async () => {
      const req = { params: { id: "abc" }, query: {} };
      const res = createMockResponse();

      await getTrendingKeywords(req, res);

      assert.strictEqual(res.statusCode, 400);
      assert.strictEqual(res.body.success, false);
      assert.strictEqual(res.body.message, "ID dự án không hợp lệ");
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
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.data.total, 2);
      assert.strictEqual(res.body.data.sort_by, "count");
      assert.ok(Array.isArray(res.body.data.keywords));
    });

    test("Thành công: sort_by=score", async () => {
      const mockResult = { total: 2, sort_by: "score", keywords: [] };
      mock.method(
        keywordServiceRef,
        "getTrendingKeywords",
        async () => mockResult,
      );

      const req = { params: { id: "1" }, query: { sort_by: "score" } };
      const res = createMockResponse();

      await getTrendingKeywords(req, res);

      assert.strictEqual(res.statusCode, 200);
      assert.strictEqual(res.body.data.sort_by, "score");
    });

    test("Thành công: Mảng rỗng khi không có data", async () => {
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
      assert.strictEqual(res.body.data.total, 0);
      assert.deepStrictEqual(res.body.data.keywords, []);
    });

    test("Thất bại: Trả về 500 khi service throw lỗi", async () => {
      mock.method(keywordServiceRef, "getTrendingKeywords", async () => {
        throw new Error("DB Error");
      });

      const req = { params: { id: "1" }, query: {} };
      const res = createMockResponse();

      await getTrendingKeywords(req, res);

      assert.strictEqual(res.statusCode, 500);
      assert.strictEqual(res.body.success, false);
    });
  });

  // ==========================================
  // getWatchedKeywordArticles
  // ==========================================
  describe("getWatchedKeywordArticles()", () => {
    const MOCK_USER_ID = "0028ddd0-d305-4aa1-8baa-2b1a2893c883";

    test("Thất bại: Trả về 400 nếu projectId không hợp lệ", async () => {
      const req = {
        params: { id: "abc" },
        query: {},
        user: { user_id: MOCK_USER_ID },
      };
      const res = createMockResponse();

      await getWatchedKeywordArticles(req, res);

      assert.strictEqual(res.statusCode, 400);
      assert.strictEqual(res.body.success, false);
      assert.strictEqual(res.body.message, "ID dự án không hợp lệ");
    });

    test("Thành công: Trả về 200 và danh sách bài báo với params mặc định", async () => {
      const mockResult = {
        page: 1,
        limit: 10,
        total: 2,
        total_pages: 1,
        data: [
          {
            article_id: 1,
            title: "Deep Learning in Medicine",
            publication_year: 2024,
            doi: "10.1234/abc",
            matched_keywords: ["Medicine"],
          },
          {
            article_id: 2,
            title: "Cancer Research",
            publication_year: 2023,
            doi: "10.5678/def",
            matched_keywords: ["Cancer"],
          },
        ],
      };

      mock.method(
        keywordServiceRef,
        "getWatchedKeywordArticles",
        async () => mockResult,
      );

      const req = {
        params: { id: "1" },
        query: {},
        user: { user_id: MOCK_USER_ID },
      };
      const res = createMockResponse();

      await getWatchedKeywordArticles(req, res);

      assert.strictEqual(res.statusCode, 200);
      assert.strictEqual(res.body.success, true);
      assert.ok(Array.isArray(res.body.data));
      assert.strictEqual(res.body.pagination.page, 1);
      assert.strictEqual(res.body.pagination.limit, 10);
    });

    test("Thành công: Mảng rỗng khi không có keyword nào được theo dõi", async () => {
      const mockResult = {
        page: 1,
        limit: 10,
        total: 0,
        total_pages: 0,
        data: [],
      };
      mock.method(
        keywordServiceRef,
        "getWatchedKeywordArticles",
        async () => mockResult,
      );

      const req = {
        params: { id: "999999" },
        query: {},
        user: { user_id: MOCK_USER_ID },
      };
      const res = createMockResponse();

      await getWatchedKeywordArticles(req, res);

      assert.strictEqual(res.statusCode, 200);
      assert.strictEqual(res.body.success, true);
      assert.deepStrictEqual(res.body.data, []);
    });

    test("Thành công: Pagination đúng khi truyền page=2&limit=5", async () => {
      const mockResult = {
        page: 2,
        limit: 5,
        total: 12,
        total_pages: 3,
        data: [],
      };
      mock.method(
        keywordServiceRef,
        "getWatchedKeywordArticles",
        async () => mockResult,
      );

      const req = {
        params: { id: "1" },
        query: { page: "2", limit: "5" },
        user: { user_id: MOCK_USER_ID },
      };
      const res = createMockResponse();

      await getWatchedKeywordArticles(req, res);

      assert.strictEqual(res.statusCode, 200);
      assert.strictEqual(res.body.pagination.page, 2);
      assert.strictEqual(res.body.pagination.limit, 5);
    });

    test("Thất bại: Trả về 500 khi service throw lỗi", async () => {
      mock.method(keywordServiceRef, "getWatchedKeywordArticles", async () => {
        throw new Error("DB Error");
      });

      const req = {
        params: { id: "1" },
        query: {},
        user: { user_id: MOCK_USER_ID },
      };
      const res = createMockResponse();

      await getWatchedKeywordArticles(req, res);

      assert.strictEqual(res.statusCode, 500);
      assert.strictEqual(res.body.success, false);
    });
  });
});
