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

const normalizeCoinPackage = (coinPackage) => ({
  ...coinPackage,
  coin_amount: Number(coinPackage.coin_amount || 0),
  bonus_coin: Number(coinPackage.bonus_coin || 0),
  total_coin: Number(coinPackage.total_coin || 0),
  price: coinPackage.price === null || coinPackage.price === undefined
    ? coinPackage.price
    : Number(coinPackage.price),
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

export const getActiveCoinPackages = async () => {
  try {
    const result = await pool.query(
      `SELECT package_id, name, coin_amount, bonus_coin,
              (coin_amount + bonus_coin) AS total_coin,
              price, currency, is_active, created_at, updated_at
       FROM coin_package
       WHERE is_active = true
       ORDER BY price ASC, coin_amount ASC`
    );

    return result.rows.map(normalizeCoinPackage);
  } catch (error) {
    logger.error('[CoinPackage Service] Error while getting active packages:', error);
    throw error;
  }
};

export const getAdminCoinPackages = async (options = {}) => {
  const { page, limit, offset } = normalizePagination(options);
  const params = [];
  const whereClauses = [];

  if (options.isActive !== undefined) {
    params.push(options.isActive);
    whereClauses.push(`is_active = $${params.length}`);
  }

  const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
  const countParams = params.slice();
  params.push(limit, offset);

  try {
    const [countResult, dataResult] = await Promise.all([
      pool.query(
        `SELECT COUNT(*)::integer AS total
         FROM coin_package
         ${whereSql}`,
        countParams
      ),
      pool.query(
        `SELECT package_id, name, coin_amount, bonus_coin,
                (coin_amount + bonus_coin) AS total_coin,
                price, currency, is_active, created_at, updated_at
         FROM coin_package
         ${whereSql}
         ORDER BY created_at DESC
         LIMIT $${params.length - 1} OFFSET $${params.length}`,
        params
      ),
    ]);

    const total = Number(countResult.rows[0]?.total || 0);
    return {
      items: dataResult.rows.map(normalizeCoinPackage),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    logger.error('[CoinPackage Service] Error while getting admin packages:', error);
    throw error;
  }
};

export const createCoinPackage = async (data) => {
  const {
    name,
    coin_amount,
    bonus_coin = 0,
    price,
    currency = 'VND',
    is_active = true,
  } = data;

  try {
    const result = await pool.query(
      `INSERT INTO coin_package (
         package_id, name, coin_amount, bonus_coin, price,
         currency, is_active, created_at, updated_at
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
       RETURNING package_id, name, coin_amount, bonus_coin,
                 (coin_amount + bonus_coin) AS total_coin,
                 price, currency, is_active, created_at, updated_at`,
      [
        crypto.randomUUID(),
        name.trim(),
        coin_amount,
        bonus_coin,
        price,
        currency,
        is_active,
      ]
    );

    return normalizeCoinPackage(result.rows[0]);
  } catch (error) {
    logger.error('[CoinPackage Service] Error while creating package:', error);
    throw error;
  }
};

export const updateCoinPackage = async (packageId, data) => {
  const allowedFields = [
    'name',
    'coin_amount',
    'bonus_coin',
    'price',
    'currency',
    'is_active',
  ];

  const fields = [];
  const values = [];

  for (const field of allowedFields) {
    if (data[field] !== undefined) {
      fields.push(`${field} = $${fields.length + 1}`);
      values.push(field === 'name' && typeof data[field] === 'string' ? data[field].trim() : data[field]);
    }
  }

  if (fields.length === 0) {
    throw createHttpError('Khong co du lieu cap nhat goi coin', 400, 'NO_UPDATE_FIELDS');
  }

  values.push(packageId);

  try {
    const result = await pool.query(
      `UPDATE coin_package
       SET ${fields.join(', ')},
           updated_at = NOW()
       WHERE package_id = $${values.length}
       RETURNING package_id, name, coin_amount, bonus_coin,
                 (coin_amount + bonus_coin) AS total_coin,
                 price, currency, is_active, created_at, updated_at`,
      values
    );

    if (result.rowCount === 0) {
      throw createHttpError('Khong tim thay goi coin', 404, 'COIN_PACKAGE_NOT_FOUND');
    }

    return normalizeCoinPackage(result.rows[0]);
  } catch (error) {
    if (error.statusCode) {
      throw error;
    }

    logger.error('[CoinPackage Service] Error while updating package:', error);
    throw error;
  }
};

export const deactivateCoinPackage = async (packageId) => {
  try {
    const result = await pool.query(
      `UPDATE coin_package
       SET is_active = false,
           updated_at = NOW()
       WHERE package_id = $1
       RETURNING package_id, name, coin_amount, bonus_coin,
                 (coin_amount + bonus_coin) AS total_coin,
                 price, currency, is_active, created_at, updated_at`,
      [packageId]
    );

    if (result.rowCount === 0) {
      throw createHttpError('Khong tim thay goi coin', 404, 'COIN_PACKAGE_NOT_FOUND');
    }

    return normalizeCoinPackage(result.rows[0]);
  } catch (error) {
    if (error.statusCode) {
      throw error;
    }

    logger.error('[CoinPackage Service] Error while deactivating package:', error);
    throw error;
  }
};
