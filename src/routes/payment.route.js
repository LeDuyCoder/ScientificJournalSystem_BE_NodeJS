import express from 'express';
import { verifyToken } from '../middlewares/auth.middleware.js';
import {
  createPayment,
  getPaymentById,
  getMyPayments,
  handleMomoIpn,
  handleVnpayIpn,
  handleVnpayReturn,
} from '../controllers/payment.controller.js';
import {
  validateCreatePayment,
  validatePaymentQuery,
  validateTransactionIdParam,
} from '../middlewares/coinValidation.middleware.js';

const router = express.Router();

/**
 * @swagger
 * /api/v1/payments/create:
 *   post:
 *     summary: Tao giao dich thanh toan nap coin
 *     tags:
 *       - Coin Payments
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - packageId
 *               - paymentMethod
 *             properties:
 *               packageId:
 *                 type: string
 *                 format: uuid
 *                 example: 3f7a1c0e-6f35-4f3c-a7e0-9df9f9a91942
 *               paymentMethod:
 *                 type: string
 *                 enum: [vnpay, momo, bank_transfer, stripe, paypal]
 *                 example: vnpay
 *     responses:
 *       201:
 *         description: Tao giao dich thanh toan thanh cong
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     transactionId:
 *                       type: string
 *                       format: uuid
 *                     paymentUrl:
 *                       type: string
 *                       example: https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?...
 *                     payment:
 *                       type: object
 *       400:
 *         description: Du lieu gui len khong hop le
 *       401:
 *         description: Chua xac thuc hoac token khong hop le
 *       404:
 *         description: Khong tim thay goi coin dang ban
 */
router.post('/create', verifyToken, validateCreatePayment, createPayment);

/**
 * @swagger
 * /api/v1/payments/me:
 *   get:
 *     summary: Lay lich su nap tien cua nguoi dung hien tai
 *     tags:
 *       - Coin Payments
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
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, success, failed, cancelled, refunded]
 *     responses:
 *       200:
 *         description: Lay lich su nap tien thanh cong
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
 *                       transaction_id:
 *                         type: string
 *                         format: uuid
 *                       package_name:
 *                         type: string
 *                       amount:
 *                         type: number
 *                       total_coin:
 *                         type: integer
 *                       payment_method:
 *                         type: string
 *                       payment_status:
 *                         type: string
 *                 pagination:
 *                   type: object
 *       401:
 *         description: Chua xac thuc hoac token khong hop le
 */
router.get('/me', verifyToken, validatePaymentQuery, getMyPayments);

/**
 * @swagger
 * /api/v1/payments/vnpay/return:
 *   get:
 *     summary: VNPay return URL sau khi nguoi dung thanh toan
 *     description: Endpoint nay chi nhan ket qua dieu huong tu VNPay. He thong chi cong coin khi VNPay IPN xac nhan thanh cong.
 *     tags:
 *       - Payment Callbacks
 *     parameters:
 *       - in: query
 *         name: vnp_TxnRef
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *       - in: query
 *         name: vnp_ResponseCode
 *         schema:
 *           type: string
 *           example: "00"
 *       - in: query
 *         name: vnp_SecureHash
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Da nhan ket qua VNPay return
 *       400:
 *         description: Thieu ma giao dich VNPay
 */
router.get('/vnpay/return', handleVnpayReturn);

/**
 * @swagger
 * /api/v1/payments/vnpay/ipn:
 *   post:
 *     summary: Xu ly VNPay IPN
 *     description: Xac thuc chu ky, cap nhat giao dich thanh success va cong coin neu thanh toan thanh cong. IPN lap lai se khong cong coin trung.
 *     tags:
 *       - Payment Callbacks
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               vnp_TxnRef:
 *                 type: string
 *                 format: uuid
 *               vnp_Amount:
 *                 type: string
 *                 example: "10000000"
 *               vnp_ResponseCode:
 *                 type: string
 *                 example: "00"
 *               vnp_TransactionStatus:
 *                 type: string
 *                 example: "00"
 *               vnp_TransactionNo:
 *                 type: string
 *               vnp_SecureHash:
 *                 type: string
 *     responses:
 *       200:
 *         description: Ket qua xac nhan IPN theo chuan VNPay
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 RspCode:
 *                   type: string
 *                   example: "00"
 *                 Message:
 *                   type: string
 *                   example: Confirm Success
 *   get:
 *     summary: Xu ly VNPay IPN dang query string
 *     description: Ho tro truong hop VNPay gui IPN bang GET.
 *     tags:
 *       - Payment Callbacks
 *     responses:
 *       200:
 *         description: Ket qua xac nhan IPN theo chuan VNPay
 */
router.post('/vnpay/ipn', handleVnpayIpn);
router.get('/vnpay/ipn', handleVnpayIpn);

/**
 * @swagger
 * /api/v1/payments/momo/ipn:
 *   post:
 *     summary: Xu ly MoMo IPN
 *     description: Xac thuc chu ky, cap nhat giao dich thanh success va cong coin neu thanh toan thanh cong.
 *     tags:
 *       - Payment Callbacks
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               orderId:
 *                 type: string
 *                 format: uuid
 *               requestId:
 *                 type: string
 *               amount:
 *                 type: number
 *               resultCode:
 *                 type: integer
 *                 example: 0
 *               transId:
 *                 type: string
 *               signature:
 *                 type: string
 *     responses:
 *       200:
 *         description: Ket qua xu ly MoMo IPN
 */
router.post('/momo/ipn', handleMomoIpn);

/**
 * @swagger
 * /api/v1/payments/{transactionId}:
 *   get:
 *     summary: Xem trang thai mot giao dich thanh toan
 *     tags:
 *       - Coin Payments
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: transactionId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Lay giao dich thanh toan thanh cong
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     transaction_id:
 *                       type: string
 *                       format: uuid
 *                     payment_status:
 *                       type: string
 *                       enum: [pending, success, failed, cancelled, refunded]
 *                     amount:
 *                       type: number
 *                     total_coin:
 *                       type: integer
 *                     paid_at:
 *                       type: string
 *                       format: date-time
 *                       nullable: true
 *       401:
 *         description: Chua xac thuc hoac token khong hop le
 *       404:
 *         description: Khong tim thay giao dich thanh toan
 */
router.get('/:transactionId', verifyToken, validateTransactionIdParam, getPaymentById);

export default router;
