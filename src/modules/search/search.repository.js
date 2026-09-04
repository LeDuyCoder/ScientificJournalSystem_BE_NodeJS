import prisma from '../../lib/prisma.js';

export const globalSearch = async (keyword, limit) => {
    const searchPattern = `%${keyword}%`;
    return prisma.$queryRaw`
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
};
