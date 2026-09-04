export const searchParamsSchema = {
    type: 'object',
    required: ['keyword'],
    properties: {
        keyword: { type: 'string', minLength: 1 }
    }
};

export const searchQuerySchema = {
    type: 'object',
    properties: {
        limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 }
    }
};

export const searchResponseSchema = {
    200: {
        type: 'object',
        properties: {
            success: { type: 'boolean' },
            code: { type: 'string' },
            data: {
                type: 'array',
                items: {
                    type: 'object',
                    properties: {
                        id: { type: 'string' },
                        name: { type: 'string' },
                        type: { type: 'string' }
                    }
                }
            }
        }
    }
};
