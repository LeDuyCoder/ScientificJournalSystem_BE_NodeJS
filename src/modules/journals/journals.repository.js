import pool from "../../config/database.js";
import logger from "../../utils/logger.js";
import cacheService from "../../services/cache.service.js"; // or move cache to a core module later
import crypto from "crypto";

export const getJournals = async (paramsInput = {}) => {
  const {
    search,
    page = 1,
    limit = 10,
    sort = 'relevance',
    subjectAreaIds,
    subjectCategoryIds,
    isOpenAccess,
    quartiles,
    rankingYear,
    isOaDiamond,
    countryIds,
    subject_area_id,
    publisher_id,
    sort_by,
    sort_order,
  } = paramsInput;

  const cacheKey = `journals:list:${crypto.createHash('md5').update(JSON.stringify(paramsInput)).digest('hex')}`;
  const cachedData = await cacheService.get(cacheKey);
  if (cachedData) return cachedData;

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.max(1, parseInt(limit, 10) || 10);
  const offset = (pageNum - 1) * limitNum;

  const values = [];
  const whereClauses = ['j.is_deleted = false'];

  const pushCsvFilter = (rawValue) => String(rawValue || '')
    .split(',')
    .map(value => value.trim())
    .filter(Boolean);

  if (search && search.trim() !== '') {
    const cacheKeySearch = `journals:search:${search.trim()}`;
    const cachedSearchData = await cacheService.get(cacheKeySearch);
    if (cachedSearchData) return cachedSearchData;

    values.push(`%${search.trim()}%`);
    whereClauses.push(`j.display_name ILIKE $${values.length}`);
  }

  const areaIds = pushCsvFilter(subjectAreaIds || subject_area_id);
  if (areaIds.length > 0) {
    values.push(areaIds);
    whereClauses.push(`EXISTS (
      SELECT 1
      FROM "Journal_Subject_Category" jsc
      INNER JOIN "Subject_Category" sc ON sc.subject_category_id = jsc.subject_category_id
      WHERE jsc.journal_id = j.journal_id
        AND sc.subject_area_id::text = ANY($${values.length}::text[])
    )`);
  }

  const categoryIds = pushCsvFilter(subjectCategoryIds);
  if (categoryIds.length > 0) {
    values.push(categoryIds);
    whereClauses.push(`EXISTS (
      SELECT 1
      FROM "Journal_Subject_Category" jsc
      WHERE jsc.journal_id = j.journal_id
        AND jsc.subject_category_id::text = ANY($${values.length}::text[])
    )`);
  }

  if (String(isOpenAccess) === 'true' || String(isOpenAccess) === 'false') {
    values.push(String(isOpenAccess) === 'true');
    whereClauses.push(`j.is_open_access = $${values.length}`);
  }

  if (isOaDiamond === true || String(isOaDiamond) === 'true') {
    whereClauses.push(`j.is_oa_diamond = true`);
  }

  if (publisher_id) {
    values.push(BigInt(publisher_id));
    whereClauses.push(`j.publisher_id = $${values.length}`);
  }

  const countryIdValues = pushCsvFilter(countryIds);
  if (countryIdValues.length > 0) {
    values.push(countryIdValues);
    whereClauses.push(`j.country::text = ANY($${values.length}::text[])`);
  }

  const yearNum = rankingYear ? parseInt(rankingYear, 10) : null;

  const quartileValues = pushCsvFilter(quartiles).map(q => q.toUpperCase());
  if (quartileValues.length > 0) {
    values.push(quartileValues);
    whereClauses.push(`EXISTS (
      SELECT 1
      FROM "Journal_Ranking" jr
      INNER JOIN "Ranking_Metric" rm ON rm.metric_id = jr.metric_id
      WHERE jr.journal_id = j.journal_id
        AND rm.metric_type = 'QUARTILE'
        AND UPPER(jr.value_txt) = ANY($${values.length}::text[])
        ${yearNum ? `AND jr.year = ${yearNum}` : ''}
    )`);
  }

  if (yearNum) {
    values.push(yearNum);
    whereClauses.push(`EXISTS (
      SELECT 1
      FROM "Journal_Ranking" jr
      INNER JOIN "Ranking_Metric" rm ON rm.metric_id = jr.metric_id
      WHERE jr.journal_id = j.journal_id
        AND UPPER(rm.code) = 'SJR'
        AND jr.year = $${values.length}
    )`);
  }

  const whereSql = `WHERE ${whereClauses.join(' AND ')}`;
  const baseQuery = `FROM "Journal" j ${whereSql}`;

  let finalQuery;

  if (sort === 'metric') {
    finalQuery = `
      WITH LatestSJR AS (
        SELECT DISTINCT ON (jr.journal_id)
          jr.journal_id, jr.value_float AS metric_value, jr.year AS metric_year
        FROM "Journal_Ranking" jr
        INNER JOIN "Ranking_Metric" rm ON rm.metric_id = jr.metric_id
        WHERE UPPER(rm.code) = 'SJR'
          ${yearNum ? `AND jr.year = ${yearNum}` : ''}
        ORDER BY jr.journal_id, jr.year DESC NULLS LAST
      ),
      FilteredJournals AS (
        SELECT 
          j.journal_id,
          j.display_name,
          ls.metric_value,
          ls.metric_year
        FROM "Journal" j
        LEFT JOIN LatestSJR ls ON ls.journal_id = j.journal_id
        ${whereSql}
      ),
      PagedJournals AS (
        SELECT *
        FROM FilteredJournals
        ORDER BY metric_value DESC NULLS LAST, display_name ASC
        LIMIT $${values.length + 1} OFFSET $${values.length + 2}
      )
      SELECT 
        j.journal_id::text AS journal_id,
        j.display_name,
        j.issn,
        j.type,
        j.coverage,
        j.is_open_access,
        j.is_oa_diamond,
        p.publisher_id::text AS publisher_id,
        p.display_name AS publisher_name,
        j.country::text AS country_id,
        country_zone.name AS country_name,
        pj.metric_value,
        pj.metric_year,
        latest_quartile.quartile,
        latest_quartile.quartile AS best_quartile,
        latest_quartile.quartile_year,
        (SELECT COUNT(*) FROM "Volume" v WHERE v.journal_id = j.journal_id AND v.is_deleted = false)::integer AS volume_count
      FROM PagedJournals pj
      JOIN "Journal" j ON j.journal_id = pj.journal_id
      LEFT JOIN "Publisher" p ON p.publisher_id = j.publisher_id
      LEFT JOIN "Zone" country_zone ON country_zone.zone_id = j.country
      LEFT JOIN LATERAL (
        SELECT jr.value_txt AS quartile, jr.year AS quartile_year
        FROM "Journal_Ranking" jr
        INNER JOIN "Ranking_Metric" rm ON rm.metric_id = jr.metric_id
        WHERE jr.journal_id = j.journal_id
          AND rm.metric_type = 'QUARTILE'
          AND jr.value_txt IS NOT NULL
          ${yearNum ? `AND jr.year = ${yearNum}` : ''}
        ORDER BY jr.year DESC NULLS LAST
        LIMIT 1
      ) latest_quartile ON true
      ORDER BY pj.metric_value DESC NULLS LAST, j.display_name ASC
    `;
  } else {
    let orderClause = 'ORDER BY display_name ASC';
    if (sort_by === 'display_name') {
      const order = (sort_order || 'ASC').toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
      orderClause = `ORDER BY display_name ${order}`;
    } else if (sort_by === 'volume_count') {
      const order = (sort_order || 'ASC').toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
      orderClause = `ORDER BY volume_count ${order}`;
    }

    finalQuery = `
      WITH PagedJournals AS (
        SELECT 
          j.journal_id
          ${sort_by === 'volume_count' ? `, (SELECT COUNT(*) FROM "Volume" v WHERE v.journal_id = j.journal_id AND v.is_deleted = false) AS volume_count` : ''}
        ${baseQuery}
        ${orderClause}
        LIMIT $${values.length + 1} OFFSET $${values.length + 2}
      )
      SELECT 
        j.journal_id::text AS journal_id,
        j.display_name,
        j.issn,
        j.type,
        j.coverage,
        j.is_open_access,
        j.is_oa_diamond,
        p.publisher_id::text AS publisher_id,
        p.display_name AS publisher_name,
        j.country::text AS country_id,
        country_zone.name AS country_name,
        latest_sjr.metric_value,
        latest_sjr.metric_year,
        latest_quartile.quartile,
        latest_quartile.quartile AS best_quartile,
        latest_quartile.quartile_year,
        ${sort_by === 'volume_count' ? 'pj.volume_count::integer' : '(SELECT COUNT(*) FROM "Volume" v WHERE v.journal_id = j.journal_id AND v.is_deleted = false)::integer'} AS volume_count
      FROM PagedJournals pj
      JOIN "Journal" j ON j.journal_id = pj.journal_id
      LEFT JOIN "Publisher" p ON p.publisher_id = j.publisher_id
      LEFT JOIN "Zone" country_zone ON country_zone.zone_id = j.country
      LEFT JOIN LATERAL (
        SELECT jr.value_float AS metric_value, jr.year AS metric_year
        FROM "Journal_Ranking" jr
        INNER JOIN "Ranking_Metric" rm ON rm.metric_id = jr.metric_id
        WHERE jr.journal_id = j.journal_id
          AND UPPER(rm.code) = 'SJR'
          ${yearNum ? `AND jr.year = ${yearNum}` : ''}
        ORDER BY jr.year DESC NULLS LAST
        LIMIT 1
      ) latest_sjr ON true
      LEFT JOIN LATERAL (
        SELECT jr.value_txt AS quartile, jr.year AS quartile_year
        FROM "Journal_Ranking" jr
        INNER JOIN "Ranking_Metric" rm ON rm.metric_id = jr.metric_id
        WHERE jr.journal_id = j.journal_id
          AND rm.metric_type = 'QUARTILE'
          AND jr.value_txt IS NOT NULL
          ${yearNum ? `AND jr.year = ${yearNum}` : ''}
        ORDER BY jr.year DESC NULLS LAST
        LIMIT 1
      ) latest_quartile ON true
      ${orderClause.replace('ORDER BY ', 'ORDER BY ' + (sort_by === 'volume_count' ? 'pj.' : 'j.'))}
    `;
  }

  const countQuery = `
    SELECT COUNT(*)::integer AS total
    FROM "Journal" j
    ${whereSql}
  `;

  const [itemsRes, countRes] = await Promise.all([
    pool.query(finalQuery, [...values, limitNum, offset]),
    pool.query(countQuery, values)
  ]);

  const result = {
    items: itemsRes.rows,
    total: countRes.rows[0]?.total || 0
  };

  await cacheService.set(cacheKey, result, 300);

  return result;
};

export const getJournalsById = async (id) => {
  try {
    const cacheKey = `journal:detail:${id}`;
    const cachedData = await cacheService.get(cacheKey);
    if (cachedData) return cachedData;

    const query = `
      SELECT
        j.journal_id::text AS journal_id,
        j.source_id,
        j.display_name,
        j.issn,
        j.type,
        j.coverage,
        j.coverage AS description,
        j.is_open_access,
        j.is_oa_diamond,
        p.publisher_id::text AS publisher_id,
        p.display_name AS publisher_name,
        p.image_url AS publisher_image_url,
        country_zone.zone_id::text AS country_id,
        country_zone.name AS country_name,
        country_zone.code AS country_code,
        country_zone.iso_code AS country_iso_code,
        region_zone.zone_id::text AS region_id,
        region_zone.name AS region_name,
        region_zone.code AS region_code,
        NULLIF(substring(j.coverage from '([0-9]{4})'), '')::int AS established_year
      FROM "Journal" j
      LEFT JOIN "Publisher" p ON p.publisher_id = j.publisher_id
      LEFT JOIN "Zone" country_zone ON country_zone.zone_id = j.country
      LEFT JOIN "Zone" region_zone ON region_zone.zone_id = j.region
      WHERE j.journal_id = $1 AND j.is_deleted = false
    `;

    const [journalRes, metricsRes, categoriesRes] = await Promise.all([
      pool.query(query, [id]),
      pool.query(`
        SELECT DISTINCT ON (UPPER(rm.code))
          UPPER(rm.code) AS metric_code,
          rm.display_name AS metric_name,
          rm.metric_type,
          jr.year,
          jr.value_txt,
          jr.value_int,
          jr.value_float
        FROM "Journal_Ranking" jr
        INNER JOIN "Ranking_Metric" rm ON rm.metric_id = jr.metric_id
        WHERE jr.journal_id = $1
        ORDER BY UPPER(rm.code), jr.year DESC NULLS LAST
      `, [id]),
      pool.query(`
        SELECT
          sc.subject_category_id::text AS id,
          sc.display_name,
          sc.subject_area_id::text AS subject_area_id
        FROM "Journal_Subject_Category" jsc
        INNER JOIN "Subject_Category" sc ON sc.subject_category_id = jsc.subject_category_id
        WHERE jsc.journal_id = $1 AND COALESCE(sc.is_deleted, false) = false
        ORDER BY sc.display_name ASC
        LIMIT 12
      `, [id])
    ]);

    if (journalRes.rows.length === 0) {
      return null;
    }

    const journal = journalRes.rows[0];
    const metrics = metricsRes.rows;
    const findMetric = (...codes) => metrics.find(metric => codes.includes(metric.metric_code));
    const metricValue = (metric) => {
      if (!metric) return null;
      if (metric.value_float !== null && metric.value_float !== undefined) return Number(metric.value_float);
      if (metric.value_int !== null && metric.value_int !== undefined) return Number(metric.value_int);
      return metric.value_txt ?? null;
    };

    const sjrMetric = findMetric('SJR');
    const hIndexMetric = findMetric('H_INDEX', 'H-INDEX', 'HINDEX');
    const citeScoreMetric = findMetric('CITE_SCORE', 'CITESCORE', 'CITE SCORE');
    const quartileMetric = metrics.find(metric => metric.metric_type === 'QUARTILE' && metric.value_txt);

    const result = {
      ...journal,
      description: journal.description,
      subject_categories: categoriesRes.rows,
      quartile: quartileMetric?.value_txt || null,
      metric_value: metricValue(sjrMetric),
      metric_name: sjrMetric?.metric_name || 'SJR Score',
      metric_year: sjrMetric?.year ? String(sjrMetric.year) : null,
      h_index: metricValue(hIndexMetric),
      cite_score: metricValue(citeScoreMetric),
      latest_metrics: {
        year: sjrMetric?.year || hIndexMetric?.year || citeScoreMetric?.year || quartileMetric?.year || null,
        sjr: metricValue(sjrMetric),
        h_index: metricValue(hIndexMetric),
        cite_score: metricValue(citeScoreMetric),
        quartile: quartileMetric?.value_txt || null,
      }
    };

    await cacheService.set(cacheKey, result, 900);
    return result;
  } catch (error) {
    logger.error('Lỗi khi lấy chi tiết journal:', error);
    throw error;
  }
};

export const journalExist = async (id) => {
  try {
    const query = `SELECT 1 FROM "Journal" WHERE journal_id = $1`;
    const result = await pool.query(query, [id]);
    return result.rows.length > 0;
  } catch (error) {
    logger.error(`Lỗi khi kiểm tra tồn tại của journal với ID ${id}:`, error.message);
    throw error;
  }
};

export const createJournal = async (data) => {
  try {
    let {
      source_id, publisher_id, country, region, display_name,
      type, is_open_access, is_oa_diamond, coverage, issn, scope_detail, description
    } = data;

    source_id = source_id || null;
    publisher_id = publisher_id || null;
    country = country || null;
    region = region || null;
    display_name = display_name || null;
    type = type || null;
    is_open_access = is_open_access ?? null;
    is_oa_diamond = is_oa_diamond ?? null;
    coverage = coverage || scope_detail || description || null;
    issn = issn || null;
    const is_deleted = false;

    const query = `
        INSERT INTO "Journal" (
            source_id, publisher_id, country, region, display_name,
            type, is_open_access, is_oa_diamond, coverage, issn, is_deleted
        ) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *;
    `;

    const values = [
      source_id,
      publisher_id ? BigInt(publisher_id) : null,
      country ? BigInt(country) : null,
      region ? BigInt(region) : null,
      display_name, type, is_open_access, is_oa_diamond, coverage, issn, is_deleted
    ];

    const result = await pool.query(query, values);

    // invalidateCacheByPattern is not imported here, doing cacheService.delByPattern
    cacheService.delByPattern('journals:list:*').catch(() => { });

    return result.rows[0];
  } catch (error) {
    throw error;
  }
};

export const updateJournal = async (id, data) => {
  try {
    const normalizedData = { ...data };
    if (normalizedData.coverage === undefined) {
      normalizedData.coverage = normalizedData.scope_detail ?? normalizedData.description;
    }

    const allowedFields = [
      'source_id', 'publisher_id', 'country', 'region', 'display_name',
      'type', 'is_open_access', 'is_oa_diamond', 'coverage', 'issn'
    ];

    const updateParts = [];
    const values = [];
    let placeholderIndex = 1;

    for (const field of allowedFields) {
      if (normalizedData[field] !== undefined && normalizedData[field] !== null) {
        let value = normalizedData[field];

        if (['publisher_id', 'country', 'region'].includes(field)) {
          value = BigInt(value);
        }

        updateParts.push(`"${field}" = $${placeholderIndex}`);
        values.push(value);
        placeholderIndex++;
      }
    }

    if (updateParts.length === 0) {
      logger.warn(`Không có trường nào hợp lệ để cập nhật cho journal ID ${id}`);
      return null;
    }

    values.push(BigInt(id));
    const idPlaceholder = `$${placeholderIndex}`;

    const query = `
        UPDATE "Journal" 
        SET ${updateParts.join(', ')}
        WHERE journal_id = ${idPlaceholder} AND is_deleted = false
        RETURNING *;
    `;

    const result = await pool.query(query, values);
    if (result.rows.length) {
      await cacheService.delByPattern('journals:list:*');
      return result.rows[0];
    }
    return null;
  } catch (error) {
    logger.error(`Lỗi khi cập nhật động journal với ID ${id}:`, error.message);
    throw error;
  }
};

export const deleteJournal = async (id) => {
  try {
    const query = `
      UPDATE "Journal"
      SET is_deleted = true
      WHERE journal_id = $1 AND is_deleted = false
      RETURNING *;
    `;
    const result = await pool.query(query, [BigInt(id)]);

    if (result.rows.length) {
      await cacheService.delByPattern('journals:list:*');
      return result.rows[0];
    }
    return null;
  } catch (error) {
    logger.error(`Lỗi khi xóa journal với ID ${id}:`, error.message);
    throw error;
  }
};

export const restoreJournal = async (id) => {
  try {
    const query = `
      UPDATE "Journal"
      SET is_deleted = false
      WHERE journal_id = $1 AND is_deleted = true
      RETURNING *;
    `;
    const result = await pool.query(query, [BigInt(id)]);
    if (result.rows.length) {
      await cacheService.delByPattern('journals:list:*');
      return result.rows[0];
    }
    return null;
  } catch (error) {
    logger.error(`Lỗi khi khôi phục journal với ID ${id}:`, error.message);
    throw error;
  }
};

export const getJournalRepositorySummary = async (journalId) => {
  try {
    const id = BigInt(journalId);

    const query = `
      SELECT 
        (
          SELECT COUNT(*)::integer 
          FROM "Volume" 
          WHERE journal_id = $1 AND is_deleted = false
        ) AS total_volumes,
        
        (
          SELECT COUNT(i.issue_id)::integer 
          FROM "Issue" i
          JOIN "Volume" v ON i.volume_id = v.volume_id
          WHERE v.journal_id = $1 AND i.is_deleted = false
        ) AS active_issues,
        
        (
          SELECT COUNT(a.article_id)::integer 
          FROM "Article" a
          JOIN "Issue" i ON a.issue_id = i.issue_id
          JOIN "Volume" v ON i.volume_id = v.volume_id
          WHERE v.journal_id = $1 AND a.is_deleted = false
        ) AS total_publications,
        
        (
          SELECT MIN(i.publication_year)::integer 
          FROM "Issue" i
          JOIN "Volume" v ON i.volume_id = v.volume_id
          WHERE v.journal_id = $1 AND i.is_deleted = false AND i.publication_year > EXTRACT(YEAR FROM NOW())
        ) AS next_release;
    `;

    const result = await pool.query(query, [id]);

    return result.rows[0] || {
      total_volumes: 0,
      active_issues: 0,
      total_publications: 0,
      next_release: null
    };

  } catch (error) {
    logger.error(`Lỗi khi lấy repository summary cho journal ID ${journalId}:`, error);
    throw error;
  }
};
