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
            COUNT(DISTINCT a."article_id")::integer AS "totalArticles",
            COUNT(DISTINCT a."article_id") FILTER (WHERE j."is_open_access" = true)::integer AS "openAccessCount",
            COUNT(DISTINCT aa."author_id")::integer AS "authorsCount",
            COUNT(DISTINCT a."primary_topic") FILTER (WHERE a."primary_topic" IS NOT NULL)::integer AS "topicsCount"
        FROM "Article" a
        LEFT JOIN "Issue" i ON i."issue_id" = a."issue_id" AND (i."is_deleted" = false OR i."is_deleted" IS NULL)
        LEFT JOIN "Volume" v ON v."volume_id" = i."volume_id" AND (v."is_deleted" = false OR v."is_deleted" IS NULL)
        LEFT JOIN "Journal" j ON j."journal_id" = v."journal_id" AND (j."is_deleted" = false OR j."is_deleted" IS NULL)
        LEFT JOIN "Author_Article" aa ON aa."article_id" = a."article_id"
        WHERE a."is_deleted" = false;
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
