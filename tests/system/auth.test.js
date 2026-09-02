import { jest, test, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { buildApp } from '../../src/app.js';
let app;
import pool from '../../src/config/database.js';

jest.setTimeout(30000);

const TEST_USER = {
    email: 'testqa@example.com',
    password: 'Password123!',
    first_name: 'Test',
    last_name: 'QA'
};

beforeAll(async () => {
    app = await buildApp();
    await app.ready();
    // Cleanup existing test user
    await pool.query('DELETE FROM "user" WHERE LOWER(email) = $1', [TEST_USER.email.toLowerCase()]);
});

afterAll(async () => {
    if (app) await app.close();
    await pool.query('DELETE FROM "user" WHERE LOWER(email) = $1', [TEST_USER.email.toLowerCase()]);
    await pool.end();
});

test("ST-AUTH-001 Register with valid information", async () => {
    const res = await request(app.server).post('/api/v1/auth/register').send(TEST_USER);
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
});

test("ST-AUTH-002 Register with an existing email address", async () => {
    const res = await request(app.server).post('/api/v1/auth/register').send(TEST_USER);
    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
});

test("ST-AUTH-003 Verify email successfully", async () => {
    const user = await pool.query('SELECT user_id, email FROM "user" WHERE email = $1', [TEST_USER.email.toLowerCase()]);
    const { user_id, email } = user.rows[0];

    const activationToken = jwt.sign(
        { user_id, email },
        process.env.JWT_SECRET || 'scientific_journal_secret_key',
        { expiresIn: '24h' }
    );

    const res = await request(app.server).get(`/api/v1/auth/verify?token=${activationToken}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
});

test("ST-AUTH-004 Log in with valid credentials", async () => {
    const res = await request(app.server).post('/api/v1/auth/login').send({
        email: TEST_USER.email,
        password: TEST_USER.password
    });
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('token');
});

test("ST-AUTH-005 Log in with an incorrect password", async () => {
    const res = await request(app.server).post('/api/v1/auth/login').send({
        email: TEST_USER.email,
        password: 'WrongPassword'
    });
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
});

test("ST-AUTH-006 Log in before email verification", async () => {
    await pool.query('UPDATE "user" SET status = $1 WHERE email = $2', ['INACTIVE', TEST_USER.email.toLowerCase()]);
    const res = await request(app.server).post('/api/v1/auth/login').send({
        email: TEST_USER.email,
        password: TEST_USER.password
    });
    expect(res.status).toBe(403);
    await pool.query('UPDATE "user" SET status = $1 WHERE email = $2', ['ACTIVE', TEST_USER.email.toLowerCase()]);
});

test("ST-AUTH-007 Verify authenticated session", async () => {
    const loginRes = await request(app.server).post('/api/v1/auth/login').send({
        email: TEST_USER.email,
        password: TEST_USER.password
    });
    const token = loginRes.body.data.token;
    const res = await request(app.server).get('/api/v1/auth/check-auth')
        .set('Cookie', [`access_token=${token}`]);
    expect(res.status).toBe(200);
    expect(res.body.authenticated).toBe(true);
});

test("ST-AUTH-008 Refresh access token", async () => {
    const loginRes = await request(app.server).post('/api/v1/auth/login').send({
        email: TEST_USER.email,
        password: TEST_USER.password,
        remember: true
    });
    const refreshToken = loginRes.headers['set-cookie'].find(c => c.startsWith('refresh_token='));
    const res = await request(app.server).get('/api/v1/auth/refresh')
        .set('Cookie', [refreshToken]);
    expect(res.status).toBe(200);
});

test("ST-AUTH-009 Refresh using an expired token", async () => {
    const res = await request(app.server).get('/api/v1/auth/refresh')
        .set('Cookie', ['refresh_token=expired_token']);
    expect(res.status).toBe(401);
});

test("ST-AUTH-010 Log out successfully", async () => {
    const res = await request(app.server).post('/api/v1/auth/logout');
    expect(res.status).toBe(200);
});

test("ST-AUTH-011 Access a protected endpoint without authentication", async () => {
    const res = await request(app.server).get('/api/v1/users/me');
    expect(res.status).toBe(401);
});

test("ST-AUTH-012 Access a protected endpoint with an invalid token", async () => {
    const res = await request(app.server).get('/api/v1/users/me')
        .set('Authorization', 'Bearer invalid_token');
    expect(res.status).toBe(401);
});
