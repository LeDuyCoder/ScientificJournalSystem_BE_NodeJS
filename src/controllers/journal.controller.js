import logger from '../utils/logger.js';
import * as journalService from '../services/journal.service.js';

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

    const result = await journalService.getJournals({
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

export const getJournalsById = async (req, res) => {
  try{
    const { id } = req.params;

    if (isNaN(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: "Id không hợp lệ",
      });
    }

    const journal = await journalService.getJournalsById(id);

    return res.status(200).json({
      success: true,
      message: 'Lấy journal thành công',
      data: journal
    });

  }catch(error){
    return res.status(500).json({
      success: false,
      message: 'Lỗi hệ thống khi lấy journal'
    });
  }
}