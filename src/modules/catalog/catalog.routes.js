import { getSubjectAreas, getSubjectCategories, getJournalRankings, getVolumes, getIssues } from './catalog.controller.js';
import { subjectAreaResponseSchema, subjectCategoryQuerySchema, subjectCategoryResponseSchema, journalRankingsParamsSchema, journalRankingsQuerySchema, volumeQuerySchema, issueQuerySchema } from './catalog.schema.js';

export default async function catalogRoutes(fastify, options) {
    fastify.get('/subject-areas', {
        schema: {
            tags: ['Catalog'],
            summary: 'Lấy danh sách các lĩnh vực học thuật lớn (Subject Area)',
            response: subjectAreaResponseSchema
        }
    }, getSubjectAreas);

    fastify.get('/subject-categories', {
        schema: {
            tags: ['Catalog'],
            summary: 'Lấy danh sách các chuyên ngành hẹp (Subject Category)',
            querystring: subjectCategoryQuerySchema,
            response: subjectCategoryResponseSchema
        }
    }, getSubjectCategories);

    fastify.get('/journals/:id/rankings', {
        schema: {
            tags: ['Catalog'],
            summary: 'Lấy lịch sử ranking xếp hạng của một journal',
            params: journalRankingsParamsSchema,
            querystring: journalRankingsQuerySchema
        }
    }, getJournalRankings);

    fastify.get('/volumes', {
        schema: {
            tags: ['Catalog'],
            summary: 'Lấy danh sách volume trong hệ thống',
            querystring: volumeQuerySchema
        }
    }, getVolumes);

    fastify.get('/issues', {
        schema: {
            tags: ['Catalog'],
            summary: 'Lấy danh sách issue trong hệ thống',
            querystring: issueQuerySchema
        }
    }, getIssues);
}
