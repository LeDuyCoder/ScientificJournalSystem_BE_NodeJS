import { isValidUUID } from '../utils/validation.js';

const PAYMENT_METHODS = ['vnpay', 'momo', 'bank_transfer', 'stripe', 'paypal'];
const PAYMENT_STATUSES = ['pending', 'success', 'failed', 'cancelled', 'refunded'];
const WALLET_TRANSACTION_TYPES = ['deposit', 'spend', 'refund', 'admin_adjust'];

const isPositiveInteger = (value) => {
  const numberValue = Number(value);
  return Number.isInteger(numberValue) && numberValue > 0;
};

const isNonZeroInteger = (value) => {
  const numberValue = Number(value);
  return Number.isInteger(numberValue) && numberValue !== 0;
};

const isPositiveMoney = (value) => {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) && numberValue > 0;
};

const normalizeCoinPackageBody = (body) => {
  if (body.coinAmount !== undefined && body.coin_amount === undefined) {
    body.coin_amount = body.coinAmount;
  }

  if (body.bonusCoin !== undefined && body.bonus_coin === undefined) {
    body.bonus_coin = body.bonusCoin;
  }

  if (body.isActive !== undefined && body.is_active === undefined) {
    body.is_active = body.isActive;
  }

  if (typeof body.currency === 'string') {
    body.currency = body.currency.trim().toUpperCase();
  }

  return body;
};

export const validatePackageIdParam = (req, res, next) => {
  if (!isValidUUID(req.params.packageId)) {
    return res.status(400).json({
      success: false,
      code: 'INVALID_PACKAGE_ID',
      message: 'ID goi coin khong hop le',
    });
  }

  next();
};

export const validateTransactionIdParam = (req, res, next) => {
  if (!isValidUUID(req.params.transactionId)) {
    return res.status(400).json({
      success: false,
      code: 'INVALID_TRANSACTION_ID',
      message: 'ID giao dich thanh toan khong hop le',
    });
  }

  next();
};

export const validateUserIdParam = (req, res, next) => {
  if (!isValidUUID(req.params.userId)) {
    return res.status(400).json({
      success: false,
      code: 'INVALID_USER_ID',
      message: 'ID nguoi dung khong hop le',
    });
  }

  next();
};

export const validateCreateCoinPackage = (req, res, next) => {
  normalizeCoinPackageBody(req.body);

  const { name, coin_amount, bonus_coin = 0, price, currency = 'VND', is_active = true } = req.body;

  if (!name || typeof name !== 'string' || name.trim() === '') {
    return res.status(400).json({
      success: false,
      code: 'INVALID_COIN_PACKAGE_NAME',
      message: 'Ten goi coin khong duoc de trong',
    });
  }

  if (!isPositiveInteger(coin_amount)) {
    return res.status(400).json({
      success: false,
      code: 'INVALID_COIN_AMOUNT',
      message: 'So coin cua goi phai la so nguyen duong',
    });
  }

  if (!Number.isInteger(Number(bonus_coin)) || Number(bonus_coin) < 0) {
    return res.status(400).json({
      success: false,
      code: 'INVALID_BONUS_COIN',
      message: 'Coin khuyen mai phai la so nguyen khong am',
    });
  }

  if (!isPositiveMoney(price)) {
    return res.status(400).json({
      success: false,
      code: 'INVALID_PRICE',
      message: 'Gia goi coin phai lon hon 0',
    });
  }

  if (typeof currency !== 'string' || currency.trim() === '') {
    return res.status(400).json({
      success: false,
      code: 'INVALID_CURRENCY',
      message: 'Don vi tien te khong hop le',
    });
  }

  if (typeof is_active !== 'boolean') {
    return res.status(400).json({
      success: false,
      code: 'INVALID_IS_ACTIVE',
      message: 'Trang thai hoat dong cua goi coin khong hop le',
    });
  }

  req.body.coin_amount = Number(coin_amount);
  req.body.bonus_coin = Number(bonus_coin);
  req.body.price = Number(price);
  req.body.currency = currency;
  req.body.is_active = is_active;
  next();
};

export const validateUpdateCoinPackage = (req, res, next) => {
  normalizeCoinPackageBody(req.body);

  const allowedFields = ['name', 'coin_amount', 'bonus_coin', 'price', 'currency', 'is_active'];
  const hasUpdateField = allowedFields.some((field) => req.body[field] !== undefined);

  if (!hasUpdateField) {
    return res.status(400).json({
      success: false,
      code: 'NO_UPDATE_FIELDS',
      message: 'Khong co du lieu cap nhat goi coin',
    });
  }

  if (req.body.name !== undefined && (typeof req.body.name !== 'string' || req.body.name.trim() === '')) {
    return res.status(400).json({
      success: false,
      code: 'INVALID_COIN_PACKAGE_NAME',
      message: 'Ten goi coin khong duoc de trong',
    });
  }

  if (req.body.coin_amount !== undefined && !isPositiveInteger(req.body.coin_amount)) {
    return res.status(400).json({
      success: false,
      code: 'INVALID_COIN_AMOUNT',
      message: 'So coin cua goi phai la so nguyen duong',
    });
  }

  if (
    req.body.bonus_coin !== undefined
    && (!Number.isInteger(Number(req.body.bonus_coin)) || Number(req.body.bonus_coin) < 0)
  ) {
    return res.status(400).json({
      success: false,
      code: 'INVALID_BONUS_COIN',
      message: 'Coin khuyen mai phai la so nguyen khong am',
    });
  }

  if (req.body.price !== undefined && !isPositiveMoney(req.body.price)) {
    return res.status(400).json({
      success: false,
      code: 'INVALID_PRICE',
      message: 'Gia goi coin phai lon hon 0',
    });
  }

  if (req.body.currency !== undefined && (typeof req.body.currency !== 'string' || req.body.currency.trim() === '')) {
    return res.status(400).json({
      success: false,
      code: 'INVALID_CURRENCY',
      message: 'Don vi tien te khong hop le',
    });
  }

  if (req.body.is_active !== undefined && typeof req.body.is_active !== 'boolean') {
    return res.status(400).json({
      success: false,
      code: 'INVALID_IS_ACTIVE',
      message: 'Trang thai hoat dong cua goi coin khong hop le',
    });
  }

  if (req.body.coin_amount !== undefined) req.body.coin_amount = Number(req.body.coin_amount);
  if (req.body.bonus_coin !== undefined) req.body.bonus_coin = Number(req.body.bonus_coin);
  if (req.body.price !== undefined) req.body.price = Number(req.body.price);
  next();
};

export const validateCreatePayment = (req, res, next) => {
  if (req.body.package_id !== undefined && req.body.packageId === undefined) {
    req.body.packageId = req.body.package_id;
  }

  if (req.body.payment_method !== undefined && req.body.paymentMethod === undefined) {
    req.body.paymentMethod = req.body.payment_method;
  }

  if (!isValidUUID(req.body.packageId)) {
    return res.status(400).json({
      success: false,
      code: 'INVALID_PACKAGE_ID',
      message: 'ID goi coin khong hop le',
    });
  }

  if (typeof req.body.paymentMethod === 'string') {
    req.body.paymentMethod = req.body.paymentMethod.toLowerCase();
  }

  if (!PAYMENT_METHODS.includes(req.body.paymentMethod)) {
    return res.status(400).json({
      success: false,
      code: 'INVALID_PAYMENT_METHOD',
      message: 'Phuong thuc thanh toan khong hop le',
    });
  }

  next();
};

export const validateSpendCoins = (req, res, next) => {
  if (!isPositiveInteger(req.body.amount)) {
    return res.status(400).json({
      success: false,
      code: 'INVALID_COIN_AMOUNT',
      message: 'So coin can tieu phai la so nguyen duong',
    });
  }

  if (req.body.description !== undefined && typeof req.body.description !== 'string') {
    return res.status(400).json({
      success: false,
      code: 'INVALID_DESCRIPTION',
      message: 'Mo ta giao dich khong hop le',
    });
  }

  req.body.amount = Number(req.body.amount);
  next();
};

export const validateAdminAdjustWallet = (req, res, next) => {
  if (!isNonZeroInteger(req.body.amount)) {
    return res.status(400).json({
      success: false,
      code: 'INVALID_ADJUST_AMOUNT',
      message: 'So coin dieu chinh phai la so nguyen khac 0',
    });
  }

  if (req.body.description !== undefined && typeof req.body.description !== 'string') {
    return res.status(400).json({
      success: false,
      code: 'INVALID_DESCRIPTION',
      message: 'Mo ta giao dich khong hop le',
    });
  }

  req.body.amount = Number(req.body.amount);
  next();
};

export const validateWalletTransactionQuery = (req, res, next) => {
  if (req.query.userId !== undefined && !isValidUUID(req.query.userId)) {
    return res.status(400).json({
      success: false,
      code: 'INVALID_USER_ID',
      message: 'ID nguoi dung khong hop le',
    });
  }

  if (req.query.type !== undefined && !WALLET_TRANSACTION_TYPES.includes(req.query.type)) {
    return res.status(400).json({
      success: false,
      code: 'INVALID_WALLET_TRANSACTION_TYPE',
      message: 'Loai giao dich coin khong hop le',
    });
  }

  next();
};

export const validatePaymentQuery = (req, res, next) => {
  if (req.query.userId !== undefined && !isValidUUID(req.query.userId)) {
    return res.status(400).json({
      success: false,
      code: 'INVALID_USER_ID',
      message: 'ID nguoi dung khong hop le',
    });
  }

  if (req.query.status !== undefined && !PAYMENT_STATUSES.includes(req.query.status)) {
    return res.status(400).json({
      success: false,
      code: 'INVALID_PAYMENT_STATUS',
      message: 'Trang thai thanh toan khong hop le',
    });
  }

  if (typeof req.query.paymentMethod === 'string') {
    req.query.paymentMethod = req.query.paymentMethod.toLowerCase();
  }

  if (req.query.paymentMethod !== undefined && !PAYMENT_METHODS.includes(req.query.paymentMethod)) {
    return res.status(400).json({
      success: false,
      code: 'INVALID_PAYMENT_METHOD',
      message: 'Phuong thuc thanh toan khong hop le',
    });
  }

  next();
};
