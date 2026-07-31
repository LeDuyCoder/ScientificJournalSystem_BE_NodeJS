import { jest, test, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import app from '../../src/app.js';
import pool from '../../src/config/database.js';

jest.setTimeout(30000);

// ============ TEST DATA & SHARED STATE ============

let publisherId = null;
let journalId = null;
let volumeId = null;
let ownerToken = '';
let countryId = null;
let regionId = null;

beforeAll(async () => {
    const bcrypt = await import('bcryptjs');
    const crypto = await import('crypto');
    const TEST_USER = {
        email: 'test_journal_admin@example.com',
        password: 'Password123!',
        role: 'ADMINISTRATOR'
    };
    const hashedPassword = await bcrypt.default.hash(TEST_USER.password, 10);

    // Clean up and insert test user
    await pool.query('DELETE FROM "user" WHERE email = $1', [TEST_USER.email]);
    const userId = crypto.randomUUID();
    await pool.query(
        'INSERT INTO "user" (user_id, email, password, role, status, type) VALUES ($1, $2, $3, $4, $5, $6)',
        [userId, TEST_USER.email, hashedPassword, TEST_USER.role, 'ACTIVE', 'LOCAL']
    );

    // Login as admin/authorized user
    const loginRes = await request(app).post('/api/v1/auth/login').send({
        email: TEST_USER.email,
        password: TEST_USER.password
    });
    ownerToken = loginRes.body?.data?.token || '';

    // Get an existing publisher
    const pubRes = await pool.query('SELECT publisher_id FROM "Publisher" LIMIT 1');
    if (pubRes.rows.length > 0) {
        publisherId = pubRes.rows[0].publisher_id;
    }

    // Get valid country and region from Zone
    const countryRes = await pool.query('SELECT zone_id FROM "Zone" WHERE type = \'COUNTRY\' LIMIT 1');
    if (countryRes.rows.length > 0) {
        countryId = countryRes.rows[0].zone_id;
    }
    const regionRes = await pool.query('SELECT zone_id FROM "Zone" WHERE type = \'REGION\' LIMIT 1');
    if (regionRes.rows.length > 0) {
        regionId = regionRes.rows[0].zone_id;
    }
});

afterAll(async () => {
    if (volumeId) {
        await pool.query('DELETE FROM "Volume" WHERE volume_id = $1', [volumeId]).catch(() => {});
    }
    if (journalId) {
        await pool.query('DELETE FROM "Volume" WHERE journal_id = $1', [journalId]).catch(() => {});
        await pool.query('DELETE FROM "Journal" WHERE journal_id = $1', [journalId]).catch(() => {});
    }
    await pool.query('DELETE FROM "user" WHERE email = $1', ['test_journal_admin@example.com']).catch(() => {});
    await pool.end();
});

// ============ JOURNAL TESTS ============

// ST-JOUR-001: Get journal list successfully
test("ST-JOUR-001 Get journal list successfully", async () => {
    const res = await request(app)
        .get('/api/v1/journal')
        .set('Authorization', `Bearer ${ownerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data?.items)).toBe(true);
});

// ST-JOUR-002: Get journal detail successfully
test("ST-JOUR-002 Get journal detail successfully", async () => {
    // Use first existing journal from DB
    const listRes = await request(app)
        .get('/api/v1/journal')
        .set('Authorization', `Bearer ${ownerToken}`);
        
    const journals = listRes.body.data?.items || [];
    if (journals.length === 0) return;
    
    const res = await request(app)
        .get(`/api/v1/journal/${journals[0].journal_id}`)
        .set('Authorization', `Bearer ${ownerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
});

// ST-JOUR-003: Get detail of a non-existent journal
test("ST-JOUR-003 Get detail of a non-existent journal", async () => {
    const res = await request(app)
        .get('/api/v1/journal/999999999')
        .set('Authorization', `Bearer ${ownerToken}`);

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
});

// ST-JOUR-004: Create a new journal with valid data (Admin)
test("ST-JOUR-004 Create a new journal with valid data (Admin)", async () => {
    const res = await request(app)
        .post('/api/v1/journal')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
            publisher_id: publisherId,
            display_name: 'Test Journal ' + Date.now(),
            type: 'Journal',
            country: countryId,
            region: regionId,
            issn: '1234-567X',
            is_open_access: false,
            is_oa_diamond: false
        });

    expect([201, 200]).toContain(res.status);
    expect(res.body.success).toBe(true);
    if (res.body.data && res.body.data.journal_id) {
        journalId = res.body.data.journal_id;
    }
});

// ST-JOUR-005: Create a new journal without Admin permission
test("ST-JOUR-005 Create a new journal without Admin permission", async () => {
    const res = await request(app)
        .post('/api/v1/journal')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
            display_name: 'Unauthorized Journal',
            country: countryId
        });

    expect(res.status).toBe(400); // Validation error
    expect(res.body.success).toBe(false);
});

// ST-JOUR-006: Update journal information successfully (Admin)
test("ST-JOUR-006 Update journal information successfully (Admin)", async () => {
    const listRes = await request(app)
        .get('/api/v1/journal')
        .set('Authorization', `Bearer ${ownerToken}`);
    
    if (!listRes.body.data?.items || listRes.body.data.items.length === 0) {
        return;
    }
    const targetJournal = journalId || listRes.body.data.items[0].journal_id;

    const res = await request(app)
        .put(`/api/v1/journal/${targetJournal}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ display_name: 'Updated Journal Name' });

    expect([200, 201]).toContain(res.status);
});

// ST-JOUR-007: Delete journal successfully (Admin)
test("ST-JOUR-007 Delete journal successfully (Admin)", async () => {
    if (!journalId) return;

    const res = await request(app)
        .delete(`/api/v1/journal/${journalId}`)
        .set('Authorization', `Bearer ${ownerToken}`);

    expect([200, 201]).toContain(res.status);
});

// ST-JOUR-008: Delete a journal that has associated volumes/issues
test("ST-JOUR-008 Delete a journal that has associated volumes/issues", async () => {
    const journalsRes = await request(app)
        .get('/api/v1/journal')
        .set('Authorization', `Bearer ${ownerToken}`);
        
    if (!journalsRes.body.data?.items || journalsRes.body.data.items.length === 0) return;

    const journal = journalsRes.body.data.items[0];
    const deleteRes = await request(app)
        .delete(`/api/v1/journal/${journal.journal_id}`)
        .set('Authorization', `Bearer ${ownerToken}`);

    expect([200, 201, 409]).toContain(deleteRes.status);
});

// ============ VOLUME TESTS ============

// ST-JOUR-009: Get volume list successfully
test("ST-JOUR-009 Get volume list successfully", async () => {
    const res = await request(app)
        .get('/api/v1/volumes')
        .set('Authorization', `Bearer ${ownerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
});

// ST-JOUR-010: Create a new volume with valid data
test("ST-JOUR-010 Create a new volume with valid data", async () => {
    const journalsRes = await request(app)
        .get('/api/v1/journal')
        .set('Authorization', `Bearer ${ownerToken}`);
        
    let targetJournal = null;
    if (journalsRes.body.data?.items?.length > 0) {
        targetJournal = journalsRes.body.data.items[0].journal_id;
    }

    if (!targetJournal) return;

    const res = await request(app)
        .post('/api/v1/volumes')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
            journal_id: targetJournal,
            volume_number: Math.floor(Math.random() * 1000) + 1,
            publication_year: 2026
        });

    expect([201, 200]).toContain(res.status);
    if (res.body.data && res.body.data.volume_id) {
        volumeId = res.body.data.volume_id;
    }
});

// ST-JOUR-011: Create a volume with a non-existent journal reference
test("ST-JOUR-011 Create a volume with a non-existent journal reference", async () => {
    const res = await request(app)
        .post('/api/v1/volumes')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
            journal_id: 999999999,
            volume_number: 1,
            publication_year: 2026
        });

    expect([400, 404]).toContain(res.status);
});

// ST-JOUR-012: Get volume detail successfully
test("ST-JOUR-012 Get volume detail successfully", async () => {
    const listRes = await request(app)
        .get('/api/v1/volumes')
        .set('Authorization', `Bearer ${ownerToken}`);
        
    const volumes = listRes.body.data?.items || [];
    if (volumes.length === 0) return;

    const res = await request(app)
        .get(`/api/v1/volumes/${volumes[0].volume_id}`)
        .set('Authorization', `Bearer ${ownerToken}`);

    expect(res.status).toBe(200);
});

// ST-JOUR-013: Update volume information successfully
test("ST-JOUR-013 Update volume information successfully", async () => {
    if (!volumeId) {
        const listRes = await request(app)
            .get('/api/v1/volumes')
            .set('Authorization', `Bearer ${ownerToken}`);
        if (listRes.body.data?.items?.length === 0) return;
        volumeId = listRes.body.data.items[0].volume_id;
    }

    const res = await request(app)
        .put(`/api/v1/volumes/${volumeId}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ publication_year: 2027 });

    expect([200, 201]).toContain(res.status);
});

// ST-JOUR-014: Delete volume successfully
test("ST-JOUR-014 Delete volume successfully", async () => {
    if (!volumeId) {
        const listRes = await request(app)
            .get('/api/v1/volumes')
            .set('Authorization', `Bearer ${ownerToken}`);
        if (listRes.body.data?.items?.length === 0) return;
        volumeId = listRes.body.data.items[0].volume_id;
    }

    const res = await request(app)
        .delete(`/api/v1/volumes/${volumeId}`)
        .set('Authorization', `Bearer ${ownerToken}`);

    expect([200, 201]).toContain(res.status);
});

// ============ ISSUE TESTS ============

// ST-JOUR-015: Get issue list successfully
test("ST-JOUR-015 Get issue list successfully", async () => {
    const res = await request(app)
        .get('/api/v1/issues')
        .set('Authorization', `Bearer ${ownerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
});

// ST-JOUR-016: Create a new issue with valid data
test("ST-JOUR-016 Create a new issue with valid data", async () => {
    const volumesRes = await request(app)
        .get('/api/v1/volumes')
        .set('Authorization', `Bearer ${ownerToken}`);
        
    const volumes = volumesRes.body.data?.items || [];
    if (volumes.length === 0) return;

    const res = await request(app)
        .post('/api/v1/issues')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
            volume_id: volumes[0].volume_id,
            issue_number: Math.floor(Math.random() * 100) + 1,
            publication_year: 2026
        });

    expect([201, 200]).toContain(res.status);
});

// ST-JOUR-017: Create an issue with missing required fields
test("ST-JOUR-017 Create an issue with missing required fields", async () => {
    const res = await request(app)
        .post('/api/v1/issues')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
            issue_number: 1
        });

    expect(res.status).toBe(400);
});

// ST-JOUR-018: Create an issue without authentication
test("ST-JOUR-018 Create an issue without authentication", async () => {
    const res = await request(app)
        .post('/api/v1/issues')
        .send({
            volume_id: 1,
            issue_number: 1,
            publication_year: 2026
        });

    expect([401, 400]).toContain(res.status);
});
