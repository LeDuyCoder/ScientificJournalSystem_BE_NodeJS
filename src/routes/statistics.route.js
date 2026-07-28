import express from 'express';
import { getPublicationTrends } from '../controllers/statistics.controller.js';
import { verifyToken } from '../middlewares/auth.middleware.js';
import { validatePublicationTrendsQuery } from '../middlewares/statisticsValidation.middleware.js';

const router = express.Router();

/**
 * @swagger
 * /api/v1/statistics/publication-trends:
 *   get:
 *     summary: Retrieve publication trends
 *     description: Fetch statistics about the number of publications per year for a user's projects.
 *     tags: [Statistics]
 *     parameters:
 *       - in: query
 *         name: projectId
 *         schema:
 *           type: string
 *         required: false
 *         description: The ID of a specific project (optional).
 *       - in: query
 *         name: fromYear
 *         schema:
 *           type: integer
 *         required: false
 *         description: Start year for the trends (optional).
 *       - in: query
 *         name: toYear
 *         schema:
 *           type: integer
 *         required: false
 *         description: End year for the trends (optional).
 *     responses:
 *       200:
 *         description: Successfully fetched publication trends.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Publication trend fetched successfully"
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       year:
 *                         type: integer
 *                         example: 2021
 *                       totalPublications:
 *                         type: integer
 *                         example: 5
 *       400:
 *         description: Validation error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "userId is required"
 *                 code:
 *                   type: string
 *                   example: "USER_ID_REQUIRED"
 *                 data:
 *                   type: object
 *                   nullable: true
 *                   example: null
 *       404:
 *         description: User or project not found.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Không tìm thấy người dùng với ID: {userId}"
 *                 code:
 *                   type: string
 *                   example: "USER_NOT_FOUND"
 *                 data:
 *                   type: object
 *                   nullable: true
 *                   example: null
 *       500:
 *         description: Internal server error.
 */
router.get('/publication-trends', verifyToken, validatePublicationTrendsQuery, getPublicationTrends);

export default router;
