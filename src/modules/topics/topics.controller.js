import * as topicService from "./topics.service.js";
import logger from "../../utils/logger.js";

/**
 * Lấy danh sách Topic
 */
export const getTopics = async (request, reply) => {
    try {
        const { page, limit, search, subject_area_id, subject_category_id, sort_by, sort_order } = request.query;

        // 1. Validate sort_by
        if (sort_by && !["topic_id", "display_name", "score"].includes(sort_by)) {
            return reply.code(400).send({
                success: false,
                code: "INVALID_FILTER",
                message: "sort_by không hợp lệ"
            });
        }

        // 2. Validate subject_area_id
        if (subject_area_id) {
            const saExists = await topicService.subjectAreaExist(subject_area_id);
            if (!saExists) {
                return reply.code(400).send({
                    success: false,
                    code: "INVALID_FILTER",
                    message: "subject_area_id không tồn tại"
                });
            }
        }

        // 3. Validate subject_category_id
        if (subject_category_id) {
            const scExists = await topicService.subjectCategoryExist(subject_category_id);
            if (!scExists) {
                return reply.code(400).send({
                    success: false,
                    code: "INVALID_FILTER",
                    message: "subject_category_id không tồn tại"
                });
            }
        }

        const result = await topicService.getTopics({
            page,
            limit,
            search,
            subject_area_id,
            subject_category_id,
            sort_by,
            sort_order
        });

        return reply.code(200).send({
            success: true,
            code: "GET_TOPICS_SUCCESS",
            message: "Lấy danh sách Topic thành công",
            data: result
        });
    } catch (error) {
        logger.error(`getTopics error: ${error.message}`);
        return reply.code(500).send({
            success: false,
            code: "SERVER_ERROR",
            message: "Có lỗi xảy ra ở Server!"
        });
    }
};

/**
 * Lấy chi tiết Topic
 */
export const getTopicById = async (request, reply) => {
    try {
        const { id } = request.params;

        const topic = await topicService.getTopicById(id);
        if (!topic) {
            return reply.code(404).send({
                success: false,
                code: "TOPIC_NOT_FOUND",
                message: "Topic không tồn tại"
            });
        }

        return reply.code(200).send({
            success: true,
            code: "GET_TOPIC_SUCCESS",
            message: "Lấy chi tiết Topic thành công",
            data: topic
        });
    } catch (error) {
        logger.error(`getTopicById error: ${error.message}`);
        return reply.code(500).send({
            success: false,
            code: "SERVER_ERROR",
            message: "Có lỗi xảy ra ở Server!"
        });
    }
};

/**
 * Tạo mới Topic
 */
export const createTopic = async (request, reply) => {
    try {
        const { display_name, score, subject_area_id, subject_category_id } = request.body;

        // 1. Validate display_name
        if (!display_name || typeof display_name !== 'string' || display_name.trim() === '') {
            return reply.code(400).send({
                success: false,
                code: "INVALID_TOPIC_DATA",
                message: "display_name là bắt buộc và phải là chuỗi không rỗng"
            });
        }

        // 2. Validate score
        if (score !== undefined && (typeof score !== 'number' || score < 0 || score > 1)) {
            return reply.code(400).send({
                success: false,
                code: "INVALID_TOPIC_DATA",
                message: "score phải là số từ 0 đến 1"
            });
        }

        // 3. Validate subject_area_id
        if (subject_area_id !== undefined && subject_area_id !== null) {
            const saExists = await topicService.subjectAreaExist(subject_area_id);
            if (!saExists) {
                return reply.code(400).send({
                    success: false,
                    code: "INVALID_TOPIC_DATA",
                    message: "subject_area_id không tồn tại trong hệ thống"
                });
            }
        }

        // 4. Validate subject_category_id
        if (subject_category_id !== undefined && subject_category_id !== null) {
            const scExists = await topicService.subjectCategoryExist(subject_category_id);
            if (!scExists) {
                return reply.code(400).send({
                    success: false,
                    code: "INVALID_TOPIC_DATA",
                    message: "subject_category_id không tồn tại trong hệ thống"
                });
            }
        }

        // 5. Kiểm tra trùng lặp display_name
        const { duplicateName } = await topicService.checkDuplicateTopic(display_name);
        if (duplicateName) {
            return reply.code(409).send({
                success: false,
                code: "TOPIC_NAME_DUPLICATED",
                message: "Tên Topic đã tồn tại trong hệ thống"
            });
        }

        // 6. Thực hiện tạo mới
        const newTopic = await topicService.createTopic({ display_name, score, subject_area_id, subject_category_id });

        return reply.code(201).send({
            success: true,
            code: "TOPIC_CREATED",
            message: "Tạo mới Topic thành công",
            data: newTopic
        });

    } catch (error) {
        logger.error(`createTopic error: ${error.message}`);
        return reply.code(500).send({
            success: false,
            code: "SERVER_ERROR",
            message: "Có lỗi xảy ra ở Server!"
        });
    }
};

/**
 * Lấy danh sách bài báo theo topic
 */
export const getArticlesByTopic = async (request, reply) => {
  try {
    const topicId = parseInt(request.params.id, 10);
    
    // 2. Kiểm tra topic có tồn tại không
    const topic = await topicService.getTopicById(topicId);
    if (!topic) {
      return reply.code(404).send({
        success: false,
        code: "TOPIC_NOT_FOUND",
        message: `Topic với id = ${topicId} không tồn tại trong hệ thống.`,
      });
    }

    // 3. Phân trang
    const page = Number(request.query.page) || 1;
    const limit = Number(request.query.limit) || 10;
    const offset = (page - 1) * limit;

    // 4. Gọi service song song (lấy data + đếm tổng)
    const [articles, total] = await Promise.all([
      topicService.getArticlesByTopicId(topicId, limit, offset),
      topicService.countArticlesByTopicId(topicId),
    ]);

    // 5. Trả response
    return reply.code(200).send({
      success: true,
      message: "Lấy danh sách bài báo theo topic thành công",
      data: {
        topic: {
          topic_id: topic.topic_id,
          display_name: topic.display_name,
        },
        articles: articles.map((a) => ({
          article_id: a.article_id,
          title: a.title,
          publication_year: a.publication_year,
          doi: a.doi,
        })),
        pagination: {
          page,
          limit,
          total,
        },
      },
    });
  } catch (error) {
    logger.error("getArticlesByTopic error:", error);
    return reply.code(500).send({
      success: false,
      code: "SERVER_ERROR",
      message: "Có lỗi xảy ra ở Server!",
    });
  }
};

/**
 * Xóa mềm bài báo (đặt is_deleted = true)
 */
export const deleteTopic = async (request, reply) => {
    try {
        const { id } = request.params;

        // 1. Kiểm tra tồn tại
        const topicExists = await topicService.topicExists(id);
        if (!topicExists) {
            return reply.code(404).send({
                success: false,
                code: "TOPIC_NOT_FOUND",
                message: "Topic không tồn tại"
            });
        }

        // 2. Kiểm tra xem đã bị xóa mềm chưa
        const isDeleted = await topicService.topicIsDeleted(id);
        if (isDeleted) {
            return reply.code(400).send({
                success: false,
                code: "TOPIC_ALREADY_DELETED",
                message: "Topic đã bị xóa từ trước"
            });
        }

        // 3. Thực hiện xóa mềm
        const deletedTopic = await topicService.deleteTopic(id);

        return reply.code(200).send({
            success: true,
            code: "TOPIC_DELETED",
            message: "Xóa Topic thành công",
            data: deletedTopic
        });

    } catch (error) {
        logger.error(`deleteTopic error: ${error.message}`);
        return reply.code(500).send({
            success: false,
            code: "SERVER_ERROR",
            message: "Có lỗi xảy ra ở Server!"
        });
    }
};

/**
 * Khôi phục Topic đã xóa mềm (đặt is_deleted = false)
 */
export const restoreTopic = async (request, reply) => {
    try {
        const { id } = request.params;

        // 1. Kiểm tra tồn tại
        const topicExists = await topicService.topicExists(id);
        if (!topicExists) {
            return reply.code(404).send({
                success: false,
                code: "TOPIC_NOT_FOUND",
                message: "Topic không tồn tại"
            });
        }

        // 2. Kiểm tra xem có đang bị xóa mềm không
        const isDeleted = await topicService.topicIsDeleted(id);
        if (!isDeleted) {
            return reply.code(400).send({
                success: false,
                code: "TOPIC_NOT_DELETED",
                message: "Topic chưa bị xóa, không thể khôi phục"
            });
        }

        // 3. Thực hiện khôi phục
        const restoredTopic = await topicService.restoreTopic(id);

        return reply.code(200).send({
            success: true,
            code: "TOPIC_RESTORED",
            message: "Khôi phục Topic thành công",
            data: restoredTopic
        });

    } catch (error) {
        logger.error(`restoreTopic error: ${error.message}`);
        return reply.code(500).send({
            success: false,
            code: "SERVER_ERROR",
            message: "Có lỗi xảy ra ở Server!"
        });
    }
};

/**
 * Cập nhật thông tin Topic
 */
export const updateTopic = async (request, reply) => {
    try {
        const { id } = request.params;
        const { display_name, score, subject_area_id, subject_category_id } = request.body;

        // 1. Validate body
        if (display_name !== undefined && (typeof display_name !== 'string' || display_name.trim() === '')) {
            return reply.code(400).send({
                success: false,
                code: "INVALID_TOPIC_DATA",
                message: "display_name phải là chuỗi không rỗng"
            });
        }

        if (score !== undefined && (typeof score !== 'number' || score < 0 || score > 1)) {
            return reply.code(400).send({
                success: false,
                code: "INVALID_TOPIC_DATA",
                message: "score phải là số từ 0 đến 1"
            });
        }

        if (subject_area_id !== undefined) {
            const saExists = await topicService.subjectAreaExist(subject_area_id);
            if (!saExists) {
                return reply.code(400).send({
                    success: false,
                    code: "INVALID_TOPIC_DATA",
                    message: "subject_area_id không tồn tại trong hệ thống"
                });
            }
        }

        if (subject_category_id !== undefined) {
            const scExists = await topicService.subjectCategoryExist(subject_category_id);
            if (!scExists) {
                return reply.code(400).send({
                    success: false,
                    code: "INVALID_TOPIC_DATA",
                    message: "subject_category_id không tồn tại trong hệ thống"
                });
            }
        }

        // 2. Kiểm tra tồn tại
        const topicExists = await topicService.topicExists(id);
        if (!topicExists) {
            return reply.code(404).send({
                success: false,
                code: "TOPIC_NOT_FOUND",
                message: "Topic không tồn tại"
            });
        }

        // 3. Kiểm tra xem đã bị xóa mềm chưa
        const isDeleted = await topicService.topicIsDeleted(id);
        if (isDeleted) {
            return reply.code(400).send({
                success: false,
                code: "TOPIC_DELETED",
                message: "Không thể cập nhật Topic đã bị xóa mềm"
            });
        }

        // 4. Thực hiện cập nhật
        const updatedTopic = await topicService.updateTopic(id, { display_name, score, subject_area_id, subject_category_id });
        
        if (!updatedTopic) {
             return reply.code(400).send({
                success: false,
                code: "NO_DATA_UPDATED",
                message: "Không có trường hợp lệ nào được cập nhật"
            });
        }

        return reply.code(200).send({
            success: true,
            code: "TOPIC_UPDATED",
            message: "Cập nhật Topic thành công",
            data: updatedTopic
        });

    } catch (error) {
        logger.error(`updateTopic error: ${error.message}`);
        return reply.code(500).send({
            success: false,
            code: "SERVER_ERROR",
            message: "Có lỗi xảy ra ở Server!"
        });
    }
};
