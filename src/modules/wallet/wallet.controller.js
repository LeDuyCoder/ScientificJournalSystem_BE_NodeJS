import * as walletService from './wallet.service.js';
import logger from '../../utils/logger.js';

const handleControllerError = (reply, error, fallbackMessage) => {
    if (error.statusCode) {
        return reply.status(error.statusCode).send({
            success: false,
            code: error.code || 'REQUEST_FAILED',
            message: error.message,
        });
    }

    logger.error('[Wallet Controller] Error:', error);
    return reply.status(500).send({
        success: false,
        code: 'INTERNAL_SERVER_ERROR',
        message: fallbackMessage,
    });
};

export const getMyWallet = async (req, reply) => {
    try {
        const wallet = await walletService.getWalletByUserId(req.user.user_id);
        return reply.send({
            success: true,
            code: 'GET_WALLET_SUCCESS',
            message: 'Lay thong tin vi coin thanh cong',
            data: wallet,
        });
    } catch (error) {
        return handleControllerError(reply, error, 'Co loi xay ra khi lay thong tin vi coin');
    }
};

export const getMyWalletTransactions = async (req, reply) => {
    try {
        const result = await walletService.getWalletTransactionsByUserId(req.user.user_id, {
            page: req.query.page,
            limit: req.query.limit,
            type: req.query.type,
        });

        return reply.send({
            success: true,
            code: 'GET_WALLET_TRANSACTIONS_SUCCESS',
            message: 'Lay lich su giao dich coin thanh cong',
            data: result.items,
            pagination: result.pagination,
        });
    } catch (error) {
        return handleControllerError(reply, error, 'Co loi xay ra khi lay lich su giao dich coin');
    }
};

export const spendCoins = async (req, reply) => {
    try {
        const result = await walletService.spendCoins({
            userId: req.user.user_id,
            amount: Number(req.body.amount),
            description: req.body.description,
        });

        return reply.send({
            success: true,
            code: 'SPEND_COINS_SUCCESS',
            message: 'Tieu coin thanh cong',
            data: result,
        });
    } catch (error) {
        return handleControllerError(reply, error, 'Co loi xay ra khi tieu coin');
    }
};

export const getAdminWalletTransactions = async (req, reply) => {
    try {
        const result = await walletService.getAdminWalletTransactions({
            page: req.query.page,
            limit: req.query.limit,
            userId: req.query.userId,
            type: req.query.type,
        });

        return reply.send({
            success: true,
            code: 'GET_ADMIN_WALLET_TRANSACTIONS_SUCCESS',
            message: 'Lay danh sach lich su giao dich coin thanh cong',
            data: result.items,
            pagination: result.pagination,
        });
    } catch (error) {
        return handleControllerError(reply, error, 'Co loi xay ra khi lay lich su giao dich coin');
    }
};

export const adjustWallet = async (req, reply) => {
    try {
        const result = await walletService.adjustWallet({
            userId: req.params.userId,
            amount: Number(req.body.amount),
            description: req.body.description,
        });

        return reply.send({
            success: true,
            code: 'ADJUST_WALLET_SUCCESS',
            message: 'Dieu chinh coin thu cong thanh cong',
            data: result,
        });
    } catch (error) {
        return handleControllerError(reply, error, 'Co loi xay ra khi dieu chinh coin');
    }
};
