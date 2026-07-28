import express from 'express';
import { verifyToken } from '../middlewares/auth.middleware.js';
import {
  getMyWallet,
  getMyWalletTransactions,
  spendCoins,
} from '../controllers/wallet.controller.js';
import {
  validateSpendCoins,
  validateWalletTransactionQuery,
} from '../middlewares/coinValidation.middleware.js';

const router = express.Router();

/**
 * @swagger
 * /api/v1/wallet/me:
 *   get:
 *     summary: Lay thong tin vi coin cua nguoi dung hien tai
 *     tags:
 *       - Coin Wallet
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lay thong tin vi coin thanh cong
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 code:
 *                   type: string
 *                   example: GET_WALLET_SUCCESS
 *                 data:
 *                   type: object
 *                   properties:
 *                     wallet_id:
 *                       type: string
 *                       format: uuid
 *                     user_id:
 *                       type: string
 *                       format: uuid
 *                     balance:
 *                       type: integer
 *                       example: 1200
 *                     total_deposit:
 *                       type: integer
 *                       example: 2000
 *                     total_spent:
 *                       type: integer
 *                       example: 800
 *       401:
 *         description: Chua xac thuc hoac token khong hop le
 */
router.get('/me', verifyToken, getMyWallet);

/**
 * @swagger
 * /api/v1/wallet/me/transactions:
 *   get:
 *     summary: Lay lich su giao dich coin cua nguoi dung hien tai
 *     tags:
 *       - Coin Wallet
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [deposit, spend, refund, admin_adjust]
 *     responses:
 *       200:
 *         description: Lay lich su giao dich coin thanh cong
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       wallet_transaction_id:
 *                         type: string
 *                         format: uuid
 *                       type:
 *                         type: string
 *                         example: deposit
 *                       amount:
 *                         type: integer
 *                         example: 500
 *                       balance_before:
 *                         type: integer
 *                         example: 700
 *                       balance_after:
 *                         type: integer
 *                         example: 1200
 *                       description:
 *                         type: string
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *                 pagination:
 *                   type: object
 *       401:
 *         description: Chua xac thuc hoac token khong hop le
 */
router.get('/me/transactions', verifyToken, validateWalletTransactionQuery, getMyWalletTransactions);

/**
 * @swagger
 * /api/v1/wallet/spend:
 *   post:
 *     summary: Tieu coin cua nguoi dung hien tai
 *     tags:
 *       - Coin Wallet
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *             properties:
 *               amount:
 *                 type: integer
 *                 minimum: 1
 *                 example: 100
 *               description:
 *                 type: string
 *                 example: Mua khoa hoc Java
 *     responses:
 *       200:
 *         description: Tieu coin thanh cong
 *       400:
 *         description: Du lieu gui len khong hop le
 *       401:
 *         description: Chua xac thuc hoac token khong hop le
 *       409:
 *         description: So du coin khong du
 */
router.post('/spend', verifyToken, validateSpendCoins, spendCoins);

export default router;
