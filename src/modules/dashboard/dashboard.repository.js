import prisma from '../../lib/prisma.js';
import { Prisma } from '@prisma/client';

export const projectBelongsToUser = async (projectId, userId) => {
    const project = await prisma.project.findFirst({
        where: { project_id: BigInt(projectId), user_id: userId },
        select: { project_id: true }
    });
    return !!project;
};

export const getTrendingKeywords = async ({ userId, projectId, fromYear, toYear, metric, limit }) => {
    let orderByClause = Prisma.sql`"articleCount" DESC, keyword ASC`;
    if (metric === 'citationCount') orderByClause = Prisma.sql`"citationCount" DESC, keyword ASC`;
    else if (metric === 'avgScore') orderByClause = Prisma.sql`"avgScore" DESC, keyword ASC`;

    const projectCondition = projectId ? Prisma.sql`AND p.project_id = ${BigInt(projectId)}` : Prisma.empty;
    const fromYearCondition = fromYear ? Prisma.sql`AND a.publication_year >= ${fromYear}` : Prisma.empty;
    const toYearCondition = toYear ? Prisma.sql`AND a.publication_year <= ${toYear}` : Prisma.empty;
    const fromYearJournalCondition = fromYear ? Prisma.sql`AND COALESCE(a.publication_year, i.publication_year, v.publication_year) >= ${fromYear}` : Prisma.empty;
    const toYearJournalCondition = toYear ? Prisma.sql`AND COALESCE(a.publication_year, i.publication_year, v.publication_year) <= ${toYear}` : Prisma.empty;

    const query = Prisma.sql`
        WITH scoped_projects AS (
            SELECT p.project_id, p.subject_area
            FROM "Project" p
            WHERE p.user_id = ${userId}::uuid
            ${projectCondition}
        ),
        scoped_journals AS (
            SELECT pj.journal_id
            FROM scoped_projects sp
            JOIN "Project_Journal" pj ON pj.project_id = sp.project_id
            UNION
            SELECT jsc.journal_id
            FROM scoped_projects sp
            JOIN "Subject_Category" sc ON sc.subject_area_id = sp.subject_area
            JOIN "Journal_Subject_Category" jsc ON jsc.subject_category_id = sc.subject_category_id
            WHERE sp.subject_area IS NOT NULL
        ),
        matched_articles AS (
            -- 1. Matched by project keywords
            SELECT a.article_id, a.citation_count
            FROM scoped_projects sp
            JOIN "Project_Keyword" pk ON pk.project_id = sp.project_id
            JOIN "Keyword_Article" ka ON ka.keyword_id = pk.keyword_id
            JOIN "Article" a ON a.article_id = ka.article_id
            WHERE (a.is_deleted = false OR a.is_deleted IS NULL)
                ${fromYearCondition}
                ${toYearCondition}

            UNION

            -- 2. Matched by project journals or subject area journals
            SELECT a.article_id, a.citation_count
            FROM scoped_journals sj
            JOIN "Volume" v ON v.journal_id = sj.journal_id
            JOIN "Issue" i ON i.volume_id = v.volume_id
            JOIN "Article" a ON a.issue_id = i.issue_id
            WHERE (a.is_deleted = false OR a.is_deleted IS NULL)
                ${fromYearJournalCondition}
                ${toYearJournalCondition}
        ),
        keyword_metrics AS (
            SELECT
                k.keyword_id,
                k.display_name AS keyword,
                COUNT(ma.article_id)::integer AS "articleCount",
                COALESCE(SUM(COALESCE(ma.citation_count, 0)), 0)::bigint AS "citationCount",
                COALESCE(AVG(ka.score), 0)::numeric AS "avgScore"
            FROM matched_articles ma
            JOIN "Keyword_Article" ka ON ka.article_id = ma.article_id
            JOIN "Keyword" k ON k.keyword_id = ka.keyword_id
            GROUP BY k.keyword_id, k.display_name
        )
        SELECT *
        FROM keyword_metrics
        ORDER BY ${orderByClause}
        LIMIT ${limit}::integer;
    `;

    const result = await prisma.$queryRaw(query);
    return result.map(row => ({
        ...row,
        citationCount: row.citationCount ? row.citationCount.toString() : '0'
    }));
};
