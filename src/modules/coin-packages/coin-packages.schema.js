export const adminCoinPackagesQuerySchema = {
    type: 'object',
    properties: {
        page: { type: 'integer', minimum: 1, default: 1 },
        limit: { type: 'integer', minimum: 1, maximum: 100, default: 50 },
        isActive: { type: 'boolean' }
    }
};

export const createCoinPackageBodySchema = {
    type: 'object',
    required: ['name', 'coin_amount', 'price'],
    properties: {
        name: { type: 'string', minLength: 1 },
        coin_amount: { type: 'integer', minimum: 1 },
        bonus_coin: { type: 'integer', minimum: 0, default: 0 },
        price: { type: 'number', minimum: 0 },
        currency: { type: 'string', default: 'VND' },
        is_active: { type: 'boolean', default: true }
    }
};

export const updateCoinPackageBodySchema = {
    type: 'object',
    properties: {
        name: { type: 'string', minLength: 1 },
        coin_amount: { type: 'integer', minimum: 1 },
        bonus_coin: { type: 'integer', minimum: 0 },
        price: { type: 'number', minimum: 0 },
        currency: { type: 'string' },
        is_active: { type: 'boolean' }
    }
};

export const packageIdParamSchema = {
    type: 'object',
    required: ['packageId'],
    properties: {
        packageId: { type: 'integer', minimum: 1 }
    }
};
