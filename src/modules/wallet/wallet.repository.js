import prisma from '../../lib/prisma.js';
import crypto from 'crypto';

const parseCoin = (value) => Number(value || 0);

const normalizeWallet = (wallet) => ({
    ...wallet,
    balance: parseCoin(wallet.balance),
    total_deposit: parseCoin(wallet.total_deposit),
    total_spent: parseCoin(wallet.total_spent),
});

const normalizeWalletTransaction = (transaction) => ({
    ...transaction,
    amount: parseCoin(transaction.amount),
    balance_before: parseCoin(transaction.balance_before),
    balance_after: parseCoin(transaction.balance_after),
});

export const ensureWalletForUser = async (tx, userId) => {
    await tx.$executeRaw`
      INSERT INTO wallet (wallet_id, user_id, balance, total_deposit, total_spent, created_at, updated_at)
      VALUES (${crypto.randomUUID()}::uuid, ${userId}::uuid, 0, 0, 0, NOW(), NOW())
      ON CONFLICT (user_id) DO NOTHING
    `;
    const walletResult = await tx.$queryRaw`
      SELECT wallet_id, user_id, balance, total_deposit, total_spent, created_at, updated_at
      FROM wallet
      WHERE user_id = ${userId}::uuid
    `;
    return walletResult[0] ? normalizeWallet(walletResult[0]) : null;
};

export const getWalletForUpdate = async (tx, userId) => {
    await ensureWalletForUser(tx, userId);
    const walletResult = await tx.$queryRaw`
      SELECT wallet_id, user_id, balance, total_deposit, total_spent, created_at, updated_at
      FROM wallet
      WHERE user_id = ${userId}::uuid
      FOR UPDATE
    `;
    return walletResult[0] ? normalizeWallet(walletResult[0]) : null;
};

export const getWalletByUserId = async (userId) => {
    return await prisma.$transaction(async (tx) => {
        return await ensureWalletForUser(tx, userId);
    });
};

export const getWalletTransactionsByUserId = async (userId, { limit, offset, type }) => {
    const where = { user_id: userId };
    if (type) where.type = type;

    const [total, items] = await Promise.all([
        prisma.wallet_transaction.count({ where }),
        prisma.wallet_transaction.findMany({
            where,
            orderBy: { created_at: 'desc' },
            skip: offset,
            take: limit
        })
    ]);

    return { items: items.map(normalizeWalletTransaction), total };
};

export const spendCoins = async ({ userId, amount, description }) => {
    return await prisma.$transaction(async (tx) => {
        const wallet = await getWalletForUpdate(tx, userId);
        const balanceBefore = wallet.balance;

        if (balanceBefore < amount) {
            const error = new Error('So du coin khong du de thuc hien giao dich');
            error.statusCode = 409;
            error.code = 'INSUFFICIENT_BALANCE';
            throw error;
        }

        const balanceAfter = balanceBefore - amount;
        const walletTransactionId = crypto.randomUUID();

        const walletResult = await tx.$queryRaw`
            UPDATE wallet
            SET balance = ${balanceAfter},
                total_spent = total_spent + ${amount},
                updated_at = NOW()
            WHERE wallet_id = ${wallet.wallet_id}::uuid
            RETURNING wallet_id, user_id, balance, total_deposit, total_spent, created_at, updated_at
        `;

        const transactionResult = await tx.$queryRaw`
            INSERT INTO wallet_transaction (
                wallet_transaction_id, wallet_id, user_id, type, amount,
                balance_before, balance_after, description, created_at
            )
            VALUES (${walletTransactionId}::uuid, ${wallet.wallet_id}::uuid, ${userId}::uuid, 'spend', ${-amount}, ${balanceBefore}, ${balanceAfter}, ${description || null}, NOW())
            RETURNING wallet_transaction_id, wallet_id, user_id, type, amount,
                        balance_before, balance_after, payment_transaction_id,
                        description, created_at
        `;

        return {
            wallet: normalizeWallet(walletResult[0]),
            transaction: normalizeWalletTransaction(transactionResult[0]),
        };
    });
};

export const creditWalletForPayment = async (tx, paymentTransaction) => {
    const totalCoin = parseCoin(paymentTransaction.total_coin);
    const wallet = await getWalletForUpdate(tx, paymentTransaction.user_id);
    const balanceBefore = wallet.balance;
    const balanceAfter = balanceBefore + totalCoin;

    const walletResult = await tx.$queryRaw`
        UPDATE wallet
        SET balance = ${balanceAfter},
            total_deposit = total_deposit + ${totalCoin},
            updated_at = NOW()
        WHERE wallet_id = ${wallet.wallet_id}::uuid
        RETURNING wallet_id, user_id, balance, total_deposit, total_spent, created_at, updated_at
    `;

    const transactionResult = await tx.$queryRaw`
        INSERT INTO wallet_transaction (
            wallet_transaction_id, wallet_id, user_id, type, amount,
            balance_before, balance_after, payment_transaction_id, description, created_at
        )
        VALUES (${crypto.randomUUID()}::uuid, ${wallet.wallet_id}::uuid, ${paymentTransaction.user_id}::uuid, 'deposit', ${totalCoin}, ${balanceBefore}, ${balanceAfter}, ${paymentTransaction.transaction_id}::uuid, ${'Nap ' + totalCoin + ' coin tu giao dich ' + paymentTransaction.transaction_id}, NOW())
        RETURNING wallet_transaction_id, wallet_id, user_id, type, amount,
                    balance_before, balance_after, payment_transaction_id,
                    description, created_at
    `;

    return {
        wallet: normalizeWallet(walletResult[0]),
        transaction: normalizeWalletTransaction(transactionResult[0]),
    };
};

export const adjustWallet = async ({ userId, amount, description }) => {
    return await prisma.$transaction(async (tx) => {
        const user = await tx.user.findUnique({ where: { user_id: userId } });
        if (!user) {
            const error = new Error('Khong tim thay nguoi dung');
            error.statusCode = 404;
            error.code = 'USER_NOT_FOUND';
            throw error;
        }

        const wallet = await getWalletForUpdate(tx, userId);
        const balanceBefore = wallet.balance;
        const balanceAfter = balanceBefore + amount;

        if (balanceAfter < 0) {
            const error = new Error('So du coin khong du de tru coin thu cong');
            error.statusCode = 409;
            error.code = 'INSUFFICIENT_BALANCE';
            throw error;
        }

        const walletResult = await tx.$queryRaw`
            UPDATE wallet
            SET balance = ${balanceAfter},
                updated_at = NOW()
            WHERE wallet_id = ${wallet.wallet_id}::uuid
            RETURNING wallet_id, user_id, balance, total_deposit, total_spent, created_at, updated_at
        `;

        const transactionResult = await tx.$queryRaw`
            INSERT INTO wallet_transaction (
                wallet_transaction_id, wallet_id, user_id, type, amount,
                balance_before, balance_after, description, created_at
            )
            VALUES (${crypto.randomUUID()}::uuid, ${wallet.wallet_id}::uuid, ${userId}::uuid, 'admin_adjust', ${amount}, ${balanceBefore}, ${balanceAfter}, ${description || null}, NOW())
            RETURNING wallet_transaction_id, wallet_id, user_id, type, amount,
                        balance_before, balance_after, payment_transaction_id,
                        description, created_at
        `;

        return {
            wallet: normalizeWallet(walletResult[0]),
            transaction: normalizeWalletTransaction(transactionResult[0]),
        };
    });
};

export const getAdminWalletTransactions = async ({ limit, offset, userId, type }) => {
    const where = {};
    if (userId) where.user_id = userId;
    if (type) where.type = type;

    const [total, items] = await Promise.all([
        prisma.wallet_transaction.count({ where }),
        prisma.wallet_transaction.findMany({
            where,
            include: { user: { select: { email: true } } },
            orderBy: { created_at: 'desc' },
            skip: offset,
            take: limit
        })
    ]);

    return { 
        items: items.map(item => ({
            ...normalizeWalletTransaction(item),
            email: item.user?.email
        })), 
        total 
    };
};
