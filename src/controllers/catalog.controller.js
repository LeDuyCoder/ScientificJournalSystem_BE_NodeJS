import * as catalogService from '../services/catalog.service.js';
import logger from '../utils/logger.js';

/**
 * Controller lấy danh sách journal có tìm kiếm và phân trang.
 *
 * @async
 * @param {import('express').Request} req - Express request.
 * @param {import('express').Response} res - Express response.
 * @returns {Promise<import('express').Response>} JSON danh sách journal và phân trang.
 */
export const getJournals = async (req, res) => {
  try {
    const { search, page = 1, limit = 10 } = req.query;

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);

    if (isNaN(pageNum) || pageNum <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Tham số page phải là số nguyên dương lớn hơn 0'
      });
    }

    if (isNaN(limitNum) || limitNum <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Tham số limit phải là số nguyên dương lớn hơn 0'
      });
    }

    const result = await catalogService.getJournals({
      search,
      page: pageNum,
      limit: limitNum
    });

    return res.status(200).json({
      success: true,
      message: 'Lấy danh sách journal thành công',
      data: {
        items: result.items,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: result.total
        }
      }
    });
  } catch (error) {
    logger.error('Lỗi khi lấy danh sách journal trong catalog:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi hệ thống khi lấy danh sách journal'
    });
  }
};

/**
 * Controller lấy danh sách các lĩnh vực học thuật lớn (Subject Area).
 *
 * @async
 * @param {import('express').Request} req - Express request.
 * @param {import('express').Response} res - Express response.
 * @returns {Promise<import('express').Response>} JSON danh sách subject areas.
 */
export const getSubjectAreas = async (req, res) => {
  try {
    const result = await catalogService.getSubjectAreas();
    return res.status(200).json({
      success: true,
      message: 'Lấy danh sách subject area thành công',
      data: result
    });
  } catch (error) {
    logger.error('Lỗi khi lấy danh sách subject areas:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi hệ thống khi lấy danh sách subject areas'
    });
  }
};

/**
 * Controller lấy danh sách các chuyên ngành hẹp (Subject Category) kèm theo bộ lọc subject_area_id.
 *
 * @async
 * @param {import('express').Request} req - Express request.
 * @param {import('express').Response} res - Express response.
 * @returns {Promise<import('express').Response>} JSON danh sách subject categories.
 */
export const getSubjectCategories = async (req, res) => {
  try {
    const { subject_area_id } = req.query;

    const result = await catalogService.getSubjectCategories({
      subjectAreaId: subject_area_id
    });

    return res.status(200).json({
      success: true,
      message: 'Lấy danh sách subject category thành công',
      data: result
    });
  } catch (error) {
    logger.error('Lỗi khi lấy danh sách subject categories:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi hệ thống khi lấy danh sách subject categories'
    });
  }
};

/**
 * Controller lấy lịch sử ranking của một journal theo ID và các bộ lọc.
 *
 * @async
 * @param {import('express').Request} req - Express request.
 * @param {import('express').Response} res - Express response.
 * @returns {Promise<import('express').Response>} JSON lịch sử xếp hạng ranking của journal.
 */
export const getJournalRankings = async (req, res) => {
  try {
    const { id } = req.params;
    const { year, metric_code, quartile, source } = req.query;

    if (!id || id.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'ID của journal không được bỏ trống'
      });
    }

    const result = await catalogService.getJournalRankings(id.trim(), {
      year,
      metric_code,
      quartile,
      source
    });

    return res.status(200).json({
      success: true,
      message: 'Lấy lịch sử ranking của journal thành công',
      data: result
    });
  } catch (error) {
    logger.error(`Lỗi khi lấy lịch sử ranking cho journal ${req.params?.id}:`, error);

    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Lỗi hệ thống khi lấy lịch sử ranking của journal'
    });
  }
};
