import { jest, test, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import app from '../../src/app.js';
import pool from '../../src/config/database.js';

jest.setTimeout(30000);

const TEST_ARTICLE = {
    title: 'Test Article for Integration Testing',
    abstract: 'This is a test abstract',
    publication_year: 2026,
    issue_id: 1,
    doi: '10.1000/xyz123'
};

let authToken = '';
let articleId = null;

beforeAll(async () => {
    // Setup: Create a dummy user and login to get a token
    const userData = { email: 'test_article@example.com', password: 'Password123!', role: 'STUDENT' };
    await pool.query('DELETE FROM "user" WHERE email = $1', [userData.email]);
    
    const bcrypt = await import('bcryptjs');
    const hashedPassword = await bcrypt.default.hash(userData.password, 10);
    const userId = (await import('crypto')).randomUUID();
    await pool.query(
        'INSERT INTO "user" (user_id, email, password, role, status, type) VALUES ($1, $2, $3, $4, $5, $6)',
        [userId, userData.email, hashedPassword, userData.role, 'ACTIVE', 'LOCAL']
    );

    const loginRes = await request(app).post('/api/v1/auth/login').send({
        email: userData.email,
        password: userData.password
    });
    authToken = loginRes.body.data.token;

    // Fetch a valid issue_id from the database
    const issueRes = await pool.query('SELECT issue_id FROM "Issue" LIMIT 1');
    if (issueRes.rows.length > 0) {
        TEST_ARTICLE.issue_id = parseInt(issueRes.rows[0].issue_id, 10);
    }
    
    // Ensure unique DOI to avoid unique constraint violations
    TEST_ARTICLE.doi = '10.1000/test' + Date.now();
});

afterAll(async () => {
    // Cleanup
    if (articleId) await pool.query('DELETE FROM "Article" WHERE article_id = $1', [articleId]);
    await pool.query('DELETE FROM "user" WHERE email = $1', ['test_article@example.com']);
    await pool.end();
});

test("ST-ARTICLE-001 Create a new article with valid information", async () => {
    const res = await request(app)
        .post('/api/v1/articles')
        .set('Authorization', `Bearer ${authToken}`)
        .send(TEST_ARTICLE);
    
    expect(res.status).toBe(201);
    articleId = res.body.data.article_id; // Store for cleanup
});

test("ST-ARTICLE-002 Create an article with invalid or incomplete information", async () => {
    const res = await request(app)
        .post('/api/v1/articles')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: '' }); // Invalid: missing required fields
    
    expect(res.status).toBe(400);
});

test("ST-ARTICLE-003 Retrieve the article list successfully", async () => {
    const res = await request(app).get('/api/v1/articles');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
});

test("ST-ARTICLE-004 View article details successfully", async () => {
    const res = await request(app).get(`/api/v1/articles/${articleId}`);
    expect(res.status).toBe(200);
    expect(res.body.data.article_id).toBe(articleId);
});

test("ST-ARTICLE-005 View details of a non-existing article", async () => {
    const res = await request(app).get('/api/v1/articles/999999999');
    expect(res.status).toBe(404);
});

test("ST-ARTICLE-006 Update an article with valid information", async () => {
    const res = await request(app)
        .put(`/api/v1/articles/${articleId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Updated Title' });
    
    expect(res.status).toBe(200);
    expect(res.body.data.title).toBe('Updated Title');
});

test("ST-ARTICLE-007 Update an article without permission", async () => {
    // Testing logic for unauthorized access requires a different user token or invalid session
    const res = await request(app)
        .put(`/api/v1/articles/${articleId}`)
        .set('Authorization', 'Bearer invalid_or_unauthorized_token')
        .send({ title: 'Hacked Title' });
    
    expect(res.status).toBe(401); 
});

test("ST-ARTICLE-008 Delete an article successfully", async () => {
    const res = await request(app)
        .delete(`/api/v1/articles/${articleId}`)
        .set('Authorization', `Bearer ${authToken}`);
    
    expect(res.status).toBe(200);
});

test("ST-ARTICLE-009 Restore a deleted article successfully", async () => {
    const res = await request(app)
        .patch(`/api/v1/articles/${articleId}/restore`)
        .set('Authorization', `Bearer ${authToken}`);
    
    expect(res.status).toBe(200);
});

test("ST-ARTICLE-010 Restore an active article", async () => {
    const res = await request(app)
        .patch(`/api/v1/articles/${articleId}/restore`)
        .set('Authorization', `Bearer ${authToken}`);
    
    expect(res.status).toBe(404); // API returns 404 if not found or not deleted (which returns null in service)
});

test("ST-ARTICLE-011 Search articles using a keyword", async () => {
    const res = await request(app).get('/api/v1/articles?search=Updated');
    expect(res.status).toBe(200);
    expect(res.body.data.articles.length).toBeGreaterThan(0);
});

test("ST-ARTICLE-012 Create an article without authentication", async () => {
    const res = await request(app)
        .post('/api/v1/articles')
        .send(TEST_ARTICLE);
    
    expect(res.status).toBe(401);
});
