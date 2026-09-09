import * as journalService from "./journals.service.js";
import logger from "../../utils/logger.js";

const JOURNAL_CODES = {
  JOURNAL_LIST_FETCHED: "JOURNAL_LIST_FETCHED",
  JOURNAL_FETCHED: "JOURNAL_FETCHED",
  JOURNAL_CREATED: "JOURNAL_CREATED",
  JOURNAL_UPDATED: "JOURNAL_UPDATED",
  JOURNAL_DELETED: "JOURNAL_DELETED",
  JOURNAL_RESTORED: "JOURNAL_RESTORED",
  JOURNAL_NOT_FOUND: "JOURNAL_NOT_FOUND",
  INVALID_ID: "INVALID_ID",
  SERVER_ERROR: "SERVER_ERROR",
};

export const getJournalsController = async (request, reply) => {
  try {
    const result = await journalService.getJournals(request.query);
    const limit = parseInt(request.query.limit, 10) || 10;
    const page = parseInt(request.query.page, 10) || 1;

    return reply.code(200).send({
      success: true,
      message: "Lấy danh sách journal thành công",
      data: {
        items: result.items,
        pagination: {
          page: page,
          limit: limit,
          total: result.total,
        },
      },
    });
  } catch (error) {
    logger.error("Lỗi khi lấy danh sách journals:", error.message);
    return reply.code(500).send({
      success: false,
      message: "Lỗi hệ thống khi lấy danh sách journals",
      error: error.message,
    });
  }
};

export const getJournalsByIdController = async (request, reply) => {
  try {
    const journalId = request.params.id;
    const journalData = await journalService.getJournalsById(journalId);

    if (journalData) {
      return reply.code(200).send({
        success: true,
        message: "Lấy journal thành công",
        data: journalData,
      });
    } else {
      return reply.code(404).send({
        success: false,
        message: "Không tìm thấy journal",
      });
    }
  } catch (error) {
    logger.error(`Lỗi khi lấy journal với ID ${request.params.id}:`, error.message);
    return reply.code(500).send({
      success: false,
      message: "Lỗi hệ thống khi lấy journal",
      error: error.message,
    });
  }
};

export const createJournalController = async (request, reply) => {
  try {
    const newJournal = await journalService.createJournal(request.body);
    return reply.code(201).send({
      success: true,
      code: JOURNAL_CODES.JOURNAL_CREATED,
      message: "Tạo Journal thành công",
      data: newJournal,
    });
  } catch (error) {
    logger.error("Lỗi khi tạo Journal:", error.message);
    return reply.code(500).send({
      success: false,
      code: "CREATE_JOURNAL_ERROR",
      message: "Lỗi hệ thống khi tạo Journal",
    });
  }
};

export const updateJournalController = async (request, reply) => {
  try {
    const { id } = request.params;
    const updatedJournal = await journalService.updateJournal(id, request.body);

    if (updatedJournal) {
      return reply.code(200).send({
        success: true,
        code: JOURNAL_CODES.JOURNAL_UPDATED,
        message: "Cập nhật Journal thành công",
        data: updatedJournal,
      });
    } else {
      return reply.code(404).send({
        success: false,
        code: JOURNAL_CODES.JOURNAL_NOT_FOUND,
        message: "Không tìm thấy journal",
      });
    }
  } catch (error) {
    logger.error(`Lỗi hệ thống khi cập nhật Journal ID ${request.params.id}:`, error.message);
    return reply.code(500).send({
      success: false,
      code: JOURNAL_CODES.SERVER_ERROR,
      message: "Lỗi hệ thống khi cập nhật Journal",
    });
  }
};

export const deleteJournalController = async (request, reply) => {
  try {
    const { id } = request.params;
    const deletedJournal = await journalService.deleteJournal(id);

    if (deletedJournal) {
      return reply.code(200).send({
        success: true,
        code: JOURNAL_CODES.JOURNAL_DELETED,
        message: "Xóa Journal thành công",
        data: deletedJournal,
      });
    } else {
      return reply.code(404).send({
        success: false,
        code: JOURNAL_CODES.JOURNAL_NOT_FOUND,
        message: "Không tìm thấy journal",
      });
    }
  } catch (error) {
    logger.error(`Lỗi hệ thống khi xóa Journal ID ${request.params.id}:`, error.message);
    return reply.code(500).send({
      success: false,
      code: JOURNAL_CODES.SERVER_ERROR,
      message: "Lỗi hệ thống khi xóa Journal",
    });
  }
};

export const restoreJournalController = async (request, reply) => {
  try {
    const { id } = request.params;
    const restoredJournal = await journalService.restoreJournal(id);

    if (restoredJournal) {
      return reply.code(200).send({
        success: true,
        code: JOURNAL_CODES.JOURNAL_RESTORED,
        message: "Khôi phục Journal thành công",
        data: restoredJournal,
      });
    } else {
      return reply.code(404).send({
        success: false,
        code: JOURNAL_CODES.JOURNAL_NOT_FOUND,
        message: "Không tìm thấy journal",
      });
    }
  } catch (error) {
    logger.error(`Lỗi hệ thống khi khôi phục Journal ID ${request.params.id}:`, error.message);
    return reply.code(500).send({
      success: false,
      code: JOURNAL_CODES.SERVER_ERROR,
      message: "Lỗi hệ thống khi khôi phục Journal",
    });
  }
};
