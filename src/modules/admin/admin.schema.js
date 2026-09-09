export const publicationTrendsQuerySchema = {
    type: 'object',
    properties: {
        year: { type: 'integer' },
        limit: { type: 'integer', minimum: 1, default: 5 }
    }
};

export const volumeIssueStatusQuerySchema = {
    type: 'object',
    properties: {
        page: { type: 'integer', minimum: 1, default: 1 },
        limit: { type: 'integer', minimum: 1, default: 10 }
    }
};

export const recentActivitiesQuerySchema = {
    type: 'object',
    properties: {
        page: { type: 'integer', minimum: 1, default: 1 },
        limit: { type: 'integer', minimum: 1, default: 10 }
    }
};

export const usersQuerySchema = {
    type: 'object',
    properties: {
        search: { type: 'string' },
        role: { type: 'string' },
        status: { type: 'string' },
        page: { type: 'integer', minimum: 1, default: 1 },
        limit: { type: 'integer', minimum: 1, default: 10 },
        sortBy: { type: 'string', default: 'email' },
        sortOrder: { type: 'string', enum: ['asc', 'desc', 'ASC', 'DESC'], default: 'desc' }
    }
};

export const createUserBodySchema = {
    type: 'object',
    required: ['email', 'password'],
    properties: {
        email: { type: 'string', format: 'email' },
        password: { type: 'string' },
        first_name: { type: 'string' },
        last_name: { type: 'string' },
        role: { type: 'string', enum: ['STUDENT', 'LECTURER', 'RESEARCHER', 'ADMINISTRATOR'] },
        status: { type: 'string', enum: ['INACTIVE', 'ACTIVE', 'BANNED'] },
        date_of_birth: { type: 'string', format: 'date' },
        gender: { type: 'boolean' }
    }
};

export const updateUserBodySchema = {
    type: 'object',
    properties: {
        email: { type: 'string', format: 'email' },
        password: { type: 'string' },
        first_name: { type: 'string' },
        last_name: { type: 'string' },
        role: { type: 'string', enum: ['STUDENT', 'LECTURER', 'RESEARCHER', 'ADMINISTRATOR'] },
        status: { type: 'string', enum: ['INACTIVE', 'ACTIVE', 'BANNED'] },
        type: { type: 'string', enum: ['LOCAL', 'GOOGLE', 'GITHUB'] },
        date_of_birth: { type: 'string', format: 'date' },
        gender: { type: 'boolean' },
        url_image: { type: 'string' }
    }
};

export const userIdParamSchema = {
    type: 'object',
    required: ['id'],
    properties: {
        id: { type: 'string', format: 'uuid' }
    }
};

export const journalIdParamSchema = {
    type: 'object',
    required: ['journalId'],
    properties: {
        journalId: { type: 'string', format: 'uuid' }
    }
};
