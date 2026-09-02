import prisma from '../../lib/prisma.js';
import { Prisma } from '@prisma/client';

export const getSubjectAreas = async () => {
    const areas = await prisma.subject_Area.findMany({
        orderBy: { display_name: 'asc' },
        select: {
            subject_area_id: true,
            display_name: true,
            description: true
        }
    });
    return areas.map(a => ({
        subject_area_id: a.subject_area_id.toString(),
        display_name: a.display_name,
        description: a.description
    }));
};

export const getSubjectCategories = async ({ subjectAreaId }) => {
    const where = {};
    if (subjectAreaId) {
        where.subject_area_id = BigInt(subjectAreaId);
    }
    const categories = await prisma.subject_Category.findMany({
        where,
        orderBy: { display_name: 'asc' },
        select: {
            subject_category_id: true,
            subject_area_id: true,
            display_name: true,
            description: true
        }
    });
    return categories.map(c => ({
        subject_category_id: c.subject_category_id.toString(),
        subject_area_id: c.subject_area_id?.toString() || null,
        display_name: c.display_name,
        description: c.description
    }));
};

export const getJournalRankings = async (journalId, filters) => {
    const journalCheck = await prisma.journal.findUnique({
        where: { journal_id: BigInt(journalId) }
    });

    if (!journalCheck) {
        const error = new Error('Tạp chí không tồn tại');
        error.statusCode = 404;
        throw error;
    }

    const where = { journal_id: BigInt(journalId) };
    
    if (filters.year) {
        where.year = parseInt(filters.year, 10);
    }

    const rankings = await prisma.journal_Ranking.findMany({
        where,
        include: {
            Ranking_Metric: true,
            Subject_Category: true
        },
        orderBy: [
            { year: 'desc' },
            { Ranking_Metric: { code: 'asc' } }
        ]
    });

    let filteredRankings = rankings;

    if (filters.metric_code) {
        filteredRankings = filteredRankings.filter(r => r.Ranking_Metric?.code?.toUpperCase() === filters.metric_code.trim().toUpperCase());
    }
    if (filters.quartile) {
        filteredRankings = filteredRankings.filter(r => r.value_txt?.toUpperCase() === filters.quartile.trim().toUpperCase() && r.Ranking_Metric?.metric_type === 'QUARTILE');
    }
    if (filters.source) {
        if ('SCIMAGO' !== filters.source.trim().toUpperCase()) {
             filteredRankings = []; // Only SCIMAGO in db currently based on old query
        }
    }

    return filteredRankings.map(row => {
        let value = null;
        if (row.Ranking_Metric?.metric_type === 'QUARTILE') {
            value = row.value_txt;
        } else if (row.Ranking_Metric?.metric_type === 'SCORE') {
            value = row.value_float;
        } else if (row.Ranking_Metric?.metric_type === 'INTEGER') {
            value = row.value_int;
        } else {
            value = row.value_txt ?? row.value_float ?? row.value_int;
        }

        return {
            journal_ranking_id: row.journal_ranking_id.toString(),
            journal_id: row.journal_id.toString(),
            year: row.year,
            source: 'SCIMAGO',
            metric_code: row.Ranking_Metric?.code,
            metric_name: row.Ranking_Metric?.display_name,
            metric_type: row.Ranking_Metric?.metric_type,
            value,
            subject_category: row.subject_category_id ? {
                subject_category_id: row.subject_category_id.toString(),
                display_name: row.Subject_Category?.display_name
            } : null
        };
    });
};

export const getVolumes = async ({ journalId, page = 1, limit = 10 }) => {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
    const offset = (pageNum - 1) * limitNum;
    
    let journalCondition = Prisma.empty;
    if (journalId) {
        journalCondition = Prisma.sql`WHERE v.journal_id = ${BigInt(journalId)}`;
    }

    const query = Prisma.sql`
        SELECT 
            v.volume_id::text AS volume_id,
            v.volume_id::text AS id,
            v.journal_id::text AS journal_id,
            j.display_name AS journal_name,
            v.volume_number,
            v.publication_year,
            v.publication_year AS year,
            COUNT(DISTINCT i.issue_id)::integer AS issue_count,
            COUNT(DISTINCT a.article_id)::integer AS article_count
        FROM "Volume" v
        LEFT JOIN "Journal" j ON j.journal_id = v.journal_id
        LEFT JOIN "Issue" i ON i.volume_id = v.volume_id
        LEFT JOIN "Article" a ON a.issue_id = i.issue_id
        ${journalCondition}
        GROUP BY v.volume_id, v.journal_id, j.display_name, v.volume_number, v.publication_year
        ORDER BY v.publication_year DESC NULLS LAST, v.volume_number DESC NULLS LAST
        LIMIT ${limitNum} OFFSET ${offset}
    `;

    const countQuery = Prisma.sql`
        SELECT COUNT(*)::integer AS total
        FROM "Volume" v
        ${journalCondition}
    `;

    const [listRes, countRes] = await Promise.all([
        prisma.$queryRaw(query),
        prisma.$queryRaw(countQuery)
    ]);

    const total = Number(countRes[0]?.total || 0);
    return {
        items: listRes,
        pagination: {
            page: pageNum,
            limit: limitNum,
            total,
            total_pages: Math.max(1, Math.ceil(total / limitNum)),
        }
    };
};

export const getIssues = async ({ volumeId, page = 1, limit = 10 }) => {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
    const offset = (pageNum - 1) * limitNum;
    
    let volumeCondition = Prisma.empty;
    if (volumeId) {
        volumeCondition = Prisma.sql`WHERE i.volume_id = ${BigInt(volumeId)}`;
    }

    const query = Prisma.sql`
        SELECT 
            i.issue_id::text AS issue_id,
            i.issue_id::text AS id,
            i.volume_id::text AS volume_id,
            i.issue_number,
            i.publication_year,
            i.publication_year AS year,
            COUNT(DISTINCT a.article_id)::integer AS article_count
        FROM "Issue" i
        LEFT JOIN "Article" a ON a.issue_id = i.issue_id
        ${volumeCondition}
        GROUP BY i.issue_id, i.volume_id, i.issue_number, i.publication_year
        ORDER BY i.publication_year DESC NULLS LAST, i.issue_number DESC NULLS LAST
        LIMIT ${limitNum} OFFSET ${offset}
    `;

    const countQuery = Prisma.sql`
        SELECT COUNT(*)::integer AS total
        FROM "Issue" i
        ${volumeCondition}
    `;

    const [listRes, countRes] = await Promise.all([
        prisma.$queryRaw(query),
        prisma.$queryRaw(countQuery)
    ]);

    const total = Number(countRes[0]?.total || 0);
    return {
        items: listRes,
        pagination: {
            page: pageNum,
            limit: limitNum,
            total,
            total_pages: Math.max(1, Math.ceil(total / limitNum)),
        }
    };
};
