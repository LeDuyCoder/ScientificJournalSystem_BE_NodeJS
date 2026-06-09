import pool from './src/config/database.js';

async function test() {
  try {
    const statsQuery = `
      SELECT 
        z.zone_id,
        z.code,
        z.name,
        z.iso_code,
        z.source,
        z.created_at,
        COUNT(a.article_id)::integer AS article_count
      FROM "Zone" z
      LEFT JOIN "Journal" j ON j.country = z.zone_id
      LEFT JOIN "Volume" v ON v.journal_id = j.journal_id
      LEFT JOIN "Issue" i ON i.volume_id = v.volume_id
      LEFT JOIN "Article" a ON a.issue_id = i.issue_id
      WHERE z.type = 'COUNTRY'
      GROUP BY z.zone_id, z.code, z.name, z.iso_code, z.source, z.created_at
      ORDER BY article_count DESC, z.name ASC
      LIMIT 1000 OFFSET 0;
    `;
    const result = await pool.query(statsQuery);
    const codes = {};
    result.rows.forEach((r, idx) => {
      const code = r.code;
      if (codes[code]) {
        codes[code].push({ name: r.name, zone_id: r.zone_id, rank: idx + 1 });
      } else {
        codes[code] = [{ name: r.name, zone_id: r.zone_id, rank: idx + 1 }];
      }
    });
    
    Object.keys(codes).forEach(code => {
      if (codes[code].length > 1) {
        console.log(`Duplicate code ${code}:`, codes[code]);
      }
    });
  } catch (err) {
    console.error('DB ERROR:', err);
  } finally {
    await pool.end();
  }
}

test();
