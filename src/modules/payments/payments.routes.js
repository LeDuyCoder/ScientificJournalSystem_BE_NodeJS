import {
    createPayment,
    getPaymentById,
    getPaymentByOrderCode,
    getMyPayments,
    handleMomoIpn,
    handlePayosWebhook,
} from './payments.controller.js';
import {
    createPaymentBodySchema,
    paymentQuerySchema,
    transactionIdParamSchema,
} from './payments.schema.js';

export default async function paymentsRoutes(fastify, options) {
    fastify.post('/create', {
        preValidation: fastify.authenticate,
        schema: {
            tags: ['Coin Payments'],
            summary: 'Tao giao dich thanh toan nap coin',
            body: createPaymentBodySchema
        }
    }, createPayment);

    fastify.get('/me', {
        preValidation: fastify.authenticate,
        schema: {
            tags: ['Coin Payments'],
            summary: 'Lay lich su nap tien cua nguoi dung hien tai',
            querystring: paymentQuerySchema
        }
    }, getMyPayments);

    fastify.post('/payos/webhook', {
        schema: {
            tags: ['Payment Callbacks'],
            summary: 'Xu ly PayOS Webhook sau khi nguoi dung thanh toan',
        }
    }, handlePayosWebhook);

    fastify.get('/payos/order/:orderCode', {
        schema: {
            tags: ['Coin Payments'],
            summary: 'Lay thong tin giao dich theo orderCode cua PayOS',
        }
    }, getPaymentByOrderCode);

    fastify.post('/momo/ipn', {
        schema: {
            tags: ['Payment Callbacks'],
            summary: 'Xu ly MoMo IPN',
        }
    }, handleMomoIpn);

    fastify.get('/:transactionId', {
        preValidation: fastify.authenticate,
        schema: {
            tags: ['Coin Payments'],
            summary: 'Xem trang thai mot giao dich thanh toan',
            params: transactionIdParamSchema
        }
    }, getPaymentById);
}
