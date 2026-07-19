import meiliClient from '../config/meilisearch.js';
import pool from '../config/database.js';
import logger from '../utils/logger.js';

const ARTICLE_INDEX = 'articles';
const GLOBAL_SEARCH_INDEX = 'global_search';

export const initMeiliSearch = async () => {
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
      sortableAttributes: ['publication_year', 'created_at'],
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
  try {
    await meiliClient.index(ARTICLE_INDEX).deleteDocument(articleId);
    await meiliClient.index(GLOBAL_SEARCH_INDEX).deleteDocument(`article_${articleId}`);
  } catch (error) {
    logger.error(`Error removing article ${articleId} from Meilisearch:`, error);
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

    logger.info('Successfully indexed all global search data.');
  } catch (error) {
    logger.error('Error in indexAllGlobalData:', error);
  }
};
