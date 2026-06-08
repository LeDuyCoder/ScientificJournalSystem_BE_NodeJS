import dotenv from 'dotenv';
dotenv.config({ path: 'e:/Scientific_Journal_Publication_Trend_Tracking_System/ScientificJournalSystem_BE_NodeJS/.env' });

import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  ssl: false,
  max: 5,
  connectionTimeoutMillis: 10000,
});

async function main() {
  try {
    const journal = await pool.query(`
      SELECT journal_id::text, source_id, display_name, issn, publisher_id::text, coverage
      FROM "Journal"
      WHERE journal_id = $1
    `, [643]);

    console.log('=== Journal 643 ===');
    console.log(JSON.stringify(journal.rows, null, 2));

    const j = journal.rows[0];
    if (!j) return;

    const sameName = await pool.query(`
      SELECT j.journal_id::text, j.source_id, j.display_name, j.issn,
             COUNT(v.volume_id)::integer AS volume_count
      FROM "Journal" j
      LEFT JOIN "Volume" v ON v.journal_id = j.journal_id AND COALESCE(v.is_deleted, false) = false
      WHERE LOWER(j.display_name) = LOWER($1)
         OR j.issn = $2
         OR j.source_id = $3
      GROUP BY j.journal_id, j.source_id, j.display_name, j.issn
      ORDER BY volume_count DESC, j.journal_id::bigint ASC
    `, [j.display_name, j.issn, j.source_id]);

    console.log('\n=== Same name / ISSN / source_id journals ===');
    console.log(JSON.stringify(sameName.rows, null, 2));

    const fuzzy = await pool.query(`
      SELECT j.journal_id::text, j.source_id, j.display_name, j.issn,
             COUNT(v.volume_id)::integer AS volume_count
      FROM "Journal" j
      LEFT JOIN "Volume" v ON v.journal_id = j.journal_id AND COALESCE(v.is_deleted, false) = false
      WHERE j.display_name ILIKE '%' || $1 || '%'
      GROUP BY j.journal_id, j.source_id, j.display_name, j.issn
      ORDER BY volume_count DESC, j.journal_id::bigint ASC
      LIMIT 20
    `, ['Current Obesity']);

    console.log('\n=== Fuzzy Current Obesity journals ===');
    console.log(JSON.stringify(fuzzy.rows, null, 2));

    const volumes643 = await pool.query(`
      SELECT v.volume_id::text, v.journal_id::text, v.volume_number, v.publication_year,
             COUNT(i.issue_id)::integer AS issue_count
      FROM "Volume" v
      LEFT JOIN "Issue" i ON i.volume_id = v.volume_id AND COALESCE(i.is_deleted, false) = false
      WHERE v.journal_id = $1
      GROUP BY v.volume_id, v.journal_id, v.volume_number, v.publication_year
      ORDER BY v.publication_year DESC NULLS LAST
    `, [643]);

    console.log('\n=== Volumes for 643 with issues ===');
    console.log(JSON.stringify(volumes643.rows, null, 2));
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await pool.end();
  }
}

main();
