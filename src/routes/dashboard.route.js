import express from 'express';
import { getTrendingKeywords } from '../controllers/dashboard.controller.js';
import { verifyToken } from '../middlewares/auth.middleware.js';
import { validateTrendingKeywordsQuery } from '../middlewares/dashboardValidation.middleware.js';

const router = express.Router();

/**
 * @swagger
 * /api/v1/dashboard/trending-keywords:
 *   get:
 *     summary: Get trending keywords chart data
 *     description: Return chart-ready data for top trending keywords of the authenticated user's projects.
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: projectId
 *         schema:
 *           type: integer
 *         required: false
 *         description: Filter by a specific project ID belonging to the authenticated user.
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         required: false
 *         description: Maximum number of keywords to return.
 *       - in: query
 *         name: fromYear
 *         schema:
 *           type: integer
 *         required: false
 *         description: Start publication year filter.
 *       - in: query
 *         name: toYear
 *         schema:
 *           type: integer
 *         required: false
 *         description: End publication year filter.
 *       - in: query
 *         name: metric
 *         schema:
 *           type: string
 *           enum: [articleCount, citationCount, avgScore]
 *           default: articleCount
 *         required: false
 *         description: Metric used to rank trending keywords.
 *     responses:
 *       200:
 *         description: Trending keywords chart data.
 *       400:
 *         description: Invalid query parameters.
 *       401:
 *         description: Missing or invalid access token.
 *       403:
 *         description: Project does not belong to current user.
 *       500:
 *         description: Internal server error.
 */
router.get('/trending-keywords', verifyToken, validateTrendingKeywordsQuery, getTrendingKeywords);

export default router;
