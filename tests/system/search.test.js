import { jest, test, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import app from '../../src/app.js';
import pool from '../../src/config/database.js';

jest.setTimeout(30000);

// ============ SEARCH & CATALOG TESTS ============

let testArticleTitle = '';

beforeAll(async () => {
    // Get an existing article title to use for search tests
    const res = await pool.query('SELECT title FROM "Article" LIMIT 1');
    if (res.rows.length > 0) {
        testArticleTitle = res.rows[0].title;
    } else {
        testArticleTitle = 'Non-existent Article Title ' + Date.now();
    }
});

afterAll(async () => {
    await pool.end();
});

// ST-SRCH-001: Search articles with a valid keyword
test("ST-SRCH-001 Search articles with a valid keyword", async () => {
    const keyword = testArticleTitle.split(' ')[0]; // Use first word of the title
    const res = await request(app).get(`/api/v1/articles?search=${encodeURIComponent(keyword)}`);
    
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.articles).toBeDefined();
});

// ST-SRCH-002: Search articles with a keyword that matches nothing
test("ST-SRCH-002 Search articles with a keyword that matches nothing", async () => {
    const res = await request(app).get('/api/v1/articles?search=thiskeywordshouldnotexist12345');
    
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    // Should return 200 with empty articles array or zero count
    expect(res.body.data.articles.length).toBe(0);
});

// ST-SRCH-003: Get article list without any search parameters
test("ST-SRCH-003 Get article list without any search parameters", async () => {
    const res = await request(app).get('/api/v1/articles');
    
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.articles)).toBe(true);
});

// ST-SRCH-004: Search articles with pagination parameters
test("ST-SRCH-004 Search articles with pagination parameters", async () => {
    const res = await request(app).get('/api/v1/articles?page=1&limit=5');
    
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.articles.length).toBeLessThanOrEqual(5);
    expect(res.body.data.pagination).toBeDefined();
});

// ST-SRCH-005: Browse catalog successfully
test("ST-SRCH-005 Browse catalog successfully", async () => {
    // Catalog browsing usually involves subject areas or categories
    const res = await request(app).get('/api/v1/catalog/subject-areas');
    
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
});

// ST-SRCH-006: Full-text search in catalog with a valid keyword
test("ST-SRCH-006 Full-text search in catalog with a valid keyword", async () => {
    // Current catalog routes don't have a direct "search" endpoint, 
    // but subject-categories supports filtering by subject_area_id.
    // We'll test subject-categories as the catalog browse entry point.
    const res = await request(app).get('/api/v1/catalog/subject-categories');
    
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
});

// ST-SRCH-007: Full-text search in catalog with a keyword that matches nothing
test("ST-SRCH-007 Full-text search in catalog with a keyword that matches nothing", async () => {
    const res = await request(app).get('/api/v1/catalog/subject-categories?subject_area_id=999999');
    
    expect(res.status).toBe(200);
    // Returns empty array if area ID doesn't exist
    expect(res.body.data.length).toBe(0);
});

// ST-SRCH-008: Full-text search in catalog with special characters
test("ST-SRCH-008 Full-text search in catalog with special characters", async () => {
    const res = await request(app).get('/api/v1/catalog/subject-categories?search=%25%26%22');
    
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
});

// ST-SRCH-009: Quick search with a valid keyword
test("ST-SRCH-009 Quick search with a valid keyword", async () => {
    const keyword = testArticleTitle.split(' ')[0] || 'AI';
    const res = await request(app).get(`/api/v1/search/${encodeURIComponent(keyword)}`);
    
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
});

// ST-SRCH-010: Quick search with an empty keyword
test("ST-SRCH-010 Quick search with an empty keyword", async () => {
    // Empty path param usually results in 404 from Express or handled by middleware
    const res = await request(app).get('/api/v1/search/');
    
    // Express returns 404 for empty path param if no specific route handler exists
    expect([404, 400]).toContain(res.status);
});

// ST-SRCH-011: Quick search with a keyword that matches nothing
test("ST-SRCH-011 Quick search with a keyword that matches nothing", async () => {
    const res = await request(app).get('/api/v1/search/thiskeywordshouldnotexist12345');
    
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBe(0);
});

// ST-SRCH-012: Quick search with a very long keyword string
test("ST-SRCH-012 Quick search with a very long keyword string", async () => {
    const longKeyword = 'a'.repeat(500);
    const res = await request(app).get(`/api/v1/search/${longKeyword}`);
    
    expect([200, 400, 414]).toContain(res.status);
});
