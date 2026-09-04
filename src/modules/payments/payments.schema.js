export const createPaymentBodySchema = {
    type: 'object',
    required: ['packageId', 'paymentMethod'],
    properties: {
        packageId: { type: 'string', format: 'uuid' },
        paymentMethod: { type: 'string', enum: ['vnpay', 'momo', 'bank_transfer', 'stripe', 'paypal'] }
    }
};

export const paymentQuerySchema = {
    type: 'object',
    properties: {
        page: { type: 'integer', minimum: 1, default: 1 },
        limit: { type: 'integer', minimum: 1, maximum: 100, default: 50 },
        status: { type: 'string', enum: ['pending', 'success', 'failed', 'cancelled', 'refunded'] }
    }
};

export const transactionIdParamSchema = {
    type: 'object',
    required: ['transactionId'],
    properties: {
        transactionId: { type: 'string', format: 'uuid' }
    }
};

export const adminPaymentsQuerySchema = {
    type: 'object',
    properties: {
        page: { type: 'integer', minimum: 1, default: 1 },
        limit: { type: 'integer', minimum: 1, maximum: 100, default: 50 },
        userId: { type: 'string' },
        status: { type: 'string', enum: ['pending', 'success', 'failed', 'cancelled', 'refunded'] },
        paymentMethod: { type: 'string' }
    }
};
