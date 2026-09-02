import prisma from '../../lib/prisma.js';
import { Prisma } from '@prisma/client';

export const userExists = async (userId) => {
    const user = await prisma.user.findUnique({
        where: { user_id: userId },
        select: { user_id: true }
    });
    return !!user;
};

export const projectBelongsToUser = async (projectId, userId) => {
    const project = await prisma.project.findFirst({
        where: { project_id: BigInt(projectId), user_id: userId },
        select: { project_id: true }
    });
    return !!project;
};

export const getPublicationTrendsByUserProjects = async ({ userId, projectId, fromYear, toYear }) => {
    const projectCondition = projectId ? Prisma.sql`AND p.project_id = ${BigInt(projectId)}` : Prisma.empty;
    const fromYearCondition = fromYear ? Prisma.sql`AND ay.year >= ${fromYear}` : Prisma.empty;
    const toYearCondition = toYear ? Prisma.sql`AND ay.year <= ${toYear}` : Prisma.empty;

    const query = Prisma.sql`
        WITH scoped_projects AS (
            SELECT p.project_id, p.subject_area
            FROM "Project" p
            WHERE p.user_id = ${userId}
            ${projectCondition}
        ),
        matched_articles AS (
            SELECT a.article_id, a.publication_year, i.publication_year as issue_year, v.publication_year as vol_year, a.is_deleted
            FROM scoped_projects sp
            JOIN "Project_Keyword" pk ON pk.project_id = sp.project_id
            JOIN "Keyword_Article" ka ON ka.keyword_id = pk.keyword_id
            JOIN "Article" a ON a.article_id = ka.article_id
            JOIN "Issue" i ON i.issue_id = a.issue_id
            JOIN "Volume" v ON v.volume_id = i.volume_id
            UNION
            SELECT a.article_id, a.publication_year, i.publication_year as issue_year, v.publication_year as vol_year, a.is_deleted
            FROM scoped_projects sp
            JOIN "Project_Journal" pj ON pj.project_id = sp.project_id
            JOIN "Volume" v ON v.journal_id = pj.journal_id
            JOIN "Issue" i ON i.volume_id = v.volume_id
            JOIN "Article" a ON a.issue_id = i.issue_id
            UNION
            SELECT a.article_id, a.publication_year, i.publication_year as issue_year, v.publication_year as vol_year, a.is_deleted
            FROM scoped_projects sp
            JOIN "Subject_Category" sc ON sc.subject_area_id = sp.subject_area
            JOIN "Journal_Subject_Category" jsc ON jsc.subject_category_id = sc.subject_category_id
            JOIN "Volume" v ON v.journal_id = jsc.journal_id
            JOIN "Issue" i ON i.volume_id = v.volume_id
            JOIN "Article" a ON a.issue_id = i.issue_id
            WHERE sp.subject_area IS NOT NULL
        ),
        article_years AS (
            SELECT DISTINCT
                article_id,
                COALESCE(publication_year, issue_year, vol_year)::integer AS year
            FROM matched_articles
            WHERE (is_deleted = false OR is_deleted IS NULL)
                AND COALESCE(publication_year, issue_year, vol_year) IS NOT NULL
        )
        SELECT
            ay.year,
            COUNT(ay.article_id)::integer AS "totalPublications"
        FROM article_years ay
        WHERE 1=1
        ${fromYearCondition}
        ${toYearCondition}
        GROUP BY ay.year
        ORDER BY ay.year ASC;
    `;

    return prisma.$queryRaw(query);
};
