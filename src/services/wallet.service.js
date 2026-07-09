import crypto from 'crypto';
import pool from '../config/database.js';
import logger from '../utils/logger.js';

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;

const createHttpError = (message, statusCode, code) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.code = code;
  return error;
};

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

const ensureWalletForUser = async (queryExecutor, userId) => {
  await queryExecutor.query(
    `INSERT INTO wallet (wallet_id, user_id, balance, total_deposit, total_spent, created_at, updated_at)
     VALUES ($1, $2, 0, 0, 0, NOW(), NOW())
     ON CONFLICT (user_id) DO NOTHING`,
    [crypto.randomUUID(), userId]
  );

  const walletResult = await queryExecutor.query(
    `SELECT wallet_id, user_id, balance, total_deposit, total_spent, created_at, updated_at
     FROM wallet
     WHERE user_id = $1`,
    [userId]
  );

  return walletResult.rows[0] ? normalizeWallet(walletResult.rows[0]) : null;
};

const getWalletForUpdate = async (client, userId) => {
  await ensureWalletForUser(client, userId);

  const walletResult = await client.query(
    `SELECT wallet_id, user_id, balance, total_deposit, total_spent, created_at, updated_at
     FROM wallet
     WHERE user_id = $1
     FOR UPDATE`,
    [userId]
  );

  return walletResult.rows[0] ? normalizeWallet(walletResult.rows[0]) : null;
};

export const getWalletByUserId = async (userId) => {
  try {
    return await ensureWalletForUser(pool, userId);
  } catch (error) {
    logger.error('[Wallet Service] Error while getting wallet:', error);
    throw error;
  }
};

export const getWalletTransactionsByUserId = async (userId, options = {}) => {
  const { page, limit, offset } = normalizePagination(options);
  const params = [userId];
  const whereClauses = ['wt.user_id = $1'];

  if (options.type) {
    params.push(options.type);
    whereClauses.push(`wt.type = $${params.length}`);
  }

  params.push(limit, offset);

  const whereSql = whereClauses.join(' AND ');
  const countParams = params.slice(0, params.length - 2);

  try {
    const [countResult, dataResult] = await Promise.all([
      pool.query(
        `SELECT COUNT(*)::integer AS total
         FROM wallet_transaction wt
         WHERE ${whereSql}`,
        countParams
      ),
      pool.query(
        `SELECT wt.wallet_transaction_id, wt.wallet_id, wt.user_id, wt.type, wt.amount,
                wt.balance_before, wt.balance_after, wt.payment_transaction_id,
                wt.description, wt.created_at
         FROM wallet_transaction wt
         WHERE ${whereSql}
         ORDER BY wt.created_at DESC
         LIMIT $${params.length - 1} OFFSET $${params.length}`,
        params
      ),
    ]);

    const total = Number(countResult.rows[0]?.total || 0);
    return {
      items: dataResult.rows.map(normalizeWalletTransaction),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    logger.error('[Wallet Service] Error while getting wallet transactions:', error);
    throw error;
  }
};

export const spendCoins = async ({ userId, amount, description }) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const wallet = await getWalletForUpdate(client, userId);
    const balanceBefore = wallet.balance;

    if (balanceBefore < amount) {
      throw createHttpError('So du coin khong du de thuc hien giao dich', 409, 'INSUFFICIENT_BALANCE');
    }

    const balanceAfter = balanceBefore - amount;
    const walletTransactionId = crypto.randomUUID();

    const walletResult = await client.query(
      `UPDATE wallet
       SET balance = $1,
           total_spent = total_spent + $2,
           updated_at = NOW()
       WHERE wallet_id = $3
       RETURNING wallet_id, user_id, balance, total_deposit, total_spent, created_at, updated_at`,
      [balanceAfter, amount, wallet.wallet_id]
    );

    const transactionResult = await client.query(
      `INSERT INTO wallet_transaction (
         wallet_transaction_id, wallet_id, user_id, type, amount,
         balance_before, balance_after, description, created_at
       )
       VALUES ($1, $2, $3, 'spend', $4, $5, $6, $7, NOW())
       RETURNING wallet_transaction_id, wallet_id, user_id, type, amount,
                 balance_before, balance_after, payment_transaction_id,
                 description, created_at`,
      [
        walletTransactionId,
        wallet.wallet_id,
        userId,
        -amount,
        balanceBefore,
        balanceAfter,
        description || null,
      ]
    );

    await client.query('COMMIT');

    return {
      wallet: normalizeWallet(walletResult.rows[0]),
      transaction: normalizeWalletTransaction(transactionResult.rows[0]),
    };
  } catch (error) {
    await client.query('ROLLBACK');
    if (error.statusCode) {
      throw error;
    }

    logger.error('[Wallet Service] Error while spending coins:', error);
    throw error;
  } finally {
    client.release();
  }
};

export const creditWalletForPayment = async (client, paymentTransaction) => {
  const totalCoin = parseCoin(paymentTransaction.total_coin);
  const wallet = await getWalletForUpdate(client, paymentTransaction.user_id);
  const balanceBefore = wallet.balance;
  const balanceAfter = balanceBefore + totalCoin;

  const walletResult = await client.query(
    `UPDATE wallet
     SET balance = $1,
         total_deposit = total_deposit + $2,
         updated_at = NOW()
     WHERE wallet_id = $3
     RETURNING wallet_id, user_id, balance, total_deposit, total_spent, created_at, updated_at`,
    [balanceAfter, totalCoin, wallet.wallet_id]
  );

  const transactionResult = await client.query(
    `INSERT INTO wallet_transaction (
       wallet_transaction_id, wallet_id, user_id, type, amount,
       balance_before, balance_after, payment_transaction_id, description, created_at
     )
     VALUES ($1, $2, $3, 'deposit', $4, $5, $6, $7, $8, NOW())
     RETURNING wallet_transaction_id, wallet_id, user_id, type, amount,
               balance_before, balance_after, payment_transaction_id,
               description, created_at`,
    [
      crypto.randomUUID(),
      wallet.wallet_id,
      paymentTransaction.user_id,
      totalCoin,
      balanceBefore,
      balanceAfter,
      paymentTransaction.transaction_id,
      `Nap ${totalCoin} coin tu giao dich ${paymentTransaction.transaction_id}`,
    ]
  );

  return {
    wallet: normalizeWallet(walletResult.rows[0]),
    transaction: normalizeWalletTransaction(transactionResult.rows[0]),
  };
};

export const adjustWallet = async ({ userId, amount, description }) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const userResult = await client.query(
      `SELECT user_id FROM "user" WHERE user_id = $1`,
      [userId]
    );

    if (userResult.rowCount === 0) {
      throw createHttpError('Khong tim thay nguoi dung', 404, 'USER_NOT_FOUND');
    }

    const wallet = await getWalletForUpdate(client, userId);
    const balanceBefore = wallet.balance;
    const balanceAfter = balanceBefore + amount;

    if (balanceAfter < 0) {
      throw createHttpError('So du coin khong du de tru coin thu cong', 409, 'INSUFFICIENT_BALANCE');
    }

    const walletResult = await client.query(
      `UPDATE wallet
       SET balance = $1,
           updated_at = NOW()
       WHERE wallet_id = $2
       RETURNING wallet_id, user_id, balance, total_deposit, total_spent, created_at, updated_at`,
      [balanceAfter, wallet.wallet_id]
    );

    const transactionResult = await client.query(
      `INSERT INTO wallet_transaction (
         wallet_transaction_id, wallet_id, user_id, type, amount,
         balance_before, balance_after, description, created_at
       )
       VALUES ($1, $2, $3, 'admin_adjust', $4, $5, $6, $7, NOW())
       RETURNING wallet_transaction_id, wallet_id, user_id, type, amount,
                 balance_before, balance_after, payment_transaction_id,
                 description, created_at`,
      [
        crypto.randomUUID(),
        wallet.wallet_id,
        userId,
        amount,
        balanceBefore,
        balanceAfter,
        description || null,
      ]
    );

    await client.query('COMMIT');

    return {
      wallet: normalizeWallet(walletResult.rows[0]),
      transaction: normalizeWalletTransaction(transactionResult.rows[0]),
    };
  } catch (error) {
    await client.query('ROLLBACK');
    if (error.statusCode) {
      throw error;
    }

    logger.error('[Wallet Service] Error while adjusting wallet:', error);
    throw error;
  } finally {
    client.release();
  }
};

export const getAdminWalletTransactions = async (options = {}) => {
  const { page, limit, offset } = normalizePagination(options);
  const params = [];
  const whereClauses = [];

  if (options.userId) {
    params.push(options.userId);
    whereClauses.push(`wt.user_id = $${params.length}`);
  }

  if (options.type) {
    params.push(options.type);
    whereClauses.push(`wt.type = $${params.length}`);
  }

  const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
  const countParams = params.slice();

  params.push(limit, offset);

  try {
    const [countResult, dataResult] = await Promise.all([
      pool.query(
        `SELECT COUNT(*)::integer AS total
         FROM wallet_transaction wt
         ${whereSql}`,
        countParams
      ),
      pool.query(
        `SELECT wt.wallet_transaction_id, wt.wallet_id, wt.user_id, u.email,
                wt.type, wt.amount, wt.balance_before, wt.balance_after,
                wt.payment_transaction_id, wt.description, wt.created_at
         FROM wallet_transaction wt
         LEFT JOIN "user" u ON u.user_id = wt.user_id
         ${whereSql}
         ORDER BY wt.created_at DESC
         LIMIT $${params.length - 1} OFFSET $${params.length}`,
        params
      ),
    ]);

    const total = Number(countResult.rows[0]?.total || 0);
    return {
      items: dataResult.rows.map(normalizeWalletTransaction),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    logger.error('[Wallet Service] Error while getting admin wallet transactions:', error);
    throw error;
  }
};
