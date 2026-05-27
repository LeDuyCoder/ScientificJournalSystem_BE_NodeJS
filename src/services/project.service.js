import pool from '../config/database.js';

/**
 * Lấy danh sách các project của một user
 * @param {string} userId
 * @returns {Promise<Array>}
 */
export const getUserProjects = async (userId) => {
  const result = await pool.query(
    `SELECT project_id, title, subject_area, created_at 
     FROM "Project" 
     WHERE user_id = $1 
     ORDER BY created_at DESC`,
    [userId]
  );
  return result.rows;
};

/**
 * Lấy chi tiết một project bao gồm cấu hình Subject Area, Subject Categories và Journals
 * @param {string|number} projectId
 * @param {string} userId
 * @returns {Promise<Object|null>}
 */
export const getProjectById = async (projectId, userId) => {
  // 1. Lấy thông tin chung của project và Subject Area tương ứng
  const projectResult = await pool.query(
    `SELECT p.project_id, p.title, p.user_id, p.subject_area, p.created_at,
            sa.display_name as subject_area_name, sa.description as subject_area_description
     FROM "Project" p
     LEFT JOIN "Subject_Area" sa ON p.subject_area = sa.subject_area_id
     WHERE p.project_id = $1 AND p.user_id = $2`,
    [projectId, userId]
  );

  if (projectResult.rows.length === 0) {
    return null;
  }

  const project = projectResult.rows[0];

  // 2. Lấy danh sách Subject Category đã cấu hình
  const categoriesResult = await pool.query(
    `SELECT sc.subject_category_id, sc.display_name, sc.description, sc.subject_area_id
     FROM "Subject_Category_Project" psc
     JOIN "Subject_Category" sc ON psc.subject_category_id = sc.subject_category_id
     WHERE psc.project_id = $1`,
    [projectId]
  );

  // 3. Lấy danh sách Journal đã cấu hình
  const journalsResult = await pool.query(
    `SELECT j.journal_id, j.display_name, j.issn, j.type, j.is_open_access, j.homepage_url
     FROM "Project_Journal" pj
     JOIN "Journal" j ON pj.journal_id = j.journal_id
     WHERE pj.project_id = $1`,
    [projectId]
  );

  return {
    project_id: project.project_id,
    title: project.title,
    user_id: project.user_id,
    created_at: project.created_at,
    subject_area: project.subject_area ? {
      subject_area_id: project.subject_area,
      display_name: project.subject_area_name,
      description: project.subject_area_description
    } : null,
    subject_categories: categoriesResult.rows,
    journals: journalsResult.rows
  };
};

/**
 * Helper để kiểm tra ID có tồn tại trong bảng tương ứng
 */
const validateIdsExist = async (ids, tableName, idColumnName) => {
  if (!ids || ids.length === 0) return true;
  // Loại bỏ các ID trùng lặp
  const uniqueIds = [...new Set(ids)];
  
  // Thực hiện truy vấn để kiểm tra xem các ID có tồn tại không
  const query = `
    SELECT ${idColumnName} 
    FROM "${tableName}" 
    WHERE ${idColumnName} = ANY($1::bigint[])
  `;
  const result = await pool.query(query, [uniqueIds]);
  return result.rows.length === uniqueIds.length;
};

/**
 * Tạo project mới
 */
export const createProject = async ({ userId, title, subject_area, subject_category_ids = [], journal_ids = [] }) => {
  // 1. Kiểm tra sự tồn tại của subject_area
  if (subject_area) {
    const areaCheck = await pool.query(
      `SELECT 1 FROM "Subject_Area" WHERE subject_area_id = $1`,
      [subject_area]
    );
    if (areaCheck.rows.length === 0) {
      throw new Error(`Subject Area ID '${subject_area}' không tồn tại`);
    }
  }

  // 2. Kiểm tra sự tồn tại của tất cả subject_category_ids
  if (subject_category_ids.length > 0) {
    const categoriesValid = await validateIdsExist(subject_category_ids, 'Subject_Category', 'subject_category_id');
    if (!categoriesValid) {
      throw new Error('Một hoặc nhiều Subject Category ID không tồn tại trong hệ thống');
    }
  }

  // 3. Kiểm tra sự tồn tại của tất cả journal_ids
  if (journal_ids.length > 0) {
    const journalsValid = await validateIdsExist(journal_ids, 'Journal', 'journal_id');
    if (!journalsValid) {
      throw new Error('Một hoặc nhiều Journal ID không tồn tại trong hệ thống');
    }
  }

  // 4. Bắt đầu transaction để lưu dữ liệu
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Thêm bản ghi vào bảng Project
    const projectInsertResult = await client.query(
      `INSERT INTO "Project" (user_id, title, subject_area) 
       VALUES ($1, $2, $3) 
       RETURNING project_id, user_id, title, subject_area, created_at`,
      [userId, title, subject_area || null]
    );
    const newProject = projectInsertResult.rows[0];
    const projectId = newProject.project_id;

    // Thêm các liên kết vào bảng trung gian Subject_Category_Project
    if (subject_category_ids.length > 0) {
      const uniqueCategoryIds = [...new Set(subject_category_ids)];
      for (const catId of uniqueCategoryIds) {
        await client.query(
          `INSERT INTO "Subject_Category_Project" (project_id, subject_category_id) VALUES ($1, $2)`,
          [projectId, catId]
        );
      }
    }

    // Thêm các liên kết vào bảng trung gian Project_Journal
    if (journal_ids.length > 0) {
      const uniqueJournalIds = [...new Set(journal_ids)];
      for (const journalId of uniqueJournalIds) {
        await client.query(
          `INSERT INTO "Project_Journal" (project_id, journal_id) VALUES ($1, $2)`,
          [projectId, journalId]
        );
      }
    }

    await client.query('COMMIT');
    return newProject;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Cập nhật thông tin project
 */
export const updateProject = async (projectId, userId, { title, subject_area, subject_category_ids, journal_ids }) => {
  // 1. Kiểm tra xem project có tồn tại và thuộc sở hữu của user không
  const projectCheck = await pool.query(
    `SELECT 1 FROM "Project" WHERE project_id = $1 AND user_id = $2`,
    [projectId, userId]
  );
  if (projectCheck.rows.length === 0) {
    return null;
  }

  // 2. Kiểm tra sự tồn tại của subject_area nếu được truyền vào
  if (subject_area) {
    const areaCheck = await pool.query(
      `SELECT 1 FROM "Subject_Area" WHERE subject_area_id = $1`,
      [subject_area]
    );
    if (areaCheck.rows.length === 0) {
      throw new Error(`Subject Area ID '${subject_area}' không tồn tại`);
    }
  }

  // 3. Kiểm tra sự tồn tại của tất cả subject_category_ids nếu được truyền vào
  if (subject_category_ids && subject_category_ids.length > 0) {
    const categoriesValid = await validateIdsExist(subject_category_ids, 'Subject_Category', 'subject_category_id');
    if (!categoriesValid) {
      throw new Error('Một hoặc nhiều Subject Category ID không tồn tại trong hệ thống');
    }
  }

  // 4. Kiểm tra sự tồn tại của tất cả journal_ids nếu được truyền vào
  if (journal_ids && journal_ids.length > 0) {
    const journalsValid = await validateIdsExist(journal_ids, 'Journal', 'journal_id');
    if (!journalsValid) {
      throw new Error('Một hoặc nhiều Journal ID không tồn tại trong hệ thống');
    }
  }

  // 5. Bắt đầu transaction để cập nhật dữ liệu
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Cập nhật thông tin cơ bản của project
    await client.query(
      `UPDATE "Project" 
       SET title = COALESCE($1, title), 
           subject_area = $2
       WHERE project_id = $3 AND user_id = $4`,
      [title, subject_area || null, projectId, userId]
    );

    // Cập nhật quan hệ Subject Category nếu mảng được truyền vào
    if (subject_category_ids) {
      // Xóa các quan hệ cũ
      await client.query(`DELETE FROM "Subject_Category_Project" WHERE project_id = $1`, [projectId]);
      
      // Thêm các quan hệ mới
      if (subject_category_ids.length > 0) {
        const uniqueCategoryIds = [...new Set(subject_category_ids)];
        for (const catId of uniqueCategoryIds) {
          await client.query(
            `INSERT INTO "Subject_Category_Project" (project_id, subject_category_id) VALUES ($1, $2)`,
            [projectId, catId]
          );
        }
      }
    }

    // Cập nhật quan hệ Journal nếu mảng được truyền vào
    if (journal_ids) {
      // Xóa các quan hệ cũ
      await client.query(`DELETE FROM "Project_Journal" WHERE project_id = $1`, [projectId]);
      
      // Thêm các quan hệ mới
      if (journal_ids.length > 0) {
        const uniqueJournalIds = [...new Set(journal_ids)];
        for (const journalId of uniqueJournalIds) {
          await client.query(
            `INSERT INTO "Project_Journal" (project_id, journal_id) VALUES ($1, $2)`,
            [projectId, journalId]
          );
        }
      }
    }

    await client.query('COMMIT');
    return true;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Lấy dữ liệu phân tích / thống kê của một dự án (trending & comparison)
 * @param {string|number} projectId
 * @param {string} userId
 * @returns {Promise<Object|null>}
 */
export const getProjectAnalyticsData = async (projectId, userId) => {
  // 1. Kiểm tra xem project có tồn tại và thuộc sở hữu của user không
  const projectCheck = await pool.query(
    `SELECT 1 FROM "Project" WHERE project_id = $1 AND user_id = $2`,
    [projectId, userId]
  );
  if (projectCheck.rows.length === 0) {
    return null;
  }

  // 2. Chart 1: Xu hướng số lượng bài báo qua các năm
  const trendResult = await pool.query(
    `SELECT 
       a.publication_year AS year, 
       COUNT(a.article_id)::int AS article_count
     FROM "Article" a
     JOIN "Issue" i ON a.issue_id = i.issue_id
     JOIN "Volume" v ON i.volume_id = v.volume_id
     JOIN "Project_Journal" pj ON v.journal_id = pj.journal_id
     WHERE pj.project_id = $1 AND a.publication_year IS NOT NULL
     GROUP BY a.publication_year
     ORDER BY a.publication_year ASC`,
    [projectId]
  );

  // 3. Chart 2: So sánh thứ hạng/chỉ số giữa các Tạp chí trong Project
  const comparisonResult = await pool.query(
    `WITH latest_rankings AS (
       SELECT 
         jr.journal_id,
         jr.metric_id,
         jr.value_txt,
         jr.value_int,
         jr.value_float,
         jr.year,
         rm.code AS metric_code,
         rm.metric_type,
         j.display_name AS journal_name,
         ROW_NUMBER() OVER (
           PARTITION BY jr.journal_id, jr.metric_id 
           ORDER BY jr.year DESC, jr.created_at DESC
         ) as rn
       FROM "Journal_Ranking" jr
       JOIN "Ranking_Metric" rm ON jr.metric_id = rm.metric_id
       JOIN "Journal" j ON jr.journal_id = j.journal_id
       JOIN "Project_Journal" pj ON jr.journal_id = pj.journal_id
       WHERE pj.project_id = $1
     )
     SELECT 
       journal_name,
       metric_code,
       metric_type,
       value_txt,
       value_int,
       value_float,
       year
     FROM latest_rankings
     WHERE rn = 1
     ORDER BY journal_name ASC, metric_code ASC`,
    [projectId]
  );

  const journalMetrics = comparisonResult.rows.map(row => {
    let value = null;
    if (row.metric_type === 'QUARTILE') {
      value = row.value_txt;
    } else if (row.metric_type === 'INTEGER') {
      value = row.value_int !== null ? Number(row.value_int) : null;
    } else if (row.metric_type === 'SCORE') {
      value = row.value_float !== null ? Number(row.value_float) : null;
    }
    return {
      journal_name: row.journal_name,
      metric_code: row.metric_code,
      value: value
    };
  });

  return {
    article_volume_trend: trendResult.rows,
    journal_metrics_comparison: journalMetrics
  };
};

