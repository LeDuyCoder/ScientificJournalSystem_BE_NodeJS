import meiliClient, { getMeiliAvailability } from '../config/meilisearch.js';
import pool from '../config/database.js';
import logger from '../utils/logger.js';

const ARTICLE_INDEX = 'articles';
const GLOBAL_SEARCH_INDEX = 'global_search';

export const initMeiliSearch = async () => {
  if (!getMeiliAvailability()) {
    return;
  }
  try {
    // We will use a single index 'global_search' for the global search autocomplete
    // and 'articles' for detailed article searching if needed.
    
    // 1. Initialize global_search index
    await meiliClient.createIndex(GLOBAL_SEARCH_INDEX, { primaryKey: 'uid' });
    const globalSearchIndex = meiliClient.index(GLOBAL_SEARCH_INDEX);
    
    await globalSearchIndex.updateSettings({
      searchableAttributes: ['name'],
      filterableAttributes: ['type'],
      sortableAttributes: [],
    });
    
    // 2. Initialize articles index
    await meiliClient.createIndex(ARTICLE_INDEX, { primaryKey: 'id' });
    const articleIndex = meiliClient.index(ARTICLE_INDEX);
    
    await articleIndex.updateSettings({
      searchableAttributes: ['title', 'doi', 'abstract'],
      filterableAttributes: ['publication_year', 'primary_topic', 'is_deleted'],
      sortableAttributes: ['title', 'publication_year', 'created_at'],
    });

    logger.info('Meilisearch indices initialized successfully.');
  } catch (error) {
    if (error.code !== 'index_already_exists') {
      logger.error('Error initializing Meilisearch indices:', error);
    }
  }
};

/**
 * Sync a single article to Meilisearch
 */
export const syncArticleToMeili = async (article) => {
  if (!getMeiliAvailability()) return;
  try {
    const articleIndex = meiliClient.index(ARTICLE_INDEX);
    await articleIndex.addDocuments([{
      id: String(article.article_id),
      article_id: article.article_id,
      title: article.title,
      abstract: article.abstract,
      doi: article.doi,
      publication_year: article.publication_year,
      primary_topic: article.primary_topic,
      is_deleted: article.is_deleted || false,
      created_at: article.created_at ? new Date(article.created_at).getTime() : Date.now()
    }]);

    // Also sync to global search
    const globalSearchIndex = meiliClient.index(GLOBAL_SEARCH_INDEX);
    await globalSearchIndex.addDocuments([{
      uid: `article_${article.article_id}`,
      id: String(article.article_id),
      name: article.title,
      type: 'ARTICLE'
    }]);
  } catch (error) {
    logger.error(`Error syncing article ${article.article_id} to Meilisearch:`, error);
  }
};

/**
 * Remove article from Meilisearch
 */
export const removeArticleFromMeili = async (articleId) => {
  if (!getMeiliAvailability()) return;
  try {
    await meiliClient.index(ARTICLE_INDEX).deleteDocument(articleId);
    await meiliClient.index(GLOBAL_SEARCH_INDEX).deleteDocument(`article_${articleId}`);
  } catch (error) {
    logger.error(`Error removing article ${articleId} from Meilisearch:`, error);
  }
};

/**
 * Sync single entity (Journal, Author, Keyword, Area, Category) to global_search index
 */
export const syncEntityToMeiliGlobal = async (id, name, type) => {
  if (!getMeiliAvailability()) return;
  try {
    const globalSearchIndex = meiliClient.index(GLOBAL_SEARCH_INDEX);
    await globalSearchIndex.addDocuments([{
      uid: `${type.toLowerCase()}_${id}`,
      id: String(id),
      name: name,
      type: type,
    }]);
  } catch (error) {
    logger.warn(`Error syncing ${type} ${id} to Meilisearch: ${error.message}`);
  }
};

/**
 * Remove entity from global_search index
 */
export const removeEntityFromMeiliGlobal = async (id, type) => {
  if (!getMeiliAvailability()) return;
  try {
    const globalSearchIndex = meiliClient.index(GLOBAL_SEARCH_INDEX);
    await globalSearchIndex.deleteDocument(`${type.toLowerCase()}_${id}`);
  } catch (error) {
    logger.warn(`Error removing ${type} ${id} from Meilisearch: ${error.message}`);
  }
};

export const searchGlobalFromMeili = async (keyword, limit = 10) => {
  if (!getMeiliAvailability()) {
    throw new Error('Meilisearch is offline');
  }
  try {
    const globalSearchIndex = meiliClient.index(GLOBAL_SEARCH_INDEX);
    const searchResult = await globalSearchIndex.search(keyword, {
      limit: Number(limit) || 10,
    });
    return searchResult.hits.map(hit => ({
      id: hit.id,
      name: hit.name,
      type: hit.type,
    }));
  } catch (error) {
    logger.warn(`Meilisearch searchGlobal failed for "${keyword}": ${error.message}`);
    throw error;
  }
};

/**
 * Search articles in Meilisearch
 */
export const searchArticlesFromMeili = async (keyword, options = {}) => {
  if (!getMeiliAvailability()) {
    throw new Error('Meilisearch is offline');
  }
  try {
    const { limit = 100, offset = 0, publication_year, primary_topic } = options;
    const articleIndex = meiliClient.index(ARTICLE_INDEX);

    const filterConditions = ['is_deleted = false'];
    if (publication_year) filterConditions.push(`publication_year = ${publication_year}`);
    if (primary_topic) filterConditions.push(`primary_topic = ${primary_topic}`);

    const searchResult = await articleIndex.search(keyword, {
      limit: Number(limit),
      offset: Number(offset),
      filter: filterConditions.length > 0 ? filterConditions.join(' AND ') : undefined,
    });

    const articleIds = searchResult.hits
      .map(hit => Number(hit.article_id || hit.id))
      .filter(id => Boolean(id) && !isNaN(id));

    return {
      hits: searchResult.hits,
      estimatedTotalHits: searchResult.estimatedTotalHits || searchResult.hits.length,
      articleIds,
    };
  } catch (error) {
    logger.warn(`Meilisearch searchArticles failed for "${keyword}": ${error.message}`);
    throw error;
  }
};

/**
 * Bulk sync for initial data loading
 */
export const indexAllGlobalData = async () => {
  try {
    logger.info('Starting bulk index of global search data to Meilisearch...');
    
    const query = `
      SELECT
          journal_id::text AS id,
          display_name AS name,
          'JOURNAL' AS type
      FROM "Journal"
      UNION ALL
      SELECT
          author_id::text,
          display_name,
          'AUTHOR'
      FROM "Author"
      UNION ALL
      SELECT
          article_id::text,
          title,
          'ARTICLE'
      FROM "Article"
      UNION ALL
      SELECT
          keyword_id::text,
          display_name,
          'KEYWORD'
      FROM "Keyword"
      UNION ALL
      SELECT
          subject_area_id::text,
          display_name,
          'AREA'
      FROM "Subject_Area"
      UNION ALL
      SELECT
          subject_category_id::text,
          display_name,
          'CATEGORY'
      FROM "Subject_Category"
    `;
    
    const result = await pool.query(query);
    const documents = result.rows.map(row => ({
      uid: `${row.type.toLowerCase()}_${row.id}`,
      id: row.id,
      name: row.name,
      type: row.type
    }));
    
    const globalSearchIndex = meiliClient.index(GLOBAL_SEARCH_INDEX);
    
    // Add in batches of 10000
    const batchSize = 10000;
    for (let i = 0; i < documents.length; i += batchSize) {
      const batch = documents.slice(i, i + batchSize);
      await globalSearchIndex.addDocuments(batch);
      logger.info(`Indexed batch ${i / batchSize + 1} of global search data.`);
    }

    // Also index articles detailed metadata into articles index
    const articleQuery = `
      SELECT article_id, title, abstract, doi, publication_year, primary_topic, created_at, is_deleted
      FROM "Article"
      WHERE is_deleted = false
    `;
    const articleRes = await pool.query(articleQuery);
    const articleDocs = articleRes.rows.map(a => ({
      id: String(a.article_id),
      article_id: a.article_id,
      title: a.title,
      abstract: a.abstract,
      doi: a.doi,
      publication_year: a.publication_year,
      primary_topic: a.primary_topic,
      is_deleted: a.is_deleted || false,
      created_at: a.created_at ? new Date(a.created_at).getTime() : Date.now()
    }));

    if (articleDocs.length > 0) {
      const articleIndex = meiliClient.index(ARTICLE_INDEX);
      for (let i = 0; i < articleDocs.length; i += batchSize) {
        const batch = articleDocs.slice(i, i + batchSize);
        await articleIndex.addDocuments(batch);
      }
      logger.info(`Indexed ${articleDocs.length} articles into articles index.`);
    }

    logger.info('Successfully indexed all global search and article data.');
  } catch (error) {
    logger.error('Error in indexAllGlobalData:', error);
  }
};
