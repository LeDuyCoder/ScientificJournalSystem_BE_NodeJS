import pg from 'pg';
const { Client } = pg;

const connectionString = "postgresql://postgres.egyrzaqtmxmcezxchfrl:TeamSWP3912006@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres";

async function main() {
  const client = new Client({ connectionString });
  await client.connect();
  
  console.log("Querying for articles with at least 1 author:");
  const res = await client.query(`
    SELECT aa.article_id, a.title, count(aa.author_id) as author_count
    FROM "Author_Article" aa
    JOIN "Article" a ON aa.article_id = a.article_id
    GROUP BY aa.article_id, a.title
    ORDER BY author_count DESC
    LIMIT 20
  `);
  console.log(JSON.stringify(res.rows, null, 2));

  console.log("\nChecking details for some specific article (e.g. article_id = 9983):");
  const resDetail = await client.query(`
    SELECT a.article_id, a.title, auth.display_name
    FROM "Article" a
    LEFT JOIN "Author_Article" aa ON a.article_id = aa.article_id
    LEFT JOIN "Author" auth ON aa.author_id = auth.author_id
    WHERE a.article_id = 9983
  `);
  console.log(JSON.stringify(resDetail.rows, null, 2));
  
  await client.end();
}

main().catch(console.error);
