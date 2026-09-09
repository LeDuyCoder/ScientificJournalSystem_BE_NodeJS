export const walletTransactionsQuerySchema = {
    type: 'object',
    properties: {
        page: { type: 'integer', minimum: 1, default: 1 },
        limit: { type: 'integer', minimum: 1, maximum: 100, default: 50 },
        type: { type: 'string', enum: ['deposit', 'spend', 'refund', 'admin_adjust'] }
    }
};

export const spendCoinsBodySchema = {
    type: 'object',
    required: ['amount'],
    properties: {
        amount: { type: 'integer', minimum: 1 },
        description: { type: 'string' }
    }
};

export const adminWalletTransactionsQuerySchema = {
    type: 'object',
    properties: {
        page: { type: 'integer', minimum: 1, default: 1 },
        limit: { type: 'integer', minimum: 1, maximum: 100, default: 50 },
        userId: { type: 'string' },
        type: { type: 'string', enum: ['deposit', 'spend', 'refund', 'admin_adjust'] }
    }
};

export const adjustWalletBodySchema = {
    type: 'object',
    required: ['amount'],
    properties: {
        amount: { type: 'integer' },
        description: { type: 'string' }
    }
};
