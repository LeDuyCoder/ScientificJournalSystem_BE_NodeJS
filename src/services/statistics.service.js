import * as statisticsRepository from '../repositories/statistics.repository.js';
import { PublicationTrendDTO } from '../dtos/publicationTrend.dto.js';
import logger from '../utils/logger.js';
import cacheService from './cache.service.js';

/**
 * Lấy thống kê xu hướng xuất bản (số lượng bài báo theo từng năm) từ các project của user.
 *
 * @async
 * @param {Object} params
 * @param {string} params.userId - UUID của người dùng.
 * @param {string|number|null} params.projectId - ID của project.
 * @param {number|null} params.fromYear - Năm bắt đầu.
 * @param {number|null} params.toYear - Năm kết thúc.
 * @returns {Promise<Array<PublicationTrendDTO>>}
 * @throws {Error} Ném lỗi 404 nếu không tìm thấy User hoặc Project không thuộc quyền quản lý của User.
 */
export const getPublicationTrends = async ({ userId, projectId, fromYear, toYear }) => {
  const cacheKey = `trends:${userId}:${projectId || 'all'}:${fromYear || 'any'}:${toYear || 'any'}`;
  const cached = await cacheService.get(cacheKey);
  if (cached) return cached;

  try {
    // 1. Kiểm tra User có tồn tại không
    const userIsPresent = await statisticsRepository.userExists(userId);
    if (!userIsPresent) {
      const error = new Error(`Không tìm thấy người dùng với ID: ${userId}`);
      error.statusCode = 404;
      error.code = 'USER_NOT_FOUND';
      throw error;
    }

    // 2. Nếu có projectId, kiểm tra Project có thuộc về User không
    if (projectId) {
      const isOwned = await statisticsRepository.projectBelongsToUser(projectId, userId);
      if (!isOwned) {
        const error = new Error(`Dự án với ID ${projectId} không tồn tại hoặc không thuộc về người dùng này`);
        error.statusCode = 404;
        error.code = 'PROJECT_NOT_FOUND';
        throw error;
      }
    }

    // 3. Thực hiện truy vấn dữ liệu từ DB
    const rows = await statisticsRepository.getPublicationTrendsByUserProjects({
      userId,
      projectId,
      fromYear,
      toYear
    });

    // 4. Map dữ liệu trả về qua DTO
    const result = rows.map(row => new PublicationTrendDTO(row));
    await cacheService.set(cacheKey, result, 600); // 10 mins cache
    return result;
  } catch (error) {
    logger.error('[Statistics Service] Lỗi khi xử lý getPublicationTrends:', error.message);
    throw error;
  }
};
