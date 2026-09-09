import * as volumeService from "./volumes.service.js";
import logger from "../../utils/logger.js";

/**
 * API tạo mới một Volume.
 */
export const createVolume = async (request, reply) => {
  try {
    const { journal_id, volume_number, publication_year } = request.body;
    
    // Business logic validation
    const journalExists = await volumeService.journalExist(journal_id);
    if (!journalExists) {
      return reply.code(400).send({
        success: false,
        code: "JOURNAL_NOT_FOUND",
        message: "journal_id không tồn tại hoặc đã bị xóa mềm trong hệ thống",
      });
    }

    const isDuplicate = await volumeService.checkDuplicateVolume(journal_id, volume_number);
    if (isDuplicate) {
      return reply.code(400).send({
        success: false,
        code: "DUPLICATE_VOLUME",
        message: "Số volume đã tồn tại trong cùng journal này",
      });
    }

    const newVolume = await volumeService.createVolume({
      journal_id,
      volume_number,
      publication_year,
    });

    return reply.code(201).send({
      success: true,
      code: "CREATE_VOLUME_SUCCESS",
      message: "Tạo Volume thành công",
      data: newVolume,
    });
  } catch (error) {
    logger.error("Lỗi khi tạo Volume ở controller:", error.message);
    return reply.code(500).send({
      success: false,
      code: "SERVER_ERROR",
      message: "Lỗi hệ thống khi tạo mới Volume",
    });
  }
};

/**
 * API lấy danh sách Volume có hỗ trợ phân trang, lọc, sắp xếp và tìm kiếm.
 */
export const getVolumes = async (request, reply) => {
  try {
    const {
      page,
      limit,
      search,
      journal_id,
      publication_year,
      sort_by,
      sort_order,
    } = request.query;

    const { items, total } = await volumeService.getVolumes({
      page,
      limit,
      search,
      journal_id,
      publication_year,
      sort_by,
      sort_order,
    });

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit, 10) || 10);

    return reply.code(200).send({
      success: true,
      code: "GET_VOLUMES_SUCCESS",
      message: "Lấy danh sách volume thành công",
      data: {
        items,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
        },
      },
    });
  } catch (error) {
    logger.error("Lỗi khi lấy danh sách Volume ở controller:", error.message);
    return reply.code(500).send({
      success: false,
      code: "SERVER_ERROR",
      message: "Lỗi hệ thống khi lấy danh sách Volume",
    });
  }
};

/**
 * API lấy chi tiết một Volume theo ID.
 */
export const getVolumeById = async (request, reply) => {
  try {
    const { id } = request.params;
    const volume = await volumeService.getVolumeById(id);

    if (!volume) {
      return reply.code(404).send({
        success: false,
        code: "VOLUME_NOT_FOUND",
        message: "Không tìm thấy volume hoặc volume đã bị xóa mềm",
      });
    }

    return reply.code(200).send({
      success: true,
      code: "GET_VOLUME_DETAIL_SUCCESS",
      message: "Lấy chi tiết volume thành công",
      data: volume,
    });
  } catch (error) {
    logger.error(
      `Lỗi khi lấy chi tiết Volume ID ${request.params.id} ở controller:`,
      error.message,
    );
    return reply.code(500).send({
      success: false,
      code: "SERVER_ERROR",
      message: "Lỗi hệ thống khi lấy thông tin chi tiết Volume",
    });
  }
};

/**
 * API cập nhật thông tin Volume.
 */
export const updateVolume = async (request, reply) => {
  try {
    const { id } = request.params;
    const { volume_number, publication_year } = request.body;

    const volume = await volumeService.getVolumeByIdInternal(id);
    if (!volume) {
      return reply.code(404).send({
        success: false,
        code: "VOLUME_NOT_FOUND",
        message: "Volume không tồn tại",
      });
    }

    if (volume.is_deleted) {
      return reply.code(400).send({
        success: false,
        code: "VOLUME_ALREADY_DELETED",
        message: "Volume đã bị xóa mềm, không thể cập nhật",
      });
    }

    const finalVolNum = volume_number !== undefined ? Number(volume_number) : volume.volume_number;
    const isDuplicate = await volumeService.checkDuplicateVolume(volume.journal_id, finalVolNum, id);
    if (isDuplicate) {
      return reply.code(400).send({
        success: false,
        code: "DUPLICATE_VOLUME",
        message: "Số volume đã tồn tại trong cùng journal này",
      });
    }

    const updatedVolume = await volumeService.updateVolume(id, {
      volume_number,
      publication_year,
    });

    return reply.code(200).send({
      success: true,
      code: "UPDATE_VOLUME_SUCCESS",
      message: "Cập nhật Volume thành công",
      data: updatedVolume,
    });
  } catch (error) {
    logger.error(
      `Lỗi khi cập nhật Volume ID ${request.params.id} ở controller:`,
      error.message,
    );
    return reply.code(500).send({
      success: false,
      code: "SERVER_ERROR",
      message: "Lỗi hệ thống khi cập nhật Volume",
    });
  }
};

/**
 * API xóa mềm một Volume (is_deleted = true).
 */
export const deleteVolume = async (request, reply) => {
  try {
    const { id } = request.params;

    const exists = await volumeService.volumeExist(id);
    if (!exists) {
      return reply.code(404).send({
        success: false,
        code: "VOLUME_NOT_FOUND",
        message: "Volume không tồn tại",
      });
    }

    const isDeleted = await volumeService.volumeIsDeleted(id);
    if (isDeleted) {
      return reply.code(400).send({
        success: false,
        code: "VOLUME_ALREADY_DELETED",
        message: "Không delete volume đã bị delete",
      });
    }

    const deletedVolume = await volumeService.deleteVolume(id);

    return reply.code(200).send({
      success: true,
      code: "DELETE_VOLUME_SUCCESS",
      message: "Xóa Volume thành công",
      data: deletedVolume,
    });
  } catch (error) {
    logger.error(
      `Lỗi khi xóa mềm Volume ID ${request.params.id} ở controller:`,
      error.message,
    );
    return reply.code(500).send({
      success: false,
      code: "SERVER_ERROR",
      message: "Lỗi hệ thống khi xóa Volume",
    });
  }
};

/**
 * API khôi phục một Volume đã bị xóa mềm (is_deleted = false).
 */
export const restoreVolume = async (request, reply) => {
  try {
    const { id } = request.params;

    const exists = await volumeService.volumeExist(id);
    if (!exists) {
      return reply.code(404).send({
        success: false,
        code: "VOLUME_NOT_FOUND",
        message: "Volume không tồn tại",
      });
    }

    const isDeleted = await volumeService.volumeIsDeleted(id);
    if (!isDeleted) {
      return reply.code(400).send({
        success: false,
        code: "VOLUME_NOT_DELETED",
        message: "Không khôi phục volume chưa bị delete",
      });
    }

    const restoredVolume = await volumeService.restoreVolume(id);

    return reply.code(200).send({
      success: true,
      code: "RESTORE_VOLUME_SUCCESS",
      message: "Khôi phục Volume thành công",
      data: restoredVolume,
    });
  } catch (error) {
    logger.error(
      `Lỗi khi khôi phục Volume ID ${request.params.id} ở controller:`,
      error.message,
    );
    return reply.code(500).send({
      success: false,
      code: "SERVER_ERROR",
      message: "Lỗi hệ thống khi khôi phục Volume",
    });
  }
};
