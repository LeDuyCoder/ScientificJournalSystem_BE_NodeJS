import { Meilisearch } from 'meilisearch';
import logger from '../utils/logger.js';
import dotenv from 'dotenv';

dotenv.config();

const meiliClient = new Meilisearch({
  host: process.env.MEILI_HOST || 'http://localhost:7700',
  apiKey: process.env.MEILI_MASTER_KEY || '',
});

// Since Meilisearch client doesn't connect/listen like Redis or Postgres, we can do a ping to verify connection at startup.
meiliClient.isHealthy()
  .then((healthy) => {
    if (healthy) {
      logger.info('Connected to Meilisearch');
    } else {
      logger.error('Meilisearch is unhealthy');
    }
  })
  .catch((err) => {
    logger.error('Failed to connect to Meilisearch:', err.message);
  });

meiliClient.searchWithRetry = async (indexUid, query, options, retries = 3, delay = 200) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await meiliClient.index(indexUid).search(query, options);
    } catch (error) {
      if (attempt === retries) {
        throw error;
      }
      logger.warn(`Meilisearch search failed (attempt ${attempt}/${retries}). Retrying in ${delay * attempt}ms... Error: ${error.message}`);
      await new Promise(resolve => setTimeout(resolve, delay * attempt));
    }
  }
};

export default meiliClient;
