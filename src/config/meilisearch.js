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

export default meiliClient;
