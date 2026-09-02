export const countryStatsQuerySchema = {
    type: 'object',
    properties: {
        page: { type: 'integer', minimum: 1, default: 1 },
        limit: { type: 'integer', minimum: 1, maximum: 1000, default: 10 },
        year: { type: ['integer', 'string'] },
        publication_year: { type: ['integer', 'string'] }
    }
};

export const regionStatsQuerySchema = {
    type: 'object',
    properties: {
        country_code: { type: 'string' },
        countryCode: { type: 'string' }
    }
};

export const countryRegionsStatsParamsSchema = {
    type: 'object',
    required: ['code'],
    properties: {
        code: { type: 'string', minLength: 1 }
    }
};
