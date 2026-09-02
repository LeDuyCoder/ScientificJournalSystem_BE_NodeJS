import { test, describe, mock, afterEach } from "node:test";
import assert from "node:assert";
import pool from "../../../src/config/database.js";
import { logout } from "../../../src/modules/auth/auth.controller.js";

test.after(async () => {
  await pool.end();
});

describe("Login Controller Unit Test Suite", () => {
  afterEach(() => {
    mock.restoreAll();
  });

  const createMockResponse = () => {
    const res = {
      clearedCookies: []
    };
    res.code = (statusCode) => {
      res.statusCode = statusCode;
      return res;
    };
    res.send = (jsonData) => {
      res.body = jsonData;
      return res;
    };
    // Hỗ trợ cả chuẩn cũ để không làm gãy các test chưa sửa
    res.status = res.code;
    res.json = res.send;
    res.clearCookie = (cookieName, options) => {
      res.clearedCookies.push({ name: cookieName, options });
      return res;
    };
    return res;
  };

  describe("logout API", () => {
    test("Thành công đăng xuất và xóa cookie", async () => {
      const req = {};
      const res = createMockResponse();

      await logout(req, res);

      assert.strictEqual(res.statusCode, 200);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.code, "LOGOUT_SUCCESS");
      assert.strictEqual(res.body.message, "Đăng xuất thành công");
      assert.strictEqual(res.clearedCookies.length, 2);
      assert.strictEqual(res.clearedCookies[0].name, "access_token");
      assert.strictEqual(res.clearedCookies[1].name, "refresh_token");
    });
  });
});
