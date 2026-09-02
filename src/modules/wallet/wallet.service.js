import * as walletRepository from './wallet.repository.js';

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

export const getWalletByUserId = async (userId) => {
    return await walletRepository.getWalletByUserId(userId);
};

export const getWalletTransactionsByUserId = async (userId, options = {}) => {
    const { page, limit, offset } = normalizePagination(options);
    const { items, total } = await walletRepository.getWalletTransactionsByUserId(userId, { limit, offset, type: options.type });

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

export const spendCoins = async ({ userId, amount, description }) => {
    return await walletRepository.spendCoins({ userId, amount, description });
};

export const creditWalletForPayment = async (tx, paymentTransaction) => {
    return await walletRepository.creditWalletForPayment(tx, paymentTransaction);
};

export const adjustWallet = async ({ userId, amount, description }) => {
    return await walletRepository.adjustWallet({ userId, amount, description });
};

export const getAdminWalletTransactions = async (options = {}) => {
    const { page, limit, offset } = normalizePagination(options);
    const { items, total } = await walletRepository.getAdminWalletTransactions({ limit, offset, userId: options.userId, type: options.type });

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
