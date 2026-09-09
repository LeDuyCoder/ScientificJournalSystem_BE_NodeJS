export const publicationTrendsQuerySchema = {
    type: 'object',
    properties: {
        projectId: { type: 'string' },
        fromYear: { type: 'integer' },
        toYear: { type: 'integer' }
    }
};
