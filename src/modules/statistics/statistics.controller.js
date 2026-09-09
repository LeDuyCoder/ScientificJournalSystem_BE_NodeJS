import * as statisticsService from './statistics.service.js';
import logger from '../../utils/logger.js';

export const getPublicationTrends = async (req, reply) => {
    try {
        const userId = req.user.user_id;
        const { projectId, fromYear, toYear } = req.query;

        const data = await statisticsService.getPublicationTrends({
            userId,
            projectId,
            fromYear,
            toYear
        });

        if (!data || data.length === 0) {
            return reply.send({
                success: true,
                message: "No publication trend data",
                data: []
            });
        }

        return reply.send({
            success: true,
            message: "Publication trend fetched successfully",
            data
        });
    } catch (error) {
        logger.error('[Statistics Controller] Lỗi khi lấy publication trends:', error.message);

        const statusCode = error.statusCode || 500;
        const errorCode = error.code || 'SERVER_ERROR';

        return reply.status(statusCode).send({
            success: false,
            message: error.message || 'Lỗi hệ thống khi lấy dữ liệu thống kê',
            code: errorCode,
            data: null
        });
    }
};
