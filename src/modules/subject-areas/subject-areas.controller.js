import * as subjectAreaService from "./subject-areas.service.js";
import logger from "../../utils/logger.js";

/**
 * API tạo mới một Subject Area.
 */
export const createSubjectArea = async (request, reply) => {
  try {
    const { display_name, description } = request.body;
    const newSubjectArea = await subjectAreaService.createSubjectArea({
      display_name,
      description
    });

    return reply.code(201).send({
      success: true,
      message: "Tạo Subject Area thành công",
      code: "CREATE_SUBJECT_AREA_SUCCESS",
      data: newSubjectArea
    });
  } catch (error) {
    logger.error("Lỗi khi tạo Subject Area ở controller:", error.message);
    return reply.code(500).send({
      success: false,
      message: "Lỗi hệ thống khi tạo mới Subject Area",
      code: "SERVER_ERROR",
      data: null
    });
  }
};

/**
 * API lấy danh sách Subject Area có hỗ trợ phân trang, lọc và tìm kiếm.
 */
export const getSubjectAreas = async (request, reply) => {
  try {
    const { page, limit, search, sort_by, sort_order } = request.query;
    const { items, total } = await subjectAreaService.getSubjectAreas({
      page,
      limit,
      search,
      sort_by,
      sort_order
    });

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit, 10) || 10);

    return reply.code(200).send({
      success: true,
      message: "Lấy danh sách subject area thành công",
      code: "GET_SUBJECT_AREAS_SUCCESS",
      data: {
        items,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total
        }
      }
    });
  } catch (error) {
    logger.error("Lỗi khi lấy danh sách Subject Area ở controller:", error.message);
    return reply.code(500).send({
      success: false,
      message: "Lỗi hệ thống khi lấy danh sách Subject Area",
      code: "SERVER_ERROR",
      data: null
    });
  }
};

/**
 * API lấy chi tiết một Subject Area theo ID.
 */
export const getSubjectAreaById = async (request, reply) => {
  try {
    const { id } = request.params;
    const subjectArea = await subjectAreaService.getSubjectAreaById(id);

    if (!subjectArea) {
      return reply.code(404).send({
        success: false,
        message: "Không tìm thấy Subject Area",
        code: "SUBJECT_AREA_NOT_FOUND",
        data: null
      });
    }

    return reply.code(200).send({
      success: true,
      message: "Lấy chi tiết subject area thành công",
      code: "GET_SUBJECT_AREA_SUCCESS",
      data: subjectArea
    });
  } catch (error) {
    logger.error(`Lỗi khi lấy chi tiết Subject Area ID ${request.params.id} ở controller:`, error.message);
    return reply.code(500).send({
      success: false,
      message: "Lỗi hệ thống khi lấy thông tin chi tiết Subject Area",
      code: "SERVER_ERROR",
      data: null
    });
  }
};

/**
 * API cập nhật thông tin Subject Area.
 */
export const updateSubjectArea = async (request, reply) => {
  try {
    const { id } = request.params;
    const { display_name, description } = request.body;

    const updatedSubjectArea = await subjectAreaService.updateSubjectArea(id, {
      display_name,
      description
    });

    return reply.code(200).send({
      success: true,
      message: "Cập nhật Subject Area thành công",
      code: "UPDATE_SUBJECT_AREA_SUCCESS",
      data: updatedSubjectArea
    });
  } catch (error) {
    logger.error(`Lỗi khi cập nhật Subject Area ID ${request.params.id} ở controller:`, error.message);
    return reply.code(500).send({
      success: false,
      message: "Lỗi hệ thống khi cập nhật Subject Area",
      code: "SERVER_ERROR",
      data: null
    });
  }
};

/**
 * API xóa mềm một Subject Area.
 */
export const deleteSubjectArea = async (request, reply) => {
  try {
    const { id } = request.params;

    // 1. Kiểm tra tồn tại
    const exists = await subjectAreaService.subjectAreaExist(id);
    if (!exists) {
      return reply.code(404).send({
        success: false,
        message: "Không tìm thấy Subject Area",
        code: "SUBJECT_AREA_NOT_FOUND",
        data: null
      });
    }

    // 2. Kiểm tra nếu đã bị xóa mềm
    const isDeleted = await subjectAreaService.subjectAreaIsDeleted(id);
    if (isDeleted) {
      return reply.code(400).send({
        success: false,
        message: "Không delete subject area đã bị delete",
        code: "SUBJECT_AREA_ALREADY_DELETED",
        data: null
      });
    }

    // 3. Thực hiện xóa mềm
    const deletedSubjectArea = await subjectAreaService.deleteSubjectArea(id);

    return reply.code(200).send({
      success: true,
      message: "Xóa Subject Area thành công",
      code: "DELETE_SUBJECT_AREA_SUCCESS",
      data: deletedSubjectArea
    });
  } catch (error) {
    logger.error(`Lỗi khi xóa mềm Subject Area ID ${request.params.id} ở controller:`, error.message);
    return reply.code(500).send({
      success: false,
      message: "Lỗi hệ thống khi xóa Subject Area",
      code: "SERVER_ERROR",
      data: null
    });
  }
};

/**
 * API khôi phục một Subject Area đã bị xóa mềm.
 */
export const restoreSubjectArea = async (request, reply) => {
  try {
    const { id } = request.params;

    // 1. Kiểm tra tồn tại
    const exists = await subjectAreaService.subjectAreaExist(id);
    if (!exists) {
      return reply.code(404).send({
        success: false,
        message: "Không tìm thấy Subject Area",
        code: "SUBJECT_AREA_NOT_FOUND",
        data: null
      });
    }

    // 2. Kiểm tra nếu chưa bị xóa mềm
    const isDeleted = await subjectAreaService.subjectAreaIsDeleted(id);
    if (!isDeleted) {
      return reply.code(400).send({
        success: false,
        message: "Không khôi phục subject area chưa bị delete",
        code: "SUBJECT_AREA_NOT_DELETED",
        data: null
      });
    }

    // 3. Thực hiện khôi phục
    const restoredSubjectArea = await subjectAreaService.restoreSubjectArea(id);

    return reply.code(200).send({
      success: true,
      message: "Khôi phục Subject Area thành công",
      code: "RESTORE_SUBJECT_AREA_SUCCESS",
      data: restoredSubjectArea
    });
  } catch (error) {
    logger.error(`Lỗi khi khôi phục Subject Area ID ${request.params.id} ở controller:`, error.message);
    return reply.code(500).send({
      success: false,
      message: "Lỗi hệ thống khi khôi phục Subject Area",
      code: "SERVER_ERROR",
      data: null
    });
  }
};

/**
 * API lấy thống kê liên quan tới Subject Area.
 */
export const getSubjectAreaStatistics = async (request, reply) => {
  try {
    const { id } = request.params;

    // 1. Kiểm tra tồn tại
    const exists = await subjectAreaService.subjectAreaExist(id);
    if (!exists) {
      return reply.code(404).send({
        success: false,
        message: "Không tìm thấy Subject Area",
        code: "SUBJECT_AREA_NOT_FOUND",
        data: null
      });
    }

    // 2. Chặn nếu đã bị xóa mềm
    const isDeleted = await subjectAreaService.subjectAreaIsDeleted(id);
    if (isDeleted) {
      return reply.code(404).send({
        success: false,
        message: "Không tìm thấy Subject Area",
        code: "SUBJECT_AREA_NOT_FOUND",
        data: null
      });
    }

    // 3. Lấy dữ liệu thống kê
    const stats = await subjectAreaService.getSubjectAreaStatistics(id);

    return reply.code(200).send({
      success: true,
      message: "Lấy thống kê subject area thành công",
      code: "GET_SUBJECT_AREA_STATISTICS_SUCCESS",
      data: stats
    });
  } catch (error) {
    logger.error(`Lỗi khi lấy thống kê Subject Area ID ${request.params.id} ở controller:`, error.message);
    return reply.code(500).send({
      success: false,
      message: "Lỗi hệ thống khi lấy thống kê Subject Area",
      code: "SERVER_ERROR",
      data: null
    });
  }
};
