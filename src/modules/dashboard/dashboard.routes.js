import { getTrendingKeywords } from './dashboard.controller.js';
import { trendingKeywordsQuerySchema } from './dashboard.schema.js';

export default async function dashboardRoutes(fastify, options) {
    fastify.get('/trending-keywords', {
        preValidation: fastify.authenticate,
        schema: {
            tags: ['Dashboard'],
            summary: 'Get trending keywords chart data',
            querystring: trendingKeywordsQuerySchema
        }
    }, getTrendingKeywords);
}
