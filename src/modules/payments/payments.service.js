import crypto from 'crypto';
import logger from '../../utils/logger.js';
import * as paymentsRepository from './payments.repository.js';
import { getActiveCoinPackages } from '../coin-packages/coin-packages.repository.js';

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;

const normalizePagination = ({ page, limit }) => {
    const safePage = Number.isInteger(Number(page)) && Number(page) > 0 ? Number(page) : DEFAULT_PAGE;
    const safeLimit = Number.isInteger(Number(limit)) && Number(limit) > 0 ? Math.min(Number(limit), MAX_LIMIT) : DEFAULT_LIMIT;

    return {
        page: safePage,
        limit: safeLimit,
        offset: (safePage - 1) * safeLimit,
    };
};

import payOS from '../../config/payos.js';

const getBaseUrl = () => {
    const port = process.env.PORT || 8000;
    return process.env.BASE_URL || `http://localhost:${port}`;
};

const getFrontendUrl = () => {
    const raw = process.env.FRONTEND_URL;
    if (!raw) return 'http://localhost:5173';
    let cleaned = raw.trim();
    if ((cleaned.startsWith('"') && cleaned.endsWith('"')) || (cleaned.startsWith("'") && cleaned.endsWith("'"))) {
        cleaned = cleaned.slice(1, -1).trim();
    }
    if (cleaned.startsWith('[') && cleaned.endsWith(']')) {
        cleaned = cleaned.slice(1, -1).trim();
    }
    const first = cleaned.split(',')[0].trim().replace(/^['"]|['"]$/g, '').replace(/\/+$/, '');
    return first || 'http://localhost:5173';
};

const buildPayosPaymentUrl = async (payment, coinPackage) => {
    const defaultFrontend = getFrontendUrl();
    const returnUrl = (process.env.PAYOS_RETURN_URL || `${defaultFrontend}/wallet/payment/result`).trim().replace(/\/+$/, '');
    const cancelUrl = (process.env.PAYOS_CANCEL_URL || `${defaultFrontend}/wallet/top-up?cancel=true`).trim();

    const description = `NAPCOIN ${payment.order_code}`.slice(0, 25);

    const paymentLinkData = {
        orderCode: Number(payment.order_code),
        amount: Math.round(Number(payment.amount)),
        description,
        items: [
            {
                name: String(coinPackage.name || 'Goi Coin').slice(0, 50),
                quantity: 1,
                price: Math.round(Number(payment.amount)),
            }
        ],
        returnUrl,
        cancelUrl,
    };

    const paymentLinkResponse = await payOS.createPaymentLink(paymentLinkData);
    return paymentLinkResponse.checkoutUrl;
};

const verifyMomoSignature = (payload) => {
    const secretKey = process.env.MOMO_SECRET_KEY;
    if (!secretKey || !payload.signature) return false;

    const signData = Object.keys(payload)
        .filter((key) => key !== 'signature' && payload[key] !== undefined && payload[key] !== null)
        .sort()
        .map((key) => `${key}=${payload[key]}`)
        .join('&');

    const expectedSignature = crypto
        .createHmac('sha256', secretKey)
        .update(Buffer.from(signData, 'utf-8'))
        .digest('hex');

    return expectedSignature.toLowerCase() === String(payload.signature).toLowerCase();
};

export const createPayment = async ({ userId, packageId, paymentMethod = 'payos', ipAddr }) => {
    const activePackages = await getActiveCoinPackages();
    const coinPackage = activePackages.find(p => p.package_id === packageId);

    if (!coinPackage) {
        const error = new Error('Khong tim thay goi coin dang ban');
        error.statusCode = 404;
        error.code = 'COIN_PACKAGE_NOT_FOUND';
        throw error;
    }

    const coinAmount = Number(coinPackage.coin_amount || 0);
    const bonusCoin = Number(coinPackage.bonus_coin || 0);
    const totalCoin = coinAmount + bonusCoin;
    const transactionId = crypto.randomUUID();
    const orderCode = Number(String(Date.now()).slice(-9) + Math.floor(100 + Math.random() * 900));

    const payment = await paymentsRepository.createPaymentTransaction({
        userId,
        packageId,
        paymentMethod: paymentMethod || 'payos',
        coinPackage,
        coinAmount,
        bonusCoin,
        totalCoin,
        transactionId,
        orderCode
    });

    let paymentUrl = null;
    if (paymentMethod === 'payos' || !paymentMethod) {
        paymentUrl = await buildPayosPaymentUrl(payment, coinPackage);
    } else {
        paymentUrl = `${getBaseUrl()}/api/v1/payments/${payment.transaction_id}`;
    }

    return {
        payment,
        paymentUrl,
    };
};

export const getPaymentById = async ({ transactionId, user }) => {
    const isAdmin = user?.role === 'ADMINISTRATOR';
    let payment = await paymentsRepository.getPaymentById({ transactionId, userId: user.user_id, isAdmin });
    if (!payment) {
        return null;
    }

    if (payment.payment_status === 'pending' && payment.order_code) {
        try {
            const payosInfo = await payOS.paymentRequests.get(Number(payment.order_code));
            if (payosInfo) {
                if (payosInfo.status === 'PAID') {
                    const providerTransactionCode = payosInfo.transactions?.[0]?.reference || String(payment.order_code);
                    await paymentsRepository.markPaymentSuccessAndCredit({
                        orderCode: payment.order_code,
                        providerTransactionCode,
                        note: `PayOS sync confirmed payment success (ref: ${providerTransactionCode})`,
                    });
                    payment = await paymentsRepository.getPaymentById({ transactionId, userId: user.user_id, isAdmin });
                } else if (payosInfo.status === 'CANCELLED') {
                    await paymentsRepository.markPaymentFailed({
                        orderCode: payment.order_code,
                        providerTransactionCode: String(payment.order_code),
                        note: payosInfo.cancellationReason || 'PayOS payment cancelled',
                    });
                    payment = await paymentsRepository.getPaymentById({ transactionId, userId: user.user_id, isAdmin });
                }
            }
        } catch (syncErr) {
            logger.warn(`[PayOS Sync] Failed to sync payment for transaction ${transactionId}:`, syncErr.message);
        }
    }

    return payment;
};

export const getPaymentByOrderCode = async (orderCode) => {
    let payment = await paymentsRepository.getPaymentByOrderCode(orderCode);
    if (!payment) {
        const error = new Error('Khong tim thay giao dich thanh toan');
        error.statusCode = 404;
        error.code = 'PAYMENT_NOT_FOUND';
        throw error;
    }

    // Neu giao dich van o trang thai pending, chu dong dong bo tu PayOS API
    // Giup cap nhat tuc thi khi chay tren localhost (khong nhan duoc webhook tu internet) hoac khi webhook bi cham
    if (payment.payment_status === 'pending') {
        try {
            const payosInfo = await payOS.paymentRequests.get(Number(orderCode));
            if (payosInfo) {
                if (payosInfo.status === 'PAID') {
                    const providerTransactionCode = payosInfo.transactions?.[0]?.reference || String(orderCode);
                    await paymentsRepository.markPaymentSuccessAndCredit({
                        orderCode,
                        providerTransactionCode,
                        note: `PayOS sync confirmed payment success (ref: ${providerTransactionCode})`,
                    });
                    payment = await paymentsRepository.getPaymentByOrderCode(orderCode);
                } else if (payosInfo.status === 'CANCELLED') {
                    await paymentsRepository.markPaymentFailed({
                        orderCode,
                        providerTransactionCode: String(orderCode),
                        note: payosInfo.cancellationReason || 'PayOS payment cancelled',
                    });
                    payment = await paymentsRepository.getPaymentByOrderCode(orderCode);
                }
            }
        } catch (syncErr) {
            logger.warn(`[PayOS Sync] Failed to sync payment for orderCode ${orderCode}:`, syncErr.message);
        }
    }

    return payment;
};

export const getPaymentsByUserId = async (userId, options = {}) => {
    const { page, limit, offset } = normalizePagination(options);
    const { items, total } = await paymentsRepository.getPaymentsByUserId(userId, { limit, offset, status: options.status });

    return {
        items,
        pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        }
    };
};

export const getAdminPayments = async (options = {}) => {
    const { page, limit, offset } = normalizePagination(options);
    const { items, total } = await paymentsRepository.getAdminPayments({ limit, offset, userId: options.userId, status: options.status, paymentMethod: options.paymentMethod });

    return {
        items,
        pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        }
    };
};

export const handlePayosWebhook = async (webhookBody) => {
    try {
        if (!webhookBody) {
            return { success: false, message: 'Missing webhook body' };
        }

        let webhookData;
        try {
            webhookData = await payOS.verifyPaymentWebhookData(webhookBody);
        } catch (verifyErr) {
            logger.error('[PayOS Service] Webhook signature verification failed:', verifyErr);
            const error = new Error('Invalid webhook signature');
            error.statusCode = 400;
            throw error;
        }

        const { orderCode, amount, reference, code, desc } = webhookData;

        // Ho tro PayOS test webhook (Dashboard 'Confirm Webhook' gui du lieu mau)
        if (webhookData.description === 'Ma xac thuc webhook' || orderCode === 123) {
            logger.info('[PayOS Service] PayOS test webhook verified successfully');
            return { success: true, message: 'Webhook verified' };
        }

        const payment = await paymentsRepository.getRawPaymentByOrderCode(orderCode);
        if (!payment) {
            logger.warn(`[PayOS Service] Payment with orderCode ${orderCode} not found`);
            return { success: false, message: 'Payment not found' };
        }

        if (Number(amount) !== Math.round(Number(payment.amount))) {
            logger.warn(`[PayOS Service] Amount mismatch for orderCode ${orderCode}: expected ${payment.amount}, got ${amount}`);
            return { success: false, message: 'Invalid amount' };
        }

        if (code === '00' || desc === 'success') {
            await paymentsRepository.markPaymentSuccessAndCredit({
                orderCode,
                providerTransactionCode: reference || String(orderCode),
                note: `PayOS Webhook confirmed payment success (ref: ${reference || 'N/A'})`,
            });
            return { success: true, message: 'Payment confirmed successfully' };
        } else {
            await paymentsRepository.markPaymentFailed({
                orderCode,
                providerTransactionCode: reference || String(orderCode),
                note: `PayOS payment failed or cancelled with code: ${code}`,
            });
            return { success: true, message: 'Payment failed confirmed' };
        }
    } catch (error) {
        logger.error('[PayOS Service] Error while handling PayOS webhook:', error);
        throw error;
    }
};

export const handleMomoIpn = async (payload) => {
    try {
        const transactionId = payload.orderId || payload.requestId;
        const providerTransactionCode = payload.transId || null;

        if (!transactionId || payload.amount === undefined || payload.resultCode === undefined) {
            return { success: false, code: 'INVALID_IPN_DATA', message: 'Invalid IPN data' };
        }

        if (!verifyMomoSignature(payload)) {
            return { success: false, code: 'INVALID_SIGNATURE', message: 'Invalid signature' };
        }

        const payment = await paymentsRepository.getRawPaymentById(transactionId);
        if (!payment) {
            return { success: false, code: 'PAYMENT_NOT_FOUND', message: 'Payment not found' };
        }

        if (Number(payload.amount) !== Number(payment.amount)) {
            return { success: false, code: 'INVALID_AMOUNT', message: 'Invalid amount' };
        }

        if (Number(payload.resultCode) !== 0) {
            await paymentsRepository.markPaymentFailed({
                transactionId,
                providerTransactionCode,
                note: `MoMo failed with code ${payload.resultCode}`,
            });
            return { success: true, code: 'CONFIRMED_FAILED_PAYMENT', message: 'Payment failure confirmed' };
        }

        await paymentsRepository.markPaymentSuccessAndCredit({
            transactionId,
            providerTransactionCode,
            note: 'MoMo IPN confirmed payment success',
        });

        return { success: true, code: 'CONFIRMED_SUCCESS_PAYMENT', message: 'Payment success confirmed' };
    } catch (error) {
        logger.error('[Payment Service] Error while handling MoMo IPN:', error);
        return { success: false, code: 'UNKNOWN_ERROR', message: 'Unknown error' };
    }
};
