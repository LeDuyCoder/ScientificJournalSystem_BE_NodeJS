import crypto from 'crypto';
import pool from '../config/database.js';
import logger from '../utils/logger.js';
import { creditWalletForPayment } from './wallet.service.js';

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;
const SUCCESS_PAYMENT_STATUS = 'success';
const PENDING_PAYMENT_STATUS = 'pending';
const FAILED_PAYMENT_STATUS = 'failed';

const createHttpError = (message, statusCode, code) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.code = code;
  return error;
};

const normalizeNumber = (value) => Number(value || 0);

const normalizePayment = (payment) => ({
  ...payment,
  amount: payment.amount === null || payment.amount === undefined ? payment.amount : Number(payment.amount),
  coin_amount: normalizeNumber(payment.coin_amount),
  bonus_coin: normalizeNumber(payment.bonus_coin),
  total_coin: normalizeNumber(payment.total_coin),
});

const normalizePagination = ({ page, limit }) => {
  const safePage = Number.isInteger(Number(page)) && Number(page) > 0
    ? Number(page)
    : DEFAULT_PAGE;
  const safeLimit = Number.isInteger(Number(limit)) && Number(limit) > 0
    ? Math.min(Number(limit), MAX_LIMIT)
    : DEFAULT_LIMIT;

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
  const returnUrl = getRequiredEnv('VNPAY_RETURN_URL')
    || `${getBaseUrl()}/api/v1/payments/vnpay/return`;

  const missingConfig = [
    ['VNPAY_PAYMENT_URL', paymentUrl],
    ['VNPAY_TMN_CODE', tmnCode],
    ['VNPAY_HASH_SECRET', hashSecret],
  ].filter(([, value]) => !value).map(([key]) => key);

  if (missingConfig.length > 0) {
    throw createHttpError(
      `Thieu cau hinh VNPay: ${missingConfig.join(', ')}`,
      500,
      'VNPAY_CONFIG_MISSING'
    );
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

  if (!hashSecret || !secureHash) {
    return false;
  }

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

  if (!secretKey || !payload.signature) {
    return false;
  }

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

const getRawPaymentById = async (transactionId) => {
  const result = await pool.query(
    `SELECT transaction_id, user_id, package_id, amount, currency,
            coin_amount, bonus_coin, total_coin, payment_method,
            payment_status, provider_transaction_code, note,
            created_at, paid_at
     FROM payment_transaction
     WHERE transaction_id = $1`,
    [transactionId]
  );

  return result.rows[0] || null;
};

export const createPayment = async ({ userId, packageId, paymentMethod, ipAddr }) => {
  try {
    const packageResult = await pool.query(
      `SELECT package_id, name, coin_amount, bonus_coin, price, currency
       FROM coin_package
       WHERE package_id = $1 AND is_active = true`,
      [packageId]
    );

    if (packageResult.rowCount === 0) {
      throw createHttpError('Khong tim thay goi coin dang ban', 404, 'COIN_PACKAGE_NOT_FOUND');
    }

    const coinPackage = packageResult.rows[0];
    const coinAmount = normalizeNumber(coinPackage.coin_amount);
    const bonusCoin = normalizeNumber(coinPackage.bonus_coin);
    const totalCoin = coinAmount + bonusCoin;
    const transactionId = crypto.randomUUID();

    const transactionResult = await pool.query(
      `INSERT INTO payment_transaction (
         transaction_id, user_id, package_id, amount, currency,
         coin_amount, bonus_coin, total_coin, payment_method,
         payment_status, created_at
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'pending', NOW())
       RETURNING transaction_id, user_id, package_id, amount, currency,
                 coin_amount, bonus_coin, total_coin, payment_method,
                 payment_status, provider_transaction_code, note,
                 created_at, paid_at`,
      [
        transactionId,
        userId,
        coinPackage.package_id,
        coinPackage.price,
        coinPackage.currency || 'VND',
        coinAmount,
        bonusCoin,
        totalCoin,
        paymentMethod,
      ]
    );

    const payment = normalizePayment(transactionResult.rows[0]);

    return {
      payment,
      paymentUrl: buildPaymentUrl(payment, ipAddr),
    };
  } catch (error) {
    if (error.statusCode) {
      throw error;
    }

    logger.error('[Payment Service] Error while creating payment:', error);
    throw error;
  }
};

export const getPaymentById = async ({ transactionId, user }) => {
  const params = [transactionId];
  const isAdmin = user?.role === 'ADMINISTRATOR';
  let ownershipSql = '';

  if (!isAdmin) {
    params.push(user.user_id);
    ownershipSql = `AND pt.user_id = $${params.length}`;
  }

  try {
    const result = await pool.query(
      `SELECT pt.transaction_id, pt.user_id, u.email,
              pt.package_id, cp.name AS package_name,
              pt.amount, pt.currency, pt.coin_amount, pt.bonus_coin, pt.total_coin,
              pt.payment_method, pt.payment_status, pt.provider_transaction_code,
              pt.note, pt.created_at, pt.paid_at
       FROM payment_transaction pt
       LEFT JOIN coin_package cp ON cp.package_id = pt.package_id
       LEFT JOIN "user" u ON u.user_id = pt.user_id
       WHERE pt.transaction_id = $1 ${ownershipSql}`,
      params
    );

    return result.rows[0] ? normalizePayment(result.rows[0]) : null;
  } catch (error) {
    logger.error('[Payment Service] Error while getting payment:', error);
    throw error;
  }
};

export const getPaymentsByUserId = async (userId, options = {}) => {
  const { page, limit, offset } = normalizePagination(options);
  const params = [userId];
  const whereClauses = ['pt.user_id = $1'];

  if (options.status) {
    params.push(options.status);
    whereClauses.push(`pt.payment_status = $${params.length}`);
  }

  const whereSql = whereClauses.join(' AND ');
  const countParams = params.slice();
  params.push(limit, offset);

  try {
    const [countResult, dataResult] = await Promise.all([
      pool.query(
        `SELECT COUNT(*)::integer AS total
         FROM payment_transaction pt
         WHERE ${whereSql}`,
        countParams
      ),
      pool.query(
        `SELECT pt.transaction_id, pt.user_id, pt.package_id,
                cp.name AS package_name, pt.amount, pt.currency,
                pt.coin_amount, pt.bonus_coin, pt.total_coin,
                pt.payment_method, pt.payment_status,
                pt.provider_transaction_code, pt.note, pt.created_at, pt.paid_at
         FROM payment_transaction pt
         LEFT JOIN coin_package cp ON cp.package_id = pt.package_id
         WHERE ${whereSql}
         ORDER BY pt.created_at DESC
         LIMIT $${params.length - 1} OFFSET $${params.length}`,
        params
      ),
    ]);

    const total = Number(countResult.rows[0]?.total || 0);
    return {
      items: dataResult.rows.map(normalizePayment),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    logger.error('[Payment Service] Error while getting user payments:', error);
    throw error;
  }
};

export const getAdminPayments = async (options = {}) => {
  const { page, limit, offset } = normalizePagination(options);
  const params = [];
  const whereClauses = [];

  if (options.userId) {
    params.push(options.userId);
    whereClauses.push(`pt.user_id = $${params.length}`);
  }

  if (options.status) {
    params.push(options.status);
    whereClauses.push(`pt.payment_status = $${params.length}`);
  }

  if (options.paymentMethod) {
    params.push(options.paymentMethod);
    whereClauses.push(`pt.payment_method = $${params.length}`);
  }

  const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
  const countParams = params.slice();
  params.push(limit, offset);

  try {
    const [countResult, dataResult] = await Promise.all([
      pool.query(
        `SELECT COUNT(*)::integer AS total
         FROM payment_transaction pt
         ${whereSql}`,
        countParams
      ),
      pool.query(
        `SELECT pt.transaction_id, pt.user_id, u.email,
                pt.package_id, cp.name AS package_name,
                pt.amount, pt.currency, pt.coin_amount, pt.bonus_coin, pt.total_coin,
                pt.payment_method, pt.payment_status, pt.provider_transaction_code,
                pt.note, pt.created_at, pt.paid_at
         FROM payment_transaction pt
         LEFT JOIN coin_package cp ON cp.package_id = pt.package_id
         LEFT JOIN "user" u ON u.user_id = pt.user_id
         ${whereSql}
         ORDER BY pt.created_at DESC
         LIMIT $${params.length - 1} OFFSET $${params.length}`,
        params
      ),
    ]);

    const total = Number(countResult.rows[0]?.total || 0);
    return {
      items: dataResult.rows.map(normalizePayment),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    logger.error('[Payment Service] Error while getting admin payments:', error);
    throw error;
  }
};

export const markPaymentSuccessAndCredit = async ({ transactionId, providerTransactionCode, note }) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const transactionResult = await client.query(
      `SELECT transaction_id, user_id, package_id, amount, currency,
              coin_amount, bonus_coin, total_coin, payment_method,
              payment_status, provider_transaction_code, note,
              created_at, paid_at
       FROM payment_transaction
       WHERE transaction_id = $1
       FOR UPDATE`,
      [transactionId]
    );

    if (transactionResult.rowCount === 0) {
      throw createHttpError('Khong tim thay giao dich thanh toan', 404, 'PAYMENT_NOT_FOUND');
    }

    const payment = transactionResult.rows[0];

    if (payment.payment_status === SUCCESS_PAYMENT_STATUS) {
      await client.query('COMMIT');
      return {
        payment: normalizePayment(payment),
        wallet: null,
        walletTransaction: null,
        alreadyProcessed: true,
      };
    }

    if (payment.payment_status !== PENDING_PAYMENT_STATUS) {
      throw createHttpError('Giao dich khong con o trang thai pending', 409, 'INVALID_PAYMENT_STATUS');
    }

    const updatedPaymentResult = await client.query(
      `UPDATE payment_transaction
       SET payment_status = 'success',
           provider_transaction_code = COALESCE($2, provider_transaction_code),
           note = COALESCE($3, note),
           paid_at = COALESCE(paid_at, NOW())
       WHERE transaction_id = $1
       RETURNING transaction_id, user_id, package_id, amount, currency,
                 coin_amount, bonus_coin, total_coin, payment_method,
                 payment_status, provider_transaction_code, note,
                 created_at, paid_at`,
      [transactionId, providerTransactionCode || null, note || null]
    );

    const creditResult = await creditWalletForPayment(client, updatedPaymentResult.rows[0]);
    await client.query('COMMIT');

    return {
      payment: normalizePayment(updatedPaymentResult.rows[0]),
      wallet: creditResult.wallet,
      walletTransaction: creditResult.transaction,
      alreadyProcessed: false,
    };
  } catch (error) {
    await client.query('ROLLBACK');
    if (error.statusCode) {
      throw error;
    }

    logger.error('[Payment Service] Error while marking payment success:', error);
    throw error;
  } finally {
    client.release();
  }
};

export const markPaymentFailed = async ({ transactionId, providerTransactionCode, note }) => {
  try {
    const result = await pool.query(
      `UPDATE payment_transaction
       SET payment_status = 'failed',
           provider_transaction_code = COALESCE($2, provider_transaction_code),
           note = COALESCE($3, note)
       WHERE transaction_id = $1
         AND payment_status = 'pending'
       RETURNING transaction_id, user_id, package_id, amount, currency,
                 coin_amount, bonus_coin, total_coin, payment_method,
                 payment_status, provider_transaction_code, note,
                 created_at, paid_at`,
      [transactionId, providerTransactionCode || null, note || null]
    );

    return result.rows[0] ? normalizePayment(result.rows[0]) : null;
  } catch (error) {
    logger.error('[Payment Service] Error while marking payment failed:', error);
    throw error;
  }
};

export const handleVnpayReturn = async (params) => {
  const transactionId = params.vnp_TxnRef;

  if (!transactionId) {
    throw createHttpError('Thieu ma giao dich VNPay', 400, 'VNPAY_TXN_REF_MISSING');
  }

  const isValidSignature = verifyVnpaySignature(params);
  const payment = await getRawPaymentById(transactionId);

  return {
    isValidSignature,
    transactionId,
    payment: payment ? normalizePayment(payment) : null,
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

    const payment = await getRawPaymentById(transactionId);
    if (!payment) {
      return { rspCode: '01', message: 'Order not found' };
    }

    const expectedAmount = Math.round(Number(payment.amount) * 100);
    if (Number(payload.vnp_Amount) !== expectedAmount) {
      return { rspCode: '04', message: 'Invalid amount' };
    }

    const isSuccess = payload.vnp_ResponseCode === '00'
      && (!payload.vnp_TransactionStatus || payload.vnp_TransactionStatus === '00');

    if (!isSuccess) {
      await markPaymentFailed({
        transactionId,
        providerTransactionCode,
        note: `VNPay failed with code ${payload.vnp_ResponseCode}`,
      });
      return { rspCode: '00', message: 'Confirm Success' };
    }

    await markPaymentSuccessAndCredit({
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

    const payment = await getRawPaymentById(transactionId);
    if (!payment) {
      return { success: false, code: 'PAYMENT_NOT_FOUND', message: 'Payment not found' };
    }

    if (Number(payload.amount) !== Number(payment.amount)) {
      return { success: false, code: 'INVALID_AMOUNT', message: 'Invalid amount' };
    }

    if (Number(payload.resultCode) !== 0) {
      await markPaymentFailed({
        transactionId,
        providerTransactionCode,
        note: `MoMo failed with code ${payload.resultCode}`,
      });
      return { success: true, code: 'CONFIRMED_FAILED_PAYMENT', message: 'Payment failure confirmed' };
    }

    await markPaymentSuccessAndCredit({
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
