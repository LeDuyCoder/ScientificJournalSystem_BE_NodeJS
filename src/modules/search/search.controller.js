import * as searchService from './search.service.js';
import logger from '../../utils/logger.js';

export const search = async (req, reply) => {
    try {
        const { keyword } = req.params;
        const { limit } = req.query;

        const results = await searchService.performSearch(keyword.trim(), limit);

        return reply.send({
            success: true,
            code: 'SEARCH_SUCCESS',
            data: results
        });
    } catch (error) {
        logger.error('Lỗi khi thực hiện search:', error);
        return reply.status(500).send({
            success: false,
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Lỗi hệ thống khi tìm kiếm'
        });
    }
};
