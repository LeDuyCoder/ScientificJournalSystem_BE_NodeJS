import pool from './src/config/database.js';

async function diagnose() {
  try {
    // 1. Get all tables in public schema
    const tablesRes = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    
    console.log('Tables in database:');
    for (const row of tablesRes.rows) {
      const countRes = await pool.query(`SELECT COUNT(*)::integer AS count FROM "${row.table_name}"`);
      console.log(`- ${row.table_name}: ${countRes.rows[0].count} rows`);
    }
  } catch (err) {
    console.error('DIAGNOSE ERROR:', err);
  } finally {
    await pool.end();
  }
}

diagnose();
