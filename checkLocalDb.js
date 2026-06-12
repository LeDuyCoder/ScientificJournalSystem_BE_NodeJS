import pkg from 'pg';
const { Pool } = pkg;

async function checkLocalDb() {
  const pool = new Pool({
    user: 'postgres',
    password: '123', // let's try '123' and '1234'
    host: 'localhost',
    port: 5433,
    database: 'scientific_journal_db'
  });

  try {
    const res = await pool.query('SELECT NOW()');
    console.log('Successfully connected to local PG on port 5433:', res.rows[0].now);

    const tablesRes = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    
    console.log('Tables in local database:');
    for (const row of tablesRes.rows) {
      const countRes = await pool.query(`SELECT COUNT(*)::integer AS count FROM "${row.table_name}"`);
      console.log(`- ${row.table_name}: ${countRes.rows[0].count} rows`);
    }
  } catch (err) {
    console.log('Failed to connect to local PG with password 123:', err.message);
    
    // Try password 1234
    try {
      const pool2 = new Pool({
        user: 'postgres',
        password: '1234',
        host: 'localhost',
        port: 5433,
        database: 'scientific_journal_db'
      });
      const res = await pool2.query('SELECT NOW()');
      console.log('Successfully connected to local PG on port 5433 with password 1234:', res.rows[0].now);
      
      const tablesRes = await pool2.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        ORDER BY table_name;
      `);
      
      console.log('Tables in local database:');
      for (const row of tablesRes.rows) {
        const countRes = await pool2.query(`SELECT COUNT(*)::integer AS count FROM "${row.table_name}"`);
        console.log(`- ${row.table_name}: ${countRes.rows[0].count} rows`);
      }
      await pool2.end();
    } catch (err2) {
      console.log('Failed with password 1234 too:', err2.message);
    }
  } finally {
    try { await pool.end(); } catch (e) {}
  }
}

checkLocalDb();
