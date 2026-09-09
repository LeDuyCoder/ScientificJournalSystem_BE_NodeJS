import { getPublicationTrends } from './statistics.controller.js';
import { publicationTrendsQuerySchema } from './statistics.schema.js';

export default async function statisticsRoutes(fastify, options) {
    fastify.get('/publication-trends', {
        preValidation: fastify.authenticate,
        schema: {
            tags: ['Statistics'],
            summary: 'Retrieve publication trends',
            querystring: publicationTrendsQuerySchema
        }
    }, getPublicationTrends);
}
