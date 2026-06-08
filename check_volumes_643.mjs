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
    // 1. Check volumes for journal_id=643
    const volRes = await pool.query(
      `SELECT v.volume_id::text, v.journal_id::text, v.volume_number, v.publication_year, v.is_deleted
       FROM "Volume" v
       WHERE v.journal_id = $1
       ORDER BY v.publication_year DESC NULLS LAST
       LIMIT 20`,
      [643]
    );
    console.log('=== Volumes for journal_id=643 ===');
    console.log(JSON.stringify(volRes.rows, null, 2));
    console.log(`Total: ${volRes.rows.length}`);

    // 2. If no volumes, try joining from Journal
    if (volRes.rows.length === 0) {
      console.log('\n=== Trying JOIN from Journal -> Volume ===');
      const joinRes = await pool.query(
        `SELECT j.journal_id::text as j_id, j.display_name,
                v.volume_id::text, v.volume_number, v.publication_year, v.is_deleted
         FROM "Journal" j
         LEFT JOIN "Volume" v ON v.journal_id = j.journal_id
         WHERE j.journal_id = $1
         LIMIT 20`,
        [643]
      );
      console.log(JSON.stringify(joinRes.rows, null, 2));
    }

    // 3. Check total volumes in DB
    const totalRes = await pool.query(`SELECT COUNT(*)::integer AS total FROM "Volume"`);
    console.log(`\n=== Total volumes in DB: ${totalRes.rows[0].total} ===`);

    // 4. Top 10 journals with most volumes
    const sampleRes = await pool.query(
      `SELECT journal_id::text, COUNT(*)::integer AS vol_count
       FROM "Volume"
       WHERE is_deleted = false
       GROUP BY journal_id
       ORDER BY vol_count DESC
       LIMIT 10`
    );
    console.log('\n=== Top 10 journals by volume count ===');
    console.log(JSON.stringify(sampleRes.rows, null, 2));

    // 5. Check if journal 643 has volumes that are soft-deleted
    const deletedRes = await pool.query(
      `SELECT volume_id::text, journal_id::text, volume_number, is_deleted
       FROM "Volume"
       WHERE journal_id = $1`,
      [643]
    );
    console.log('\n=== ALL volumes for journal 643 (including deleted) ===');
    console.log(JSON.stringify(deletedRes.rows, null, 2));

  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await pool.end();
  }
}

main();
