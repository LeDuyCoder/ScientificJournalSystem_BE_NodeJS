import catalogService from "../services/catalog.service.js";
import logger from "../utils/logger.js";

/**
 * API lấy danh sách volume
 */
export const getVolumes = async (req, res) => {
  try {
    const { journal_id } = req.query;

    // Validate journal_id
    if (
      journal_id &&
      (!/^\d+$/.test(journal_id) || parseInt(journal_id) <= 0)
    ) {
      return res.status(400).json({
        success: false,
        message: "journal_id không hợp lệ",
      });
    }

    const volumes = await catalogService.getVolumes(journal_id);

    return res.status(200).json({
      success: true,
      message: "Lấy danh sách volume thành công",
      data: volumes,
    });
  } catch (error) {
    logger.error("[Catalog Controller] Lỗi khi lấy volumes:", error);

    return res.status(500).json({
      success: false,
      message: "Có lỗi xảy ra ở server khi lấy danh sách volume",
    });
  }
};

/**
 * API lấy danh sách issue
 */
export const getIssues = async (req, res) => {
  try {
    const { volume_id } = req.query;

    // Validate volume_id
    if (volume_id && (!/^\d+$/.test(volume_id) || parseInt(volume_id) <= 0)) {
      return res.status(400).json({
        success: false,
        message: "volume_id không hợp lệ",
      });
    }

    const issues = await catalogService.getIssues(volume_id);

    return res.status(200).json({
      success: true,
      message: "Lấy danh sách issue thành công",
      data: issues,
    });
  } catch (error) {
    logger.error("[Catalog Controller] Lỗi khi lấy issues:", error);

    return res.status(500).json({
      success: false,
      message: "Có lỗi xảy ra ở server khi lấy danh sách issue",
    });
  }
};
