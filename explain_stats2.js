import pkg from 'pg';
const { Client } = pkg;

const client = new Client({
    connectionString: "postgresql://admin:SWP391%40Team2026@42.96.16.203:5432/postgres?sslmode=disable"
});

async function run() {
    await client.connect();
    console.log("Connected");

    const query = `
        EXPLAIN ANALYZE SELECT COUNT(*) AS total FROM "Article" WHERE is_deleted = false;
        
        EXPLAIN ANALYZE SELECT COUNT(a."article_id") 
        FROM "Article" a
        JOIN "Issue" i ON i."issue_id" = a."issue_id"
        JOIN "Volume" v ON v."volume_id" = i."volume_id"
        JOIN "Journal" j ON j."journal_id" = v."journal_id"
        WHERE a."is_deleted" = false AND j."is_open_access" = true;

        EXPLAIN ANALYZE SELECT COUNT(DISTINCT "author_id") FROM "Author_Article";

        EXPLAIN ANALYZE SELECT COUNT(DISTINCT "primary_topic") FROM "Article" WHERE "is_deleted" = false AND "primary_topic" IS NOT NULL;
    `;

    try {
        const res = await client.query(query);
        const results = Array.isArray(res) ? res : [res];
        for (let r of results) {
            for (let row of r.rows) {
                console.log(row['QUERY PLAN']);
            }
            console.log('---');
        }
    } catch (e) {
        console.error(e);
    } finally {
        await client.end();
    }
}

run();
