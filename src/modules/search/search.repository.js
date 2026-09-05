import prisma from '../../lib/prisma.js';
import cacheService from '../../services/cache.service.js';

export const globalSearch = async (keyword, limit = 10) => {
    const normalizedKeyword = String(keyword || '').trim().toLowerCase();
    const cacheKey = `search:global:${normalizedKeyword}:${limit}`;

    const cachedData = await cacheService.get(cacheKey);
    if (cachedData) {
        return cachedData;
    }

    const searchPattern = `%${keyword}%`;
    const results = await prisma.$queryRaw`
      SELECT
        id,
        name,
        type
    FROM (
        SELECT
            journal_id::text AS id,
            display_name AS name,
            'JOURNAL' AS type
        FROM "Journal"
        UNION ALL
        SELECT
            author_id::text,
            display_name,
            'AUTHOR'
        FROM "Author"
        UNION ALL
        SELECT
            article_id::text,
            title,
            'ARTICLE'
        FROM "Article"
        UNION ALL
        SELECT
            keyword_id::text,
            display_name,
            'KEYWORD'
        FROM "Keyword"
        UNION ALL
        SELECT
            subject_area_id::text,
            display_name,
            'AREA'
        FROM "Subject_Area"
        UNION ALL
        SELECT
            subject_category_id::text,
            display_name,
            'CATEGORY'
        FROM "Subject_Category"
    ) s
    WHERE LOWER(name) LIKE LOWER(${searchPattern})
    ORDER BY name
    LIMIT ${Number(limit)};
    `;

    if (results) {
        await cacheService.set(cacheKey, results, 300);
    }

    return results;
};
