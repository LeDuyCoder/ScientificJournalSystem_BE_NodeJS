import prisma from '../../lib/prisma.js';
import cacheService from '../../services/cache.service.js';

const escapeRegex = (str) => {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

export const globalSearch = async (keyword, limit = 10) => {
    const trimmed = String(keyword || '').trim();
    if (!trimmed) {
        return [];
    }

    const normalizedKeyword = trimmed.toLowerCase();
    const cacheKey = `search:articles_by_area:${normalizedKeyword}:${limit}`;

    const cachedData = await cacheService.get(cacheKey);
    if (cachedData) {
        return cachedData;
    }

    const escaped = escapeRegex(trimmed);
    const boundaryStart = '(^|[^a-zA-Z0-9])';
    const boundaryEnd = '([^a-zA-Z0-9]|$)';
    const wordPrefixRegex = `${boundaryStart}${escaped}`;
    const exactWordRegex = `${boundaryStart}${escaped}${boundaryEnd}`;

    // Tokenize for PostgreSQL Full-Text Search (prefix matching per token)
    const words = trimmed
        .replace(/[^\p{L}\p{N}\s]/gu, ' ')
        .split(/\s+/)
        .filter(Boolean);

    const ftsQuery = words.length > 0
        ? words.map((w) => `${w.toLowerCase()}:*`).join(' & ')
        : '';

    const queryLimit = Math.max(Number(limit) || 10, 1);
    const fetchLimit = queryLimit * 2;

    const rawResults = await prisma.$queryRaw`
      WITH 
      -- 1. Check if keyword matches a Subject Area directly
      matched_areas AS (
        SELECT subject_area_id, display_name AS area_name
        FROM "Subject_Area"
        WHERE display_name ~* ${wordPrefixRegex}
      ),
      -- 2. Check if keyword matches Topics
      matched_topics AS (
        SELECT topic_id, display_name AS topic_name, subject_area_id
        FROM "Topic"
        WHERE display_name ~* ${wordPrefixRegex}
      ),
      -- 3. Check if keyword matches Keywords
      matched_keywords AS (
        SELECT k.keyword_id, ka.article_id
        FROM "Keyword" k
        JOIN "Keyword_Article" ka ON ka.keyword_id = k.keyword_id
        WHERE k.display_name ~* ${wordPrefixRegex}
        LIMIT 200
      ),
      -- 4. Candidate Articles matching Subject Area, Topic, Keyword, or Title
      candidate_articles AS (
        SELECT DISTINCT ON (LOWER(a.title))
          a.article_id,
          a.title,
          a.abstract,
          a.publication_year,
          a.doi,
          a.citation_count,
          a.issue_id,
          a.primary_topic,
          COALESCE(t.display_name, 'General') AS topic_name,
          sa.subject_area_id,
          COALESCE(sa.display_name, ma.area_name, 'Interdisciplinary') AS subject_area_name,
          CASE
            -- Title contains exact word
            WHEN a.title ~* ${exactWordRegex} THEN 1
            -- Title word starts with keyword
            WHEN a.title ~* ${wordPrefixRegex} THEN 2
            -- Matched Subject Area
            WHEN ma.subject_area_id IS NOT NULL THEN 3
            -- Keyword or Topic match
            WHEN mk.article_id IS NOT NULL OR mt.topic_id IS NOT NULL THEN 4
            -- Title FTS match
            WHEN ${ftsQuery !== ''} AND to_tsvector('english', a.title) @@ to_tsquery('english', ${ftsQuery}) THEN 5
            ELSE 6
          END AS priority
        FROM "Article" a
        LEFT JOIN "Topic" t ON t.topic_id = a.primary_topic
        LEFT JOIN "Subject_Area" sa ON sa.subject_area_id = t.subject_area_id
        LEFT JOIN matched_areas ma ON ma.subject_area_id = sa.subject_area_id
        LEFT JOIN matched_topics mt ON mt.topic_id = a.primary_topic
        LEFT JOIN matched_keywords mk ON mk.article_id = a.article_id
        WHERE a.is_deleted = false
          AND (
            ma.subject_area_id IS NOT NULL
            OR mt.topic_id IS NOT NULL
            OR mk.article_id IS NOT NULL
            OR (${ftsQuery !== ''} AND to_tsvector('english', a.title) @@ to_tsquery('english', ${ftsQuery}))
            OR a.title ~* ${wordPrefixRegex}
          )
        ORDER BY LOWER(a.title), priority ASC, a.citation_count DESC NULLS LAST
        LIMIT ${fetchLimit}
      ),
      -- 5. Authors for candidate articles
      candidates_authors AS (
        SELECT
          aa.article_id,
          json_agg(
            json_build_object(
              'id', au.author_id::text,
              'author_id', au.author_id::text,
              'name', au.display_name,
              'display_name', au.display_name
            )
          ) AS authors
        FROM "Author_Article" aa
        JOIN "Author" au ON au.author_id = aa.author_id AND (au.is_deleted = false OR au.is_deleted IS NULL)
        WHERE aa.article_id IN (SELECT article_id FROM candidate_articles)
        GROUP BY aa.article_id
      )
      SELECT
        ca.article_id::text AS id,
        ca.article_id::text,
        ca.title,
        ca.title AS name,
        'ARTICLE' AS type,
        ca.abstract,
        ca.publication_year,
        ca.doi,
        ca.citation_count::text,
        json_build_object(
          'id', j.journal_id::text,
          'journal_id', j.journal_id::text,
          'name', j.display_name,
          'display_name', j.display_name
        ) AS journal,
        json_build_object(
          'id', ca.subject_area_id::text,
          'subject_area_id', ca.subject_area_id::text,
          'name', ca.subject_area_name,
          'display_name', ca.subject_area_name
        ) AS subject_area,
        json_build_object(
          'id', ca.primary_topic::text,
          'topic_id', ca.primary_topic::text,
          'name', ca.topic_name,
          'display_name', ca.topic_name
        ) AS topic,
        COALESCE(ca_auth.authors, '[]'::json) AS authors,
        ca.priority
      FROM candidate_articles ca
      LEFT JOIN "Issue" i ON i.issue_id = ca.issue_id AND (i.is_deleted = false OR i.is_deleted IS NULL)
      LEFT JOIN "Volume" v ON v.volume_id = i.volume_id AND (v.is_deleted = false OR v.is_deleted IS NULL)
      LEFT JOIN "Journal" j ON j.journal_id = v.journal_id AND (j.is_deleted = false OR j.is_deleted IS NULL)
      LEFT JOIN candidates_authors ca_auth ON ca_auth.article_id = ca.article_id
      ORDER BY ca.priority ASC, ca.citation_count DESC NULLS LAST, ca.publication_year DESC NULLS LAST
      LIMIT ${queryLimit};
    `;

    const results = rawResults.map((item) => ({
        id: item.id,
        article_id: item.article_id,
        title: item.title,
        name: item.title,
        type: 'ARTICLE',
        abstract: item.abstract,
        publication_year: item.publication_year,
        doi: item.doi,
        citation_count: item.citation_count ? Number(item.citation_count) : 0,
        journal: item.journal?.id ? item.journal : null,
        subject_area: item.subject_area?.id ? item.subject_area : null,
        topic: item.topic?.id ? item.topic : null,
        authors: item.authors || []
    }));

    if (results.length > 0) {
        await cacheService.set(cacheKey, results, 300);
    }

    return results;
};
