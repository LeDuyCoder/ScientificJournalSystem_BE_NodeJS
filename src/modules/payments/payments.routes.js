import {
    createPayment,
    getPaymentById,
    getMyPayments,
    handleMomoIpn,
    handleVnpayIpn,
    handleVnpayReturn,
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

    fastify.get('/vnpay/return', {
        schema: {
            tags: ['Payment Callbacks'],
            summary: 'VNPay return URL sau khi nguoi dung thanh toan',
        }
    }, handleVnpayReturn);

    fastify.post('/vnpay/ipn', {
        schema: {
            tags: ['Payment Callbacks'],
            summary: 'Xu ly VNPay IPN',
        }
    }, handleVnpayIpn);

    fastify.get('/vnpay/ipn', {
        schema: {
            tags: ['Payment Callbacks'],
            summary: 'Xu ly VNPay IPN dang query string',
        }
    }, handleVnpayIpn);

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
