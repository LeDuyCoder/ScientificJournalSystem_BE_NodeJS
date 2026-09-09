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
                        article_id: { type: 'string' },
                        title: { type: 'string' },
                        name: { type: 'string' },
                        type: { type: 'string' },
                        abstract: { type: ['string', 'null'] },
                        publication_year: { type: ['integer', 'null'] },
                        doi: { type: ['string', 'null'] },
                        citation_count: { type: ['integer', 'null'] },
                        journal: {
                            type: ['object', 'null'],
                            properties: {
                                id: { type: 'string' },
                                journal_id: { type: 'string' },
                                name: { type: 'string' },
                                display_name: { type: 'string' }
                            }
                        },
                        subject_area: {
                            type: ['object', 'null'],
                            properties: {
                                id: { type: 'string' },
                                subject_area_id: { type: 'string' },
                                name: { type: 'string' },
                                display_name: { type: 'string' }
                            }
                        },
                        topic: {
                            type: ['object', 'null'],
                            properties: {
                                id: { type: 'string' },
                                topic_id: { type: 'string' },
                                name: { type: 'string' },
                                display_name: { type: 'string' }
                            }
                        },
                        authors: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    id: { type: 'string' },
                                    author_id: { type: 'string' },
                                    name: { type: 'string' },
                                    display_name: { type: 'string' }
                                }
                            }
                        }
                    },
                    additionalProperties: true
                }
            }
        }
    }
};
