import * as dashboardService from '../services/dashboard.service.js';
import logger from '../utils/logger.js';

// Export reference to support unit tests mocking if needed
export const dashboardServiceRef = { ...dashboardService };

/**
 * API Handler lấy thống kê xu hướng từ khóa của user.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export const getTrendingKeywords = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { projectId, limit, fromYear, toYear, metric } = req.query;

    const chart = await dashboardServiceRef.getTrendingKeywordsChart({
      userId,
      projectId,
      fromYear,
      toYear,
      metric,
      limit
    });

    if (!chart || !chart.labels || chart.labels.length === 0) {
      // Determine the default dataset label for the empty response structure
      let datasetLabel = "Number of Articles";
      const activeMetric = metric || 'articleCount';
      if (activeMetric === 'citationCount') {
        datasetLabel = "Total Citations";
      } else if (activeMetric === 'avgScore') {
        datasetLabel = "Average Score";
      }

      return res.status(200).json({
        success: true,
        message: "No keyword data",
        chart: {
          type: "horizontal-bar",
          metric: activeMetric,
          labels: [],
          datasets: [
            {
              label: datasetLabel,
              data: []
            }
          ]
        }
      });
    }

    return res.status(200).json({
      success: true,
      message: "Trending keywords",
      chart
    });
  } catch (error) {
    logger.error('[Dashboard Controller] Lỗi khi lấy trending keywords:', error.message);

    const statusCode = error.statusCode || 500;
    const errorCode = error.code || 'SERVER_ERROR';

    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Lỗi hệ thống khi lấy dữ liệu từ khóa xu hướng',
      code: errorCode,
      data: null
    });
  }
};
