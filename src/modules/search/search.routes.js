import { search } from './search.controller.js';
import { searchParamsSchema, searchQuerySchema, searchResponseSchema } from './search.schema.js';

export default async function searchRoutes(fastify, options) {
    fastify.get('/:keyword', {
        schema: {
            tags: ['Search'],
            summary: 'Tìm kiếm theo từ khóa',
            description: 'Tìm kiếm Journal, Author, Article, Keyword, Subject Area và Subject Category theo từ khóa sử dụng PostgreSQL full-text search.',
            params: searchParamsSchema,
            querystring: searchQuerySchema,
            response: searchResponseSchema
        }
    }, search);
}
