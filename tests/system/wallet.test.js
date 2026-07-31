import { jest, test, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import app from '../../src/app.js';
import pool from '../../src/config/database.js';

jest.setTimeout(30000);

// ============ TEST DATA & SHARED STATE ============

const ADMIN_USER = {
    email: 'test_wallet_admin@example.com',
    password: 'Password123!',
    role: 'ADMINISTRATOR'
};

const MAIN_USER = {
    email: 'test_wallet_user@example.com',
    password: 'Password123!',
    role: 'STUDENT'
};

const NO_TX_USER = {
    email: 'test_wallet_no_tx@example.com',
    password: 'Password123!',
    role: 'STUDENT'
};

let adminToken = '';
let mainUserToken = '';
let mainUserId = '';
let noTxUserToken = '';

beforeAll(async () => {
    const bcrypt = await import('bcryptjs');
    const crypto = await import('crypto');

    // Clean up existing test users/data
    const emails = [ADMIN_USER.email, MAIN_USER.email, NO_TX_USER.email];
    for (const email of emails) {
        const userRes = await pool.query('SELECT user_id FROM "user" WHERE email = $1', [email]);
        if (userRes.rows.length > 0) {
            const uId = userRes.rows[0].user_id;
            await pool.query('DELETE FROM wallet_transaction WHERE user_id = $1', [uId]).catch(() => {});
            await pool.query('DELETE FROM wallet WHERE user_id = $1', [uId]).catch(() => {});
            await pool.query('DELETE FROM "user" WHERE user_id = $1', [uId]).catch(() => {});
        }
    }

    // Create Admin User
    const adminId = crypto.randomUUID();
    const adminHashed = await bcrypt.default.hash(ADMIN_USER.password, 10);
    await pool.query(
        'INSERT INTO "user" (user_id, email, password, role, status, type) VALUES ($1, $2, $3, $4, $5, $6)',
        [adminId, ADMIN_USER.email, adminHashed, ADMIN_USER.role, 'ACTIVE', 'LOCAL']
    );

    // Create Main User
    mainUserId = crypto.randomUUID();
    const mainUserHashed = await bcrypt.default.hash(MAIN_USER.password, 10);
    await pool.query(
        'INSERT INTO "user" (user_id, email, password, role, status, type) VALUES ($1, $2, $3, $4, $5, $6)',
        [mainUserId, MAIN_USER.email, mainUserHashed, MAIN_USER.role, 'ACTIVE', 'LOCAL']
    );

    // Create No Transaction User
    const noTxUserId = crypto.randomUUID();
    const noTxUserHashed = await bcrypt.default.hash(NO_TX_USER.password, 10);
    await pool.query(
        'INSERT INTO "user" (user_id, email, password, role, status, type) VALUES ($1, $2, $3, $4, $5, $6)',
        [noTxUserId, NO_TX_USER.email, noTxUserHashed, NO_TX_USER.role, 'ACTIVE', 'LOCAL']
    );

    // Login to retrieve tokens
    const adminLogin = await request(app).post('/api/v1/auth/login').send({
        email: ADMIN_USER.email,
        password: ADMIN_USER.password
    });
    adminToken = adminLogin.body?.data?.token || '';

    const mainLogin = await request(app).post('/api/v1/auth/login').send({
        email: MAIN_USER.email,
        password: MAIN_USER.password
    });
    mainUserToken = mainLogin.body?.data?.token || '';

    const noTxLogin = await request(app).post('/api/v1/auth/login').send({
        email: NO_TX_USER.email,
        password: NO_TX_USER.password
    });
    noTxUserToken = noTxLogin.body?.data?.token || '';
});

afterAll(async () => {
    const emails = [ADMIN_USER.email, MAIN_USER.email, NO_TX_USER.email];
    for (const email of emails) {
        const userRes = await pool.query('SELECT user_id FROM "user" WHERE email = $1', [email]);
        if (userRes.rows.length > 0) {
            const uId = userRes.rows[0].user_id;
            await pool.query('DELETE FROM wallet_transaction WHERE user_id = $1', [uId]).catch(() => {});
            await pool.query('DELETE FROM wallet WHERE user_id = $1', [uId]).catch(() => {});
            await pool.query('DELETE FROM "user" WHERE user_id = $1', [uId]).catch(() => {});
        }
    }
    await pool.end();
});

// ============ WALLET & PAYMENT TESTS ============

// ST-WALL-001: Get current user's wallet successfully
test("ST-WALL-001 Get current user's wallet successfully", async () => {
    const res = await request(app)
        .get('/api/v1/wallet/me')
        .set('Authorization', `Bearer ${mainUserToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('balance');
});

// ST-WALL-002: Get wallet information without authentication
test("ST-WALL-002 Get wallet information without authentication", async () => {
    const res = await request(app)
        .get('/api/v1/wallet/me');

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
});

// ST-WALL-003: Get wallet transaction history successfully
test("ST-WALL-003 Get wallet transaction history successfully", async () => {
    // Deposit 500 coins to main user first to ensure at least one transaction
    const depositRes = await request(app)
        .post(`/api/v1/admin/wallets/${mainUserId}/adjust`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
            amount: 500,
            description: 'Test transaction history deposit'
        });
    expect(depositRes.status).toBe(200);

    const res = await request(app)
        .get('/api/v1/wallet/me/transactions')
        .set('Authorization', `Bearer ${mainUserToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
});

// ST-WALL-004: Get wallet transaction history with no transactions
test("ST-WALL-004 Get wallet transaction history with no transactions", async () => {
    const res = await request(app)
        .get('/api/v1/wallet/me/transactions')
        .set('Authorization', `Bearer ${noTxUserToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBe(0);
});

// ST-WALL-005: Spend coin successfully with sufficient balance
test("ST-WALL-005 Spend coin successfully with sufficient balance", async () => {
    // Deduct/Spend 100 coins
    const res = await request(app)
        .post('/api/v1/wallet/spend')
        .set('Authorization', `Bearer ${mainUserToken}`)
        .send({
            amount: 100,
            description: 'Purchasing article content'
        });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('wallet');
    expect(res.body.data.wallet.balance).toBe(400); // 500 - 100 = 400
});

// ST-WALL-006: Spend coin with insufficient balance
test("ST-WALL-006 Spend coin with insufficient balance", async () => {
    // Try to spend 9999 coins when balance is 400
    const res = await request(app)
        .post('/api/v1/wallet/spend')
        .set('Authorization', `Bearer ${mainUserToken}`)
        .send({
            amount: 9999,
            description: 'Overspending coins'
        });

    expect([400, 402, 409]).toContain(res.status);
    expect(res.body.success).toBe(false);
});

// ST-WALL-007: Spend coin with an invalid amount (negative or zero)
test("ST-WALL-007 Spend coin with an invalid amount (negative or zero)", async () => {
    const resZero = await request(app)
        .post('/api/v1/wallet/spend')
        .set('Authorization', `Bearer ${mainUserToken}`)
        .send({
            amount: 0,
            description: 'Spending zero coins'
        });

    expect(resZero.status).toBe(400);
    expect(resZero.body.success).toBe(false);

    const resNegative = await request(app)
        .post('/api/v1/wallet/spend')
        .set('Authorization', `Bearer ${mainUserToken}`)
        .send({
            amount: -50,
            description: 'Spending negative coins'
        });

    expect(resNegative.status).toBe(400);
    expect(resNegative.body.success).toBe(false);
});

// ST-WALL-008: Spend coin without authentication
test("ST-WALL-008 Spend coin without authentication", async () => {
    const res = await request(app)
        .post('/api/v1/wallet/spend')
        .send({
            amount: 10,
            description: 'No token'
        });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
});
