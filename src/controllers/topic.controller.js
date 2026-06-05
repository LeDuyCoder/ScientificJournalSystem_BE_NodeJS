import * as topicService from "../services/topic.service.js";
import logger from "../utils/logger.js";

/**
 * API Handler: Lấy danh sách bài báo theo topic
 * Method: GET /api/v1/topics/:id/articles?page=...&limit=...
 *
 * @param {import('express').Request} req  - Express Request (chứa req.params.id, req.query.page, req.query.limit)
 * @param {import('express').Response} res - Express Response
 * @returns {Promise<import('express').Response>} JSON chứa topic info, danh sách bài báo và thông tin phân trang
 */
export const getArticlesByTopic = async (req, res) => {
  try {
    // 1. Validate topic_id
    const topicId = parseInt(req.params.id);
    if (isNaN(topicId) || topicId <= 0) {
      return res.status(400).json({
        success: false,
        code: "TOPIC_ID_INVALID",
        message: "topic_id không hợp lệ. Vui lòng truyền một số nguyên dương.",
      });
    }

    // 2. Kiểm tra topic có tồn tại không
    const topic = await topicService.getTopicById(topicId);
    if (!topic) {
      return res.status(404).json({
        success: false,
        code: "TOPIC_NOT_FOUND",
        message: `Topic với id = ${topicId} không tồn tại trong hệ thống.`,
      });
    }

    // 3. Phân trang
    let page = 1;
    let limit = 10;

    if (req.query.page !== undefined) {
      page = Number(req.query.page);
      if (!Number.isInteger(page) || page <= 0) {
        return res.status(400).json({
          success: false,
          code: "PAGE_INVALID",
          message: "page phải là số nguyên dương.",
        });
      }
    }

    if (req.query.limit !== undefined) {
      limit = Number(req.query.limit);
      if (!Number.isInteger(limit) || limit <= 0) {
        return res.status(400).json({
          success: false,
          code: "LIMIT_INVALID",
          message: "limit phải là số nguyên dương.",
        });
      }
    }

    const offset = (page - 1) * limit;

    // 4. Gọi service song song (lấy data + đếm tổng)
    const [articles, total] = await Promise.all([
      topicService.getArticlesByTopicId(topicId, limit, offset),
      topicService.countArticlesByTopicId(topicId),
    ]);

    // 5. Trả response
    return res.status(200).json({
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
    return res.status(500).json({
      success: false,
      code: "SERVER_ERROR",
      message: "Có lỗi xảy ra ở Server!",
    });
  }
};
