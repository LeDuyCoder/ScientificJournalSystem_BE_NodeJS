import prisma from '../../lib/prisma.js';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

export const summary = async () => {
    const [journalsTotal, journalsToday, articlesTotal, articlesToday, usersTotal] = await Promise.all([
        prisma.journal.count({ where: { is_deleted: false } }),
        prisma.journal.count({ where: { is_deleted: false, created_at: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } } }),
        prisma.article.count({ where: { is_deleted: false } }),
        prisma.article.count({ where: { is_deleted: false, created_at: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } } }),
        prisma.user.count({ where: { status: 'ACTIVE' } })
    ]);

    return {
        total_journals: journalsTotal,
        journal_growth: journalsToday,
        total_articles: articlesTotal,
        article_growth: articlesToday,
        pending_reviews: 0,
        active_users: usersTotal
    };
};

export const getPublicationTrends = async (year, limit) => {
    const targetYear = year || new Date().getFullYear();
    const query = await prisma.$queryRaw`
        WITH years AS (
            SELECT generate_series(${targetYear}::integer - ${limit}::integer + 1, ${targetYear}::integer) AS year
        )
        SELECT 
            y.year,
            COUNT(a.article_id)::integer AS manuscripts,
            0::integer AS published
        FROM years y
        LEFT JOIN "Article" a ON a.publication_year = y.year AND a.is_deleted = false
        GROUP BY y.year
        ORDER BY y.year ASC;
    `;
    
    return {
        target_year: targetYear,
        items: query
    };
};

export const getVolumeIssueStatus = async ({ limit, offset }) => {
    const [total, items] = await Promise.all([
        prisma.volume.count({ where: { is_deleted: false } }),
        prisma.$queryRaw`
            SELECT 
                v.volume_id,
                v.volume_number,
                v.publication_year,
                j.display_name AS journal_name,
                COUNT(i.issue_id)::integer AS total_issues,
                'PUBLISHED' AS status,
                (v.volume_number % 10) * 10 + 10 AS progress
            FROM "Volume" v
            LEFT JOIN "Journal" j ON v.journal_id = j.journal_id
            LEFT JOIN "Issue" i ON v.volume_id = i.volume_id AND i.is_deleted = false
            WHERE v.is_deleted = false
            GROUP BY v.volume_id, j.display_name
            ORDER BY v.publication_year DESC, v.volume_number DESC
            LIMIT ${limit} OFFSET ${offset};
        `
    ]);
    
    return { items, total };
};

export const exportVolumeIssueStatus = async () => {
    return prisma.$queryRaw`
        SELECT 
            v.volume_id,
            v.volume_number,
            v.publication_year,
            j.display_name AS journal_name,
            COUNT(i.issue_id)::integer AS total_issues,
            'PUBLISHED' AS status,
            (v.volume_number % 10) * 10 + 10 AS progress
        FROM "Volume" v
        LEFT JOIN "Journal" j ON v.journal_id = j.journal_id
        LEFT JOIN "Issue" i ON v.volume_id = i.volume_id AND i.is_deleted = false
        WHERE v.is_deleted = false
        GROUP BY v.volume_id, j.display_name
        ORDER BY v.publication_year DESC, v.volume_number DESC;
    `;
};

export const getUsersList = async ({ search, role, status, limit, offset, sortBy, sortOrder }) => {
    const where = {};
    if (search) {
        where.OR = [
            { email: { contains: search, mode: 'insensitive' } },
            { first_name: { contains: search, mode: 'insensitive' } },
            { last_name: { contains: search, mode: 'insensitive' } }
        ];
    }
    if (role) where.role = role;
    if (status) where.status = status;

    const allowedSortBy = ['email', 'first_name', 'last_name', 'role', 'status', 'created_at'];
    const safeSortBy = allowedSortBy.includes(sortBy) ? sortBy : 'email';
    const safeSortOrder = sortOrder.toLowerCase() === 'asc' ? 'asc' : 'desc';

    const [total, items] = await Promise.all([
        prisma.user.count({ where }),
        prisma.user.findMany({
            where,
            orderBy: { [safeSortBy]: safeSortOrder },
            skip: offset,
            take: limit
        })
    ]);

    return { items, total };
};

export const getUserDetailById = async (userId) => {
    return prisma.user.findUnique({
        where: { user_id: userId },
        select: {
            user_id: true,
            email: true,
            type: true,
            status: true,
            role: true,
            last_name: true,
            first_name: true,
            url_image: true,
            date_of_birth: true,
            gender: true
        }
    });
};

export const createUser = async (userData) => {
    const { email, password, first_name, last_name, role, status, date_of_birth, gender } = userData;
    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existingUser) {
        const error = new Error('Email đã tồn tại trong hệ thống');
        error.statusCode = 409;
        throw error;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
        data: {
            user_id: crypto.randomUUID(),
            email: normalizedEmail,
            password: hashedPassword,
            type: 'LOCAL',
            status: status || 'ACTIVE',
            role: role || 'RESEARCHER',
            first_name: first_name || null,
            last_name: last_name || null,
            date_of_birth: date_of_birth ? new Date(date_of_birth) : null,
            gender: gender !== undefined ? gender : null
        },
        select: {
            user_id: true, email: true, type: true, status: true, role: true, 
            first_name: true, last_name: true, date_of_birth: true, gender: true
        }
    });

    return user;
};

export const updateUserByAdmin = async (userId, data) => {
    return prisma.$transaction(async (tx) => {
        const user = await tx.user.findUnique({ where: { user_id: userId } });
        if (!user) return null;

        const updateData = { ...data };
        if (updateData.password) {
            updateData.password = await bcrypt.hash(updateData.password, 10);
        }
        if (updateData.date_of_birth) {
            updateData.date_of_birth = new Date(updateData.date_of_birth);
        }
        if (updateData.email) {
            updateData.email = updateData.email.trim().toLowerCase();
        }

        return tx.user.update({
            where: { user_id: userId },
            data: updateData,
            select: {
                user_id: true, email: true, type: true, status: true, role: true, 
                first_name: true, last_name: true, url_image: true, date_of_birth: true, gender: true
            }
        });
    });
};
