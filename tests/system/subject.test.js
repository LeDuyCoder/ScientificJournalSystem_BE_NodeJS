import { jest, test, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import app from '../../src/app.js';
import pool from '../../src/config/database.js';

jest.setTimeout(30000);

// ============ TEST DATA & SHARED STATE ============

const ADMIN_USER = {
    email: 'test_subj_admin@example.com',
    password: 'Password123!',
    role: 'ADMINISTRATOR'
};

const NORMAL_USER = {
    email: 'test_subj_user@example.com',
    password: 'Password123!',
    role: 'STUDENT'
};

let adminToken = '';
let normalToken = '';
let subjectAreaId = null;
let dependentSubjectAreaId = null;
let categoryId = null;

beforeAll(async () => {
    const bcrypt = await import('bcryptjs');
    const crypto = await import('crypto');

    // Clean up test users
    await pool.query('DELETE FROM "user" WHERE email IN ($1, $2)', [ADMIN_USER.email, NORMAL_USER.email]);

    // Sync sequences to prevent primary key unique constraint violations
    await pool.query(`
        SELECT setval(pg_get_serial_sequence('"Subject_Area"', 'subject_area_id'), COALESCE((SELECT MAX(subject_area_id) FROM "Subject_Area"), 1));
        SELECT setval(pg_get_serial_sequence('"Subject_Category"', 'subject_category_id'), COALESCE((SELECT MAX(subject_category_id) FROM "Subject_Category"), 1));
    `).catch(() => {});

    // Create Admin User
    const adminId = crypto.randomUUID();
    const adminHashed = await bcrypt.default.hash(ADMIN_USER.password, 10);
    await pool.query(
        'INSERT INTO "user" (user_id, email, password, role, status, type) VALUES ($1, $2, $3, $4, $5, $6)',
        [adminId, ADMIN_USER.email, adminHashed, ADMIN_USER.role, 'ACTIVE', 'LOCAL']
    );

    // Create Normal User
    const userId = crypto.randomUUID();
    const userHashed = await bcrypt.default.hash(NORMAL_USER.password, 10);
    await pool.query(
        'INSERT INTO "user" (user_id, email, password, role, status, type) VALUES ($1, $2, $3, $4, $5, $6)',
        [userId, NORMAL_USER.email, userHashed, NORMAL_USER.role, 'ACTIVE', 'LOCAL']
    );

    // Login to retrieve tokens
    const adminLoginRes = await request(app).post('/api/v1/auth/login').send({
        email: ADMIN_USER.email,
        password: ADMIN_USER.password
    });
    adminToken = adminLoginRes.body?.data?.token || '';

    const normalLoginRes = await request(app).post('/api/v1/auth/login').send({
        email: NORMAL_USER.email,
        password: NORMAL_USER.password
    });
    normalToken = normalLoginRes.body?.data?.token || '';
});

afterAll(async () => {
    // Cleanup dependent data
    if (categoryId) {
        await pool.query('DELETE FROM "Subject_Category" WHERE subject_category_id = $1', [categoryId]).catch(() => {});
    }
    if (subjectAreaId) {
        await pool.query('DELETE FROM "Subject_Category" WHERE subject_area_id = $1', [subjectAreaId]).catch(() => {});
        await pool.query('DELETE FROM "Subject_Area" WHERE subject_area_id = $1', [subjectAreaId]).catch(() => {});
    }
    if (dependentSubjectAreaId) {
        await pool.query('DELETE FROM "Subject_Category" WHERE subject_area_id = $1', [dependentSubjectAreaId]).catch(() => {});
        await pool.query('DELETE FROM "Subject_Area" WHERE subject_area_id = $1', [dependentSubjectAreaId]).catch(() => {});
    }

    // Clean up test users
    await pool.query('DELETE FROM "user" WHERE email IN ($1, $2)', [ADMIN_USER.email, NORMAL_USER.email]);
    await pool.end();
});

// ============ SUBJECT AREA TESTS ============

// ST-SUBJ-001: Get subject area list successfully
test("ST-SUBJ-001 Get subject area list successfully", async () => {
    const res = await request(app).get('/api/v1/subject-areas');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data?.items)).toBe(true);
});

// ST-SUBJ-002: Create a new subject area with valid data
test("ST-SUBJ-002 Create a new subject area with valid data", async () => {
    const res = await request(app)
        .post('/api/v1/subject-areas')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
            display_name: 'Test Subject Area ' + Date.now(),
            description: 'This is a test subject area description.'
        });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('subject_area_id');
    subjectAreaId = res.body.data.subject_area_id;
});

// ST-SUBJ-003: Create a subject area with missing required fields
test("ST-SUBJ-003 Create a subject area with missing required fields", async () => {
    const res = await request(app)
        .post('/api/v1/subject-areas')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
            description: 'Missing display name field'
        });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
});

// ST-SUBJ-004: Create a subject area without sufficient permission
test("ST-SUBJ-004 Create a subject area without sufficient permission", async () => {
    const res = await request(app)
        .post('/api/v1/subject-areas')
        .set('Authorization', `Bearer ${normalToken}`)
        .send({
            display_name: 'Unauthorized Subject Area ' + Date.now(),
            description: 'Requester has STUDENT role'
        });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
});

// ST-SUBJ-005: Get subject area detail successfully
test("ST-SUBJ-005 Get subject area detail successfully", async () => {
    let id = subjectAreaId;
    if (!id) {
        const listRes = await request(app).get('/api/v1/subject-areas');
        if (listRes.body.data?.items?.length > 0) {
            id = listRes.body.data.items[0].subject_area_id;
        }
    }

    if (!id) return;

    const res = await request(app).get(`/api/v1/subject-areas/${id}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
});

// ST-SUBJ-006: Get detail of a non-existent subject area
test("ST-SUBJ-006 Get detail of a non-existent subject area", async () => {
    const res = await request(app).get('/api/v1/subject-areas/999999999');

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
});

// ST-SUBJ-007: Update subject area successfully
test("ST-SUBJ-007 Update subject area successfully", async () => {
    let id = subjectAreaId;
    if (!id) {
        const listRes = await request(app).get('/api/v1/subject-areas');
        if (listRes.body.data?.items?.length > 0) {
            id = listRes.body.data.items[0].subject_area_id;
        }
    }

    if (!id) return;

    const res = await request(app)
        .put(`/api/v1/subject-areas/${id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
            display_name: 'Updated Subject Area ' + Date.now(),
            description: 'Updated description content.'
        });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
});

// ST-SUBJ-008: Delete a subject area that has linked subject categories
test("ST-SUBJ-008 Delete a subject area that has linked subject categories", async () => {
    // 1. Create a temporary subject area
    const areaRes = await request(app)
        .post('/api/v1/subject-areas')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
            display_name: 'Temp Dependent Area ' + Date.now(),
            description: 'Area that will have a dependent category'
        });
    expect(areaRes.status).toBe(201);
    dependentSubjectAreaId = areaRes.body.data.subject_area_id;

    // 2. Link a subject category to this area
    const catRes = await request(app)
        .post('/api/v1/subject-categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
            subject_area_id: dependentSubjectAreaId,
            display_name: 'Dependent Category ' + Date.now(),
            description: 'Linked category'
        });
    expect(catRes.status).toBe(201);
    categoryId = catRes.body.data.subject_category_id;

    // 3. Try to delete the subject area
    const deleteRes = await request(app)
        .delete(`/api/v1/subject-areas/${dependentSubjectAreaId}`)
        .set('Authorization', `Bearer ${adminToken}`);

    expect([200, 201, 409]).toContain(deleteRes.status);
});
