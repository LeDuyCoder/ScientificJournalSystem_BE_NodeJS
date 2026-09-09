export const trendingKeywordsQuerySchema = {
    type: 'object',
    properties: {
        projectId: { type: 'string' },
        limit: { type: 'integer', minimum: 1, default: 10 },
        fromYear: { type: 'integer' },
        toYear: { type: 'integer' },
        metric: { type: 'string', enum: ['articleCount', 'citationCount', 'avgScore'], default: 'articleCount' }
    }
};
