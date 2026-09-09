export const subjectAreaResponseSchema = {
    200: {
        type: 'object',
        properties: {
            success: { type: 'boolean' },
            code: { type: 'string' },
            message: { type: 'string' },
            data: {
                type: 'array',
                items: {
                    type: 'object',
                    properties: {
                        subject_area_id: { type: 'string' },
                        display_name: { type: 'string' },
                        description: { type: ['string', 'null'] }
                    }
                }
            }
        }
    }
};

export const subjectCategoryQuerySchema = {
    type: 'object',
    properties: {
        subject_area_id: { type: 'string' }
    }
};

export const subjectCategoryResponseSchema = {
    200: {
        type: 'object',
        properties: {
            success: { type: 'boolean' },
            code: { type: 'string' },
            message: { type: 'string' },
            data: {
                type: 'array',
                items: {
                    type: 'object',
                    properties: {
                        subject_category_id: { type: 'string' },
                        subject_area_id: { type: ['string', 'null'] },
                        display_name: { type: 'string' },
                        description: { type: ['string', 'null'] }
                    }
                }
            }
        }
    }
};

export const journalRankingsParamsSchema = {
    type: 'object',
    required: ['id'],
    properties: {
        id: { type: 'string' }
    }
};

export const journalRankingsQuerySchema = {
    type: 'object',
    properties: {
        year: { type: 'integer' },
        metric_code: { type: 'string' },
        quartile: { type: 'string' },
        source: { type: 'string' }
    }
};

export const volumeQuerySchema = {
    type: 'object',
    properties: {
        journal_id: { type: 'string' },
        page: { type: 'integer', minimum: 1, default: 1 },
        limit: { type: 'integer', minimum: 1, maximum: 100, default: 10 }
    }
};

export const issueQuerySchema = {
    type: 'object',
    properties: {
        volume_id: { type: 'string' },
        page: { type: 'integer', minimum: 1, default: 1 },
        limit: { type: 'integer', minimum: 1, maximum: 100, default: 10 }
    }
};
