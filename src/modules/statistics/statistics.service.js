import * as statisticsRepository from './statistics.repository.js';
import logger from '../../utils/logger.js';
import cacheService from '../../services/cache.service.js';

const mapPublicationTrendRow = (row) => ({
    year: parseInt(row.year, 10),
    totalPublications: parseInt(row.totalPublications, 10) || 0,
});

export const getPublicationTrends = async ({ userId, projectId, fromYear, toYear }) => {
    const cacheKey = `trends:${userId}:${projectId || 'all'}:${fromYear || 'any'}:${toYear || 'any'}`;
    const cached = await cacheService.get(cacheKey);
    if (cached) return cached;

    const userIsPresent = await statisticsRepository.userExists(userId);
    if (!userIsPresent) {
        const error = new Error(`Không tìm thấy người dùng với ID: ${userId}`);
        error.statusCode = 404;
        error.code = 'USER_NOT_FOUND';
        throw error;
    }

    if (projectId) {
        const isOwned = await statisticsRepository.projectBelongsToUser(projectId, userId);
        if (!isOwned) {
            const error = new Error(`Dự án với ID ${projectId} không tồn tại hoặc không thuộc về người dùng này`);
            error.statusCode = 404;
            error.code = 'PROJECT_NOT_FOUND';
            throw error;
        }
    }

    const rows = await statisticsRepository.getPublicationTrendsByUserProjects({
        userId,
        projectId,
        fromYear: fromYear ? parseInt(fromYear, 10) : null,
        toYear: toYear ? parseInt(toYear, 10) : null
    });

    const result = rows.map(mapPublicationTrendRow);
    await cacheService.set(cacheKey, result, 600); // 10 mins cache
    return result;
};
