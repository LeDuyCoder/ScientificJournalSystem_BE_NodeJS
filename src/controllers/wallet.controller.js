import * as walletService from '../services/wallet.service.js';
import logger from '../utils/logger.js';

export const walletServiceRef = { ...walletService };

const handleControllerError = (res, error, fallbackMessage) => {
  if (error.statusCode) {
    return res.status(error.statusCode).json({
      success: false,
      code: error.code || 'REQUEST_FAILED',
      message: error.message,
    });
  }

  logger.error('[Wallet Controller] Error:', error);
  return res.status(500).json({
    success: false,
    code: 'INTERNAL_SERVER_ERROR',
    message: fallbackMessage,
  });
};

export const getMyWallet = async (req, res) => {
  try {
    const wallet = await walletServiceRef.getWalletByUserId(req.user.user_id);

    return res.status(200).json({
      success: true,
      code: 'GET_WALLET_SUCCESS',
      message: 'Lay thong tin vi coin thanh cong',
      data: wallet,
    });
  } catch (error) {
    return handleControllerError(res, error, 'Co loi xay ra khi lay thong tin vi coin');
  }
};

export const getMyWalletTransactions = async (req, res) => {
  try {
    const result = await walletServiceRef.getWalletTransactionsByUserId(req.user.user_id, {
      page: req.query.page,
      limit: req.query.limit,
      type: req.query.type,
    });

    return res.status(200).json({
      success: true,
      code: 'GET_WALLET_TRANSACTIONS_SUCCESS',
      message: 'Lay lich su giao dich coin thanh cong',
      data: result.items,
      pagination: result.pagination,
    });
  } catch (error) {
    return handleControllerError(res, error, 'Co loi xay ra khi lay lich su giao dich coin');
  }
};

export const spendCoins = async (req, res) => {
  try {
    const result = await walletServiceRef.spendCoins({
      userId: req.user.user_id,
      amount: Number(req.body.amount),
      description: req.body.description,
    });

    return res.status(200).json({
      success: true,
      code: 'SPEND_COINS_SUCCESS',
      message: 'Tieu coin thanh cong',
      data: result,
    });
  } catch (error) {
    return handleControllerError(res, error, 'Co loi xay ra khi tieu coin');
  }
};

export const getAdminWalletTransactions = async (req, res) => {
  try {
    const result = await walletServiceRef.getAdminWalletTransactions({
      page: req.query.page,
      limit: req.query.limit,
      userId: req.query.userId,
      type: req.query.type,
    });

    return res.status(200).json({
      success: true,
      code: 'GET_ADMIN_WALLET_TRANSACTIONS_SUCCESS',
      message: 'Lay danh sach lich su giao dich coin thanh cong',
      data: result.items,
      pagination: result.pagination,
    });
  } catch (error) {
    return handleControllerError(res, error, 'Co loi xay ra khi lay lich su giao dich coin');
  }
};

export const adjustWallet = async (req, res) => {
  try {
    const result = await walletServiceRef.adjustWallet({
      userId: req.params.userId,
      amount: Number(req.body.amount),
      description: req.body.description,
    });

    return res.status(200).json({
      success: true,
      code: 'ADJUST_WALLET_SUCCESS',
      message: 'Dieu chinh coin thu cong thanh cong',
      data: result,
    });
  } catch (error) {
    return handleControllerError(res, error, 'Co loi xay ra khi dieu chinh coin');
  }
};
