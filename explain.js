import pkg from 'pg';
const { Client } = pkg;

const client = new Client({
    connectionString: "postgresql://admin:SWP391%40Team2026@42.96.16.203:5432/postgres?sslmode=disable"
});

async function run() {
    await client.connect();
    console.log("Connected");

    const query = `
        EXPLAIN ANALYZE
        SELECT
            a."article_id"::text,
            a."version",
            a."issue_id"::text,
            a."title",
            a."abstract",
            a."publication_year",
            a."doi",
            a."primary_topic"::text,
            t."display_name" AS "topic_name",
            a."created_at",
            j."journal_id"::text,
            j."display_name" AS "journal_name",
            j."issn" AS "journal_issn",
            COALESCE(j."is_open_access", false) AS "is_open_access",
            COALESCE(
                (
                    SELECT json_agg(json_build_object(
                        'author_id', au."author_id"::text,
                        'display_name', au."display_name"
                    ))
                    FROM "Author_Article" aa
                    JOIN "Author" au ON au."author_id" = aa."author_id"
                    WHERE aa."article_id" = a."article_id"
                      AND (au."is_deleted" = false OR au."is_deleted" IS NULL)
                ),
                '[]'::json
            ) AS "authors"
        FROM "Article" a
        LEFT JOIN "Issue" i   ON i."issue_id"   = a."issue_id" AND (i."is_deleted" = false OR i."is_deleted" IS NULL)
        LEFT JOIN "Volume" v  ON v."volume_id"  = i."volume_id" AND (v."is_deleted" = false OR v."is_deleted" IS NULL)
        LEFT JOIN "Journal" j ON j."journal_id" = v."journal_id" AND (j."is_deleted" = false OR j."is_deleted" IS NULL)
        LEFT JOIN "Topic" t   ON t."topic_id"   = a."primary_topic"
        WHERE a."is_deleted" = false
        ORDER BY a."created_at" DESC, a."article_id" DESC
        LIMIT 10 OFFSET 0;
    `;

    try {
        const res = await client.query(query);
        for (let row of res.rows) {
            console.log(row['QUERY PLAN']);
        }
    } catch (e) {
        console.error(e);
    } finally {
        await client.end();
    }
}

run();
