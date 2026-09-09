import * as dashboardService from './dashboard.service.js';
import logger from '../../utils/logger.js';

export const getTrendingKeywords = async (req, reply) => {
    try {
        const userId = req.user.user_id;
        const { projectId, fromYear, toYear, metric, limit } = req.query;

        const chartData = await dashboardService.getTrendingKeywordsChart({
            userId,
            projectId,
            fromYear,
            toYear,
            metric,
            limit
        });

        return reply.send({
            success: true,
            message: 'Lấy dữ liệu biểu đồ xu hướng từ khóa thành công',
            data: chartData
        });
    } catch (error) {
        if (error.statusCode) {
            return reply.status(error.statusCode).send({
                success: false,
                code: error.code || 'BAD_REQUEST',
                message: error.message
            });
        }
        logger.error('[Dashboard Controller] Lỗi khi getTrendingKeywords:', error.message);
        return reply.status(500).send({
            success: false,
            message: 'Lỗi hệ thống khi lấy dữ liệu biểu đồ xu hướng từ khóa'
        });
    }
};
