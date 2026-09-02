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

const formatVnpayDate = (date) => {
    const pad = (value) => String(value).padStart(2, '0');
    return [
        date.getFullYear(),
        pad(date.getMonth() + 1),
        pad(date.getDate()),
        pad(date.getHours()),
        pad(date.getMinutes()),
        pad(date.getSeconds()),
    ].join('');
};

const getBaseUrl = () => {
    const port = process.env.PORT || 5000;
    return process.env.BASE_URL || `http://localhost:${port}`;
};

const buildQueryString = (params) => Object.keys(params)
    .filter((key) => params[key] !== undefined && params[key] !== null && params[key] !== '')
    .sort()
    .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(String(params[key])).replace(/%20/g, '+')}`)
    .join('&');

const signHmac = ({ algorithm, secret, data }) => crypto
    .createHmac(algorithm, secret)
    .update(Buffer.from(data, 'utf-8'))
    .digest('hex');

const getRequiredEnv = (key) => {
    const value = process.env[key];
    return typeof value === 'string' ? value.trim() : value;
};

const buildVnpayPaymentUrl = (payment, ipAddr) => {
    const paymentUrl = getRequiredEnv('VNPAY_PAYMENT_URL');
    const tmnCode = getRequiredEnv('VNPAY_TMN_CODE');
    const hashSecret = getRequiredEnv('VNPAY_HASH_SECRET');
    const returnUrl = getRequiredEnv('VNPAY_RETURN_URL') || `${getBaseUrl()}/api/v1/payments/vnpay/return`;

    const missingConfig = [
        ['VNPAY_PAYMENT_URL', paymentUrl],
        ['VNPAY_TMN_CODE', tmnCode],
        ['VNPAY_HASH_SECRET', hashSecret],
    ].filter(([, value]) => !value).map(([key]) => key);

    if (missingConfig.length > 0) {
        const error = new Error(`Thieu cau hinh VNPay: ${missingConfig.join(', ')}`);
        error.statusCode = 500;
        error.code = 'VNPAY_CONFIG_MISSING';
        throw error;
    }

    const params = {
        vnp_Version: '2.1.0',
        vnp_Command: 'pay',
        vnp_TmnCode: tmnCode,
        vnp_Amount: Math.round(Number(payment.amount) * 100),
        vnp_CurrCode: payment.currency || 'VND',
        vnp_TxnRef: payment.transaction_id,
        vnp_OrderInfo: `Nap coin ${payment.transaction_id}`,
        vnp_OrderType: 'other',
        vnp_Locale: 'vn',
        vnp_ReturnUrl: returnUrl,
        vnp_IpAddr: ipAddr || '127.0.0.1',
        vnp_CreateDate: formatVnpayDate(new Date()),
    };

    const secureHash = signHmac({
        algorithm: 'sha512',
        secret: hashSecret,
        data: buildQueryString(params),
    });

    return `${paymentUrl}?${buildQueryString({ ...params, vnp_SecureHash: secureHash })}`;
};

const buildPaymentUrl = (payment, ipAddr) => {
    if (payment.payment_method === 'vnpay') {
        return buildVnpayPaymentUrl(payment, ipAddr);
    }
    return `${getBaseUrl()}/api/v1/payments/${payment.transaction_id}`;
};

const verifyVnpaySignature = (params) => {
    const hashSecret = process.env.VNPAY_HASH_SECRET;
    const secureHash = params.vnp_SecureHash || params.vnp_securehash;

    if (!hashSecret || !secureHash) return false;

    const signParams = { ...params };
    delete signParams.vnp_SecureHash;
    delete signParams.vnp_securehash;
    delete signParams.vnp_SecureHashType;
    delete signParams.vnp_securehashtype;

    const expectedHash = signHmac({
        algorithm: 'sha512',
        secret: hashSecret,
        data: buildQueryString(signParams),
    });

    return expectedHash.toLowerCase() === String(secureHash).toLowerCase();
};

const verifyMomoSignature = (payload) => {
    const secretKey = process.env.MOMO_SECRET_KEY;
    if (!secretKey || !payload.signature) return false;

    const signData = Object.keys(payload)
        .filter((key) => key !== 'signature' && payload[key] !== undefined && payload[key] !== null)
        .sort()
        .map((key) => `${key}=${payload[key]}`)
        .join('&');

    const expectedSignature = signHmac({
        algorithm: 'sha256',
        secret: secretKey,
        data: signData,
    });

    return expectedSignature.toLowerCase() === String(payload.signature).toLowerCase();
};

export const createPayment = async ({ userId, packageId, paymentMethod, ipAddr }) => {
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

    const payment = await paymentsRepository.createPaymentTransaction({
        userId, packageId, paymentMethod, coinPackage, coinAmount, bonusCoin, totalCoin, transactionId
    });

    return {
        payment,
        paymentUrl: buildPaymentUrl(payment, ipAddr),
    };
};

export const getPaymentById = async ({ transactionId, user }) => {
    const isAdmin = user?.role === 'ADMINISTRATOR';
    return await paymentsRepository.getPaymentById({ transactionId, userId: user.user_id, isAdmin });
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

export const handleVnpayReturn = async (params) => {
    const transactionId = params.vnp_TxnRef;

    if (!transactionId) {
        const error = new Error('Thieu ma giao dich VNPay');
        error.statusCode = 400;
        error.code = 'VNPAY_TXN_REF_MISSING';
        throw error;
    }

    const isValidSignature = verifyVnpaySignature(params);
    const payment = await paymentsRepository.getRawPaymentById(transactionId);

    return {
        isValidSignature,
        transactionId,
        payment: payment ? payment : null,
        gatewayResponseCode: params.vnp_ResponseCode || null,
        gatewayTransactionStatus: params.vnp_TransactionStatus || null,
    };
};

export const handleVnpayIpn = async (payload) => {
    try {
        const transactionId = payload.vnp_TxnRef;
        const providerTransactionCode = payload.vnp_TransactionNo || payload.vnp_BankTranNo || null;

        if (!transactionId || !payload.vnp_Amount || !payload.vnp_ResponseCode) {
            return { rspCode: '99', message: 'Invalid IPN data' };
        }

        if (!verifyVnpaySignature(payload)) {
            return { rspCode: '97', message: 'Invalid signature' };
        }

        const payment = await paymentsRepository.getRawPaymentById(transactionId);
        if (!payment) {
            return { rspCode: '01', message: 'Order not found' };
        }

        const expectedAmount = Math.round(Number(payment.amount) * 100);
        if (Number(payload.vnp_Amount) !== expectedAmount) {
            return { rspCode: '04', message: 'Invalid amount' };
        }

        const isSuccess = payload.vnp_ResponseCode === '00' && (!payload.vnp_TransactionStatus || payload.vnp_TransactionStatus === '00');

        if (!isSuccess) {
            await paymentsRepository.markPaymentFailed({
                transactionId,
                providerTransactionCode,
                note: `VNPay failed with code ${payload.vnp_ResponseCode}`,
            });
            return { rspCode: '00', message: 'Confirm Success' };
        }

        await paymentsRepository.markPaymentSuccessAndCredit({
            transactionId,
            providerTransactionCode,
            note: 'VNPay IPN confirmed payment success',
        });

        return { rspCode: '00', message: 'Confirm Success' };
    } catch (error) {
        logger.error('[Payment Service] Error while handling VNPay IPN:', error);
        return { rspCode: '99', message: 'Unknown error' };
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
