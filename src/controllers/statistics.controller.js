import * as statisticsService from '../services/statistics.service.js';
import logger from '../utils/logger.js';

// Export reference to support unit tests mocking if needed
export const statisticsServiceRef = { ...statisticsService };

/**
 * API Handler lấy thống kê xu hướng xuất bản của user (số bài báo theo năm trong các project).
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export const getPublicationTrends = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { projectId, fromYear, toYear } = req.query;

    const data = await statisticsServiceRef.getPublicationTrends({
      userId,
      projectId,
      fromYear,
      toYear
    });

    if (!data || data.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No publication trend data",
        data: []
      });
    }

    return res.status(200).json({
      success: true,
      message: "Publication trend fetched successfully",
      data
    });
  } catch (error) {
    logger.error('[Statistics Controller] Lỗi khi lấy publication trends:', error.message);

    const statusCode = error.statusCode || 500;
    const errorCode = error.code || 'SERVER_ERROR';

    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Lỗi hệ thống khi lấy dữ liệu thống kê',
      code: errorCode,
      data: null
    });
  }
};
