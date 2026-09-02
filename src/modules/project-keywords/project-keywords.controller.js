import * as projectKeywordsService from "./project-keywords.service.js";
import logger from "../../utils/logger.js";
import cacheService from '../../services/cache.service.js';
import crypto from 'crypto';

export const getTrendingKeywords = async (request, reply) => {
  try {
    const projectId = parseInt(request.params.projectId);

    const cacheKey = `keywords:trending:project:${projectId}:${crypto.createHash('md5').update(JSON.stringify(request.query)).digest('hex')}`;
    const cachedData = await cacheService.get(cacheKey);
    if (cachedData) return reply.code(200).send(cachedData);

    const result = await projectKeywordsService.getTrendingKeywords(projectId, request.query);

    const responseData = {
      success: true,
      message: "Lấy danh sách từ khóa trending thành công",
      data: result,
    };
    await cacheService.set(cacheKey, responseData);
    return reply.code(200).send(responseData);
  } catch (error) {
    logger.error("[Project Keywords Controller] Lỗi khi lấy trending keywords:", error);
    return reply.code(500).send({
      success: false,
      message: "Có lỗi xảy ra ở server khi lấy trending keywords",
    });
  }
};

export const getWatchedKeywordArticles = async (request, reply) => {
  try {
    const projectId = parseInt(request.params.projectId);
    const userId = request.user.user_id;

    const result = await projectKeywordsService.getWatchedKeywordArticles(
      projectId,
      userId,
      request.query,
    );

    return reply.code(200).send({
      success: true,
      message: "Lấy luồng bài báo từ từ khóa theo dõi thành công",
      data: result.data,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        total_pages: result.total_pages,
      },
    });
  } catch (error) {
    if (error.statusCode === 400) {
      return reply.code(400).send({
        success: false,
        message: error.message,
      });
    }
    logger.error("[Project Keywords Controller] Lỗi khi lấy watched keyword articles:", error);
    return reply.code(500).send({
      success: false,
      message: "Có lỗi xảy ra ở server khi lấy bài báo theo dõi",
    });
  }
};

export const watchKeywords = async (request, reply) => {
  try {
    const projectId = parseInt(request.params.projectId);
    const { keyword_ids } = request.body || {};

    const result = await projectKeywordsService.addWatchedKeywords(projectId, keyword_ids);

    if (!result.success) {
      return reply.code(400).send({
        success: false,
        code: "ERROR_KEYWORDS_ALREADY_WATCHED",
        message: "Có từ khóa đã tồn tại trong danh sách theo dõi của dự án, không thể thêm mới",
      });
    }

    return reply.code(201).send({
      success: true,
      code: "SUCCESS_CREATE_WATCHED_KEYWORDS",
      message: `Thêm thành công ${result.insertedCount} từ khóa vào danh sách theo dõi`,
    });
  } catch (error) {
    logger.error("[watchKeywords] Error:", error);
    return reply.code(500).send({
      success: false,
      code: "ERROR_SERVER_CREATE_WATCHED_KEYWORD",
      message: "Có lỗi xảy ra ở Server!",
    });
  }
};

export const deleteWatchedKeyword = async (request, reply) => {
  try {
    const projectId = parseInt(request.params.projectId);
    const keywordId = parseInt(request.params.keywordId);

    const userId = request.user.user_id;
    const isOwner = await projectKeywordsService.checkProjectOwnership(projectId, userId);
    if (!isOwner) {
      return reply.code(403).send({
        success: false,
        code: "ERROR_FORBIDDEN_DELETE_WATCHED_KEYWORD",
        message: "Không tìm thấy dự án hoặc bạn không có quyền truy cập dự án này",
      });
    }

    const isDeleted = await projectKeywordsService.removeWatchedKeyword(projectId, keywordId);

    if (!isDeleted) {
      return reply.code(404).send({
        success: false,
        code: "ERROR_KEYWORD_NOT_FOUND",
        message: "Từ khóa không nằm trong danh sách theo dõi của dự án",
      });
    }

    return reply.code(200).send({
      success: true,
      code: "SUCCESS_DELETE_WATCHED_KEYWORD",
      message: "Đã xóa từ khóa khỏi dự án thành công",
    });
  } catch (error) {
    logger.error("[deleteWatchedKeyword] Lỗi khi xóa từ khóa theo dõi:", error);
    return reply.code(500).send({
      success: false,
      code: "ERROR_SERVER_DELETE_WATCHED_KEYWORD",
      message: "Có lỗi xảy ra ở server khi xóa từ khóa",
    });
  }
};

export const updateWatchedKeywords = async (request, reply) => {
  try {
    const projectId = parseInt(request.params.projectId);
    const { keyword_ids } = request.body || {};

    await projectKeywordsService.replaceWatchedKeywords(projectId, keyword_ids || []);

    return reply.code(200).send({
      success: true,
      code: "SUCCESS_UPDATE_WATCHED_KEYWORD",
      message: "Cập nhật danh sách từ khóa theo dõi thành công",
    });
  } catch (error) {
    logger.error("[updateWatchedKeywords] Lỗi khi cập nhật từ khóa theo dõi:", error);
    return reply.code(500).send({
      success: false,
      code: "ERROR_SERVER_UPDATE_WATCHED_KEYWORD",
      message: "Có lỗi xảy ra ở server khi cập nhật từ khóa",
    });
  }
};
