import * as subjectCategoryService from "./subject-categories.service.js";
import logger from "../../utils/logger.js";

/**
 * API tạo mới một Subject Category.
 */
export const createSubjectCategory = async (request, reply) => {
  try {
    const { subject_area_id, display_name, description } = request.body;
    const newSubjectCategory = await subjectCategoryService.createSubjectCategory({
      subject_area_id,
      display_name,
      description
    });

    return reply.code(201).send({
      success: true,
      message: "Tạo Subject Category thành công",
      code: "CREATE_SUBJECT_CATEGORY_SUCCESS",
      data: newSubjectCategory
    });
  } catch (error) {
    logger.error("Lỗi khi tạo Subject Category ở controller:", error.message);
    return reply.code(500).send({
      success: false,
      message: "Lỗi hệ thống khi tạo mới Subject Category",
      code: "SERVER_ERROR",
      data: null
    });
  }
};

/**
 * API lấy danh sách Subject Category có hỗ trợ phân trang, lọc theo Subject Area và tìm kiếm.
 */
export const getSubjectCategories = async (request, reply) => {
  try {
    const { page, limit, search, subject_area_id, sort_by, sort_order } = request.query;
    const { items, total } = await subjectCategoryService.getSubjectCategories({
      page,
      limit,
      search,
      subject_area_id,
      sort_by,
      sort_order
    });

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit, 10) || 10);

    return reply.code(200).send({
      success: true,
      message: "Lấy danh sách subject category thành công",
      code: "GET_SUBJECT_CATEGORIES_SUCCESS",
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
    logger.error("Lỗi khi lấy danh sách Subject Category ở controller:", error.message);
    return reply.code(500).send({
      success: false,
      message: "Lỗi hệ thống khi lấy danh sách Subject Category",
      code: "SERVER_ERROR",
      data: null
    });
  }
};

/**
 * API lấy chi tiết một Subject Category theo ID.
 */
export const getSubjectCategoryById = async (request, reply) => {
  try {
    const { id } = request.params;
    const subjectCategory = await subjectCategoryService.getSubjectCategoryById(id);

    if (!subjectCategory) {
      return reply.code(404).send({
        success: false,
        message: "Không tìm thấy Subject Category",
        code: "SUBJECT_CATEGORY_NOT_FOUND",
        data: null
      });
    }

    return reply.code(200).send({
      success: true,
      message: "Lấy chi tiết subject category thành công",
      code: "GET_SUBJECT_CATEGORY_SUCCESS",
      data: subjectCategory
    });
  } catch (error) {
    logger.error(`Lỗi khi lấy chi tiết Subject Category ID ${request.params.id} ở controller:`, error.message);
    return reply.code(500).send({
      success: false,
      message: "Lỗi hệ thống khi lấy thông tin chi tiết Subject Category",
      code: "SERVER_ERROR",
      data: null
    });
  }
};

/**
 * API cập nhật thông tin Subject Category.
 */
export const updateSubjectCategory = async (request, reply) => {
  try {
    const { id } = request.params;
    const { subject_area_id, display_name, description } = request.body;

    const updatedSubjectCategory = await subjectCategoryService.updateSubjectCategory(id, {
      subject_area_id,
      display_name,
      description
    });

    return reply.code(200).send({
      success: true,
      message: "Cập nhật Subject Category thành công",
      code: "UPDATE_SUBJECT_CATEGORY_SUCCESS",
      data: updatedSubjectCategory
    });
  } catch (error) {
    logger.error(`Lỗi khi cập nhật Subject Category ID ${request.params.id} ở controller:`, error.message);
    return reply.code(500).send({
      success: false,
      message: "Lỗi hệ thống khi cập nhật Subject Category",
      code: "SERVER_ERROR",
      data: null
    });
  }
};

/**
 * API xóa mềm một Subject Category.
 */
export const deleteSubjectCategory = async (request, reply) => {
  try {
    const { id } = request.params;

    // 1. Kiểm tra tồn tại
    const exists = await subjectCategoryService.subjectCategoryExist(id);
    if (!exists) {
      return reply.code(404).send({
        success: false,
        message: "Không tìm thấy Subject Category",
        code: "SUBJECT_CATEGORY_NOT_FOUND",
        data: null
      });
    }

    // 2. Kiểm tra nếu đã bị xóa mềm
    const isDeleted = await subjectCategoryService.subjectCategoryIsDeleted(id);
    if (isDeleted) {
      return reply.code(400).send({
        success: false,
        message: "Không delete subject category đã bị delete",
        code: "SUBJECT_CATEGORY_ALREADY_DELETED",
        data: null
      });
    }

    // 3. Thực hiện xóa mềm
    const deletedSubjectCategory = await subjectCategoryService.deleteSubjectCategory(id);

    return reply.code(200).send({
      success: true,
      message: "Xóa Subject Category thành công",
      code: "DELETE_SUBJECT_CATEGORY_SUCCESS",
      data: deletedSubjectCategory
    });
  } catch (error) {
    logger.error(`Lỗi khi xóa mềm Subject Category ID ${request.params.id} ở controller:`, error.message);
    return reply.code(500).send({
      success: false,
      message: "Lỗi hệ thống khi xóa Subject Category",
      code: "SERVER_ERROR",
      data: null
    });
  }
};

/**
 * API khôi phục một Subject Category đã bị xóa mềm.
 */
export const restoreSubjectCategory = async (request, reply) => {
  try {
    const { id } = request.params;

    // 1. Kiểm tra tồn tại
    const exists = await subjectCategoryService.subjectCategoryExist(id);
    if (!exists) {
      return reply.code(404).send({
        success: false,
        message: "Không tìm thấy Subject Category",
        code: "SUBJECT_CATEGORY_NOT_FOUND",
        data: null
      });
    }

    // 2. Kiểm tra nếu chưa bị xóa mềm
    const isDeleted = await subjectCategoryService.subjectCategoryIsDeleted(id);
    if (!isDeleted) {
      return reply.code(400).send({
        success: false,
        message: "Không khôi phục subject category chưa bị delete",
        code: "SUBJECT_CATEGORY_NOT_DELETED",
        data: null
      });
    }

    // 3. Thực hiện khôi phục
    const restoredSubjectCategory = await subjectCategoryService.restoreSubjectCategory(id);

    return reply.code(200).send({
      success: true,
      message: "Khôi phục Subject Category thành công",
      code: "RESTORE_SUBJECT_CATEGORY_SUCCESS",
      data: restoredSubjectCategory
    });
  } catch (error) {
    logger.error(`Lỗi khi khôi phục Subject Category ID ${request.params.id} ở controller:`, error.message);
    return reply.code(500).send({
      success: false,
      message: "Lỗi hệ thống khi khôi phục Subject Category",
      code: "SERVER_ERROR",
      data: null
    });
  }
};

/**
 * API lấy thống kê liên quan tới Subject Category.
 */
export const getSubjectCategoryStatistics = async (request, reply) => {
  try {
    const { id } = request.params;

    // 1. Kiểm tra tồn tại
    const exists = await subjectCategoryService.subjectCategoryExist(id);
    if (!exists) {
      return reply.code(404).send({
        success: false,
        message: "Không tìm thấy Subject Category",
        code: "SUBJECT_CATEGORY_NOT_FOUND",
        data: null
      });
    }

    // 2. Chặn nếu đã bị xóa mềm
    const isDeleted = await subjectCategoryService.subjectCategoryIsDeleted(id);
    if (isDeleted) {
      return reply.code(404).send({
        success: false,
        message: "Không tìm thấy Subject Category",
        code: "SUBJECT_CATEGORY_NOT_FOUND",
        data: null
      });
    }

    // 3. Lấy dữ liệu thống kê
    const stats = await subjectCategoryService.getSubjectCategoryStatistics(id);

    return reply.code(200).send({
      success: true,
      message: "Lấy thống kê subject category thành công",
      code: "GET_SUBJECT_CATEGORY_STATISTICS_SUCCESS",
      data: stats
    });
  } catch (error) {
    logger.error(`Lỗi khi lấy thống kê Subject Category ID ${request.params.id} ở controller:`, error.message);
    return reply.code(500).send({
      success: false,
      message: "Lỗi hệ thống khi lấy thống kê Subject Category",
      code: "SERVER_ERROR",
      data: null
    });
  }
};
