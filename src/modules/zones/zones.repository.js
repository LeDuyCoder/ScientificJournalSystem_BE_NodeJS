import prisma from '../../lib/prisma.js';
import { Prisma } from '@prisma/client';

export const getCountryStats = async ({ page = 1, limit = 10, year }) => {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
    const offset = (pageNum - 1) * limitNum;

    const countRes = await prisma.$queryRaw`
        SELECT COUNT(*)::integer AS total 
        FROM "Zone" 
        WHERE type = 'COUNTRY'
    `;
    const total = Number(countRes[0]?.total || 0);

    let yearClause = Prisma.empty;
    if (year) {
        yearClause = Prisma.sql`AND a.publication_year = ${Number(year)}`;
    }

    const query = Prisma.sql`
        SELECT 
            z.zone_id::text,
            z.code,
            z.name,
            z.iso_code,
            z.source::text,
            z.created_at,
            COUNT(a.article_id)::integer AS article_count
        FROM "Zone" z
        LEFT JOIN "Journal" j ON j.country = z.zone_id AND COALESCE(j.is_deleted, false) = false
        LEFT JOIN "Volume" v ON v.journal_id = j.journal_id AND COALESCE(v.is_deleted, false) = false
        LEFT JOIN "Issue" i ON i.volume_id = v.volume_id AND COALESCE(i.is_deleted, false) = false
        LEFT JOIN "Article" a ON a.issue_id = i.issue_id AND COALESCE(a.is_deleted, false) = false ${yearClause}
        WHERE z.type = 'COUNTRY'
        GROUP BY z.zone_id, z.code, z.name, z.iso_code, z.source, z.created_at
        ORDER BY article_count DESC, z.name ASC
        LIMIT ${limitNum} OFFSET ${offset};
    `;

    const countries = await prisma.$queryRaw(query);

    return {
        countries: countries.map(c => ({
            ...c,
            zone_id: c.zone_id.toString()
        })),
        total
    };
};

export const getRegionStats = async ({ countryCode }) => {
    if (countryCode) {
        const countryCheck = await prisma.$queryRaw`
            SELECT zone_id::text, name 
            FROM "Zone" 
            WHERE type = 'COUNTRY' AND (UPPER(code) = UPPER(${countryCode}) OR UPPER(iso_code) = UPPER(${countryCode}))
        `;
        
        if (countryCheck.length === 0) {
            const error = new Error(`Quốc gia có mã '${countryCode}' không tồn tại`);
            error.statusCode = 404;
            throw error;
        }

        const countryZoneId = BigInt(countryCheck[0].zone_id);

        const regionStatsQuery = Prisma.sql`
            SELECT 
                zr.zone_id::text,
                zr.code,
                zr.name,
                zr.iso_code,
                zr.source::text,
                zr.created_at,
                COUNT(a.article_id)::integer AS article_count
            FROM "Zone" zr
            INNER JOIN "Journal" j ON j.region = zr.zone_id
            INNER JOIN "Volume" v ON v.journal_id = j.journal_id
            INNER JOIN "Issue" i ON i.volume_id = v.volume_id
            LEFT JOIN "Article" a ON a.issue_id = i.issue_id
            WHERE zr.type = 'REGION' AND j.country = ${countryZoneId}
            GROUP BY zr.zone_id, zr.code, zr.name, zr.iso_code, zr.source, zr.created_at
            ORDER BY article_count DESC, zr.name ASC
        `;
        const stats = await prisma.$queryRaw(regionStatsQuery);
        return stats.map(s => ({ ...s, zone_id: s.zone_id.toString() }));
    }

    const globalRegionStatsQuery = Prisma.sql`
        SELECT 
            zr.zone_id::text,
            zr.code,
            zr.name,
            zr.iso_code,
            zr.source::text,
            zr.created_at,
            COUNT(a.article_id)::integer AS article_count
        FROM "Zone" zr
        LEFT JOIN "Journal" j ON j.region = zr.zone_id
        LEFT JOIN "Volume" v ON v.journal_id = j.journal_id
        LEFT JOIN "Issue" i ON i.volume_id = v.volume_id
        LEFT JOIN "Article" a ON a.issue_id = i.issue_id
        WHERE zr.type = 'REGION'
        GROUP BY zr.zone_id, zr.code, zr.name, zr.iso_code, zr.source, zr.created_at
        ORDER BY article_count DESC, zr.name ASC
    `;
    const stats = await prisma.$queryRaw(globalRegionStatsQuery);
    return stats.map(s => ({ ...s, zone_id: s.zone_id.toString() }));
};

export const getCountryRegionsStats = async (countryCode) => {
    const countryCheck = await prisma.$queryRaw`
        SELECT zone_id::text, code, name, iso_code, source::text, created_at
        FROM "Zone" 
        WHERE type = 'COUNTRY' AND (UPPER(code) = UPPER(${countryCode}) OR UPPER(iso_code) = UPPER(${countryCode}))
    `;
    
    if (countryCheck.length === 0) {
        const error = new Error(`Quốc gia có mã '${countryCode}' không tồn tại`);
        error.statusCode = 404;
        throw error;
    }

    const country = countryCheck[0];
    const countryZoneId = BigInt(country.zone_id);

    const regionStatsQuery = Prisma.sql`
        SELECT 
            zr.zone_id::text,
            zr.code,
            zr.name,
            zr.iso_code,
            zr.source::text,
            zr.created_at,
            COUNT(a.article_id)::integer AS article_count
        FROM "Zone" zr
        INNER JOIN "Journal" j ON j.region = zr.zone_id
        INNER JOIN "Volume" v ON v.journal_id = j.journal_id
        INNER JOIN "Issue" i ON i.volume_id = v.volume_id
        LEFT JOIN "Article" a ON a.issue_id = i.issue_id
        WHERE zr.type = 'REGION' AND j.country = ${countryZoneId}
        GROUP BY zr.zone_id, zr.code, zr.name, zr.iso_code, zr.source, zr.created_at
        ORDER BY article_count DESC, zr.name ASC
    `;
    const regions = await prisma.$queryRaw(regionStatsQuery);

    return {
        country: { ...country, zone_id: country.zone_id.toString() },
        regions: regions.map(r => ({ ...r, zone_id: r.zone_id.toString() }))
    };
};

export const zoneExist = async (id) => {
    const res = await prisma.$queryRaw`
        SELECT EXISTS (
            SELECT 1 FROM "Zone" WHERE zone_id = ${BigInt(id)}
        ) AS "exists";
    `;
    return res[0]?.exists || false;
};
