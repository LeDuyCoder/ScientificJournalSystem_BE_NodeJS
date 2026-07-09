import express from 'express';
import { getCoinPackages } from '../controllers/coinPackage.controller.js';

const router = express.Router();

/**
 * @swagger
 * /api/v1/coin-packages:
 *   get:
 *     summary: Lay danh sach goi coin dang ban
 *     tags:
 *       - Coin Packages
 *     responses:
 *       200:
 *         description: Lay danh sach goi coin thanh cong
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
 *                   example: GET_COIN_PACKAGES_SUCCESS
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       package_id:
 *                         type: string
 *                         format: uuid
 *                       name:
 *                         type: string
 *                         example: Goi 500 coin
 *                       coin_amount:
 *                         type: integer
 *                         example: 500
 *                       bonus_coin:
 *                         type: integer
 *                         example: 50
 *                       total_coin:
 *                         type: integer
 *                         example: 550
 *                       price:
 *                         type: number
 *                         example: 100000
 *                       currency:
 *                         type: string
 *                         example: VND
 *                       is_active:
 *                         type: boolean
 *                         example: true
 */
router.get('/', getCoinPackages);

export default router;
