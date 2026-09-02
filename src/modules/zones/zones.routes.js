import { getCountryStats, getRegionStats, getCountryRegionsStats } from './zones.controller.js';
import { countryStatsQuerySchema, regionStatsQuerySchema, countryRegionsStatsParamsSchema } from './zones.schema.js';

export default async function zonesRoutes(fastify, options) {
    fastify.get('/countries/stats', {
        schema: {
            tags: ['Zone'],
            summary: 'Lấy danh sách thống kê sản lượng bài viết theo quốc gia',
            querystring: countryStatsQuerySchema
        }
    }, getCountryStats);

    fastify.get('/regions/stats', {
        schema: {
            tags: ['Zone'],
            summary: 'Lấy thống kê sản lượng bài viết theo phân vùng (Region) toàn cầu hoặc theo quốc gia',
            querystring: regionStatsQuerySchema
        }
    }, getRegionStats);

    fastify.get('/countries/:code/regions/stats', {
        schema: {
            tags: ['Zone'],
            summary: 'Lấy thống kê sản lượng bài viết của các phân vùng nội bộ (Region) thuộc một quốc gia cụ thể',
            params: countryRegionsStatsParamsSchema
        }
    }, getCountryRegionsStats);
}
