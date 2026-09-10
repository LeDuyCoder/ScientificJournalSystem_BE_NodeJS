import prisma from '../../lib/prisma.js';
import { creditWalletForPayment } from '../wallet/wallet.service.js';

const normalizeNumber = (value) => Number(value || 0);

const normalizePayment = (payment) => ({
    ...payment,
    order_code: payment.order_code !== null && payment.order_code !== undefined ? Number(payment.order_code) : null,
    amount: payment.amount === null || payment.amount === undefined ? payment.amount : Number(payment.amount),
    coin_amount: normalizeNumber(payment.coin_amount),
    bonus_coin: normalizeNumber(payment.bonus_coin),
    total_coin: normalizeNumber(payment.total_coin),
    package_name: payment.coin_package?.name,
    email: payment.user?.email,
});

export const getRawPaymentById = async (transactionId) => {
    const payment = await prisma.payment_transaction.findUnique({
        where: { transaction_id: transactionId }
    });
    return payment;
};

export const getRawPaymentByOrderCode = async (orderCode) => {
    if (!orderCode) return null;
    const payment = await prisma.payment_transaction.findFirst({
        where: { order_code: BigInt(orderCode) }
    });
    return payment;
};

export const createPaymentTransaction = async ({ userId, packageId, paymentMethod, coinPackage, coinAmount, bonusCoin, totalCoin, transactionId, orderCode }) => {
    const payment = await prisma.payment_transaction.create({
        data: {
            transaction_id: transactionId,
            order_code: orderCode !== undefined && orderCode !== null ? BigInt(orderCode) : undefined,
            user_id: userId,
            package_id: coinPackage.package_id,
            amount: coinPackage.price,
            currency: coinPackage.currency || 'VND',
            coin_amount: coinAmount,
            bonus_coin: bonusCoin,
            total_coin: totalCoin,
            payment_method: paymentMethod,
            payment_status: 'pending',
            created_at: new Date()
        }
    });
    return normalizePayment(payment);
};

export const getPaymentByOrderCode = async (orderCode) => {
    if (!orderCode) return null;
    const payment = await prisma.payment_transaction.findFirst({
        where: { order_code: BigInt(orderCode) },
        include: {
            coin_package: { select: { name: true } },
            user: { select: { email: true } }
        }
    });
    return payment ? normalizePayment(payment) : null;
};

export const getPaymentById = async ({ transactionId, userId, isAdmin }) => {
    const where = { transaction_id: transactionId };
    if (!isAdmin) {
        where.user_id = userId;
    }

    const payment = await prisma.payment_transaction.findFirst({
        where,
        include: {
            coin_package: { select: { name: true } },
            user: { select: { email: true } }
        }
    });

    return payment ? normalizePayment(payment) : null;
};

export const getPaymentsByUserId = async (userId, { limit, offset, status }) => {
    const where = { user_id: userId };
    if (status) where.payment_status = status;

    const [total, items] = await Promise.all([
        prisma.payment_transaction.count({ where }),
        prisma.payment_transaction.findMany({
            where,
            include: { coin_package: { select: { name: true } } },
            orderBy: { created_at: 'desc' },
            skip: offset,
            take: limit
        })
    ]);

    return { items: items.map(normalizePayment), total };
};

export const getAdminPayments = async ({ limit, offset, userId, status, paymentMethod }) => {
    const where = {};
    if (userId) where.user_id = userId;
    if (status) where.payment_status = status;
    if (paymentMethod) where.payment_method = paymentMethod;

    const [total, items] = await Promise.all([
        prisma.payment_transaction.count({ where }),
        prisma.payment_transaction.findMany({
            where,
            include: {
                coin_package: { select: { name: true } },
                user: { select: { email: true } }
            },
            orderBy: { created_at: 'desc' },
            skip: offset,
            take: limit
        })
    ]);

    return { items: items.map(normalizePayment), total };
};

export const markPaymentSuccessAndCredit = async ({ transactionId, orderCode, providerTransactionCode, note }) => {
    return await prisma.$transaction(async (tx) => {
        let paymentResult = [];
        if (transactionId) {
            paymentResult = await tx.$queryRaw`
                SELECT transaction_id, order_code, user_id, package_id, amount, currency,
                       coin_amount, bonus_coin, total_coin, payment_method,
                       payment_status, provider_transaction_code, note,
                       created_at, paid_at
                FROM payment_transaction
                WHERE transaction_id = ${transactionId}::uuid
                FOR UPDATE
            `;
        } else if (orderCode !== undefined && orderCode !== null) {
            paymentResult = await tx.$queryRaw`
                SELECT transaction_id, order_code, user_id, package_id, amount, currency,
                       coin_amount, bonus_coin, total_coin, payment_method,
                       payment_status, provider_transaction_code, note,
                       created_at, paid_at
                FROM payment_transaction
                WHERE order_code = ${BigInt(orderCode)}
                FOR UPDATE
            `;
        }

        if (paymentResult.length === 0) {
            const error = new Error('Khong tim thay giao dich thanh toan');
            error.statusCode = 404;
            error.code = 'PAYMENT_NOT_FOUND';
            throw error;
        }

        const payment = paymentResult[0];

        if (payment.payment_status === 'success') {
            return {
                payment: normalizePayment(payment),
                wallet: null,
                walletTransaction: null,
                alreadyProcessed: true,
            };
        }

        if (payment.payment_status !== 'pending') {
            const error = new Error('Giao dich khong con o trang thai pending');
            error.statusCode = 409;
            error.code = 'INVALID_PAYMENT_STATUS';
            throw error;
        }

        const updatedPaymentResult = await tx.$queryRaw`
            UPDATE payment_transaction
            SET payment_status = 'success',
                provider_transaction_code = COALESCE(${providerTransactionCode || null}, provider_transaction_code),
                note = COALESCE(${note || null}, note),
                paid_at = COALESCE(paid_at, NOW())
            WHERE transaction_id = ${payment.transaction_id}::uuid
            RETURNING transaction_id, order_code, user_id, package_id, amount, currency,
                      coin_amount, bonus_coin, total_coin, payment_method,
                      payment_status, provider_transaction_code, note,
                      created_at, paid_at
        `;

        const creditResult = await creditWalletForPayment(tx, updatedPaymentResult[0]);

        return {
            payment: normalizePayment(updatedPaymentResult[0]),
            wallet: creditResult.wallet,
            walletTransaction: creditResult.transaction,
            alreadyProcessed: false,
        };
    }, {
        timeout: 15000
    });
};

export const markPaymentFailed = async ({ transactionId, orderCode, providerTransactionCode, note }) => {
    const where = { payment_status: 'pending' };
    if (transactionId) where.transaction_id = transactionId;
    if (orderCode !== undefined && orderCode !== null) where.order_code = BigInt(orderCode);

    const payment = await prisma.payment_transaction.updateMany({
        where,
        data: {
            payment_status: 'failed',
            provider_transaction_code: providerTransactionCode || undefined,
            note: note || undefined
        }
    });

    if (payment.count > 0) {
        const updated = transactionId
            ? await prisma.payment_transaction.findUnique({ where: { transaction_id: transactionId } })
            : await prisma.payment_transaction.findFirst({ where: { order_code: BigInt(orderCode) } });
        return updated ? normalizePayment(updated) : null;
    }
    return null;
};
