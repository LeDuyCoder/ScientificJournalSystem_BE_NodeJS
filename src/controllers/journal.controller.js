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

/**
 * Controller lấy thông tin chi tiết của một journal theo ID.
 * - Kiểm tra tính hợp lệ của ID (phải là số nguyên dương).
 * - Gọi service để lấy thông tin journal từ database.
 * - Trả về thông tin journal nếu thành công, hoặc lỗi 400 nếu ID không hợp lệ, hoặc lỗi 500 nếu có lỗi hệ thống.
 *
 * @async
 * @param {import('express').Request} req - Express request, chứa params.id là ID của journal cần lấy
 * @param {import('express').Response} res - Express response, trả về JSON chứa thông tin journal hoặc lỗi
 * @returns {Promise<import('express').Response>} JSON response với thông tin journal hoặc lỗi
 */
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

/**
 * Controller tạo mới một journal.
 * - Nhận dữ liệu journal từ req.body, đã được validate bởi middleware trước đó.
 * - Gọi service để tạo mới journal trong database.
 * - Trả về thông tin journal mới tạo nếu thành công, hoặc lỗi 500 nếu có lỗi hệ thống.
 * @async
 * @param {import('express').Request} req - Express request, chứa body là dữ liệu journal cần tạo
 * @param {import('express').Response} res - Express response, trả về JSON chứa thông tin journal mới tạo hoặc lỗi
 * @returns {Promise<import('express').Response>} JSON response với thông tin journal mới tạo hoặc lỗi
 */
export const createJournal = async (req, res) => {
  try {
    const dataJournal = req.body;

    // Lúc này dữ liệu chắc chắn đã qua bộ lọc hợp lệ từ middleware
    const result = await journalService.createJournal(dataJournal);

    return res.status(201).json({
      success: true,
      message: 'Tạo Journal thành công',
      data: result
    });

  } catch (error) {
    // Bắt các lỗi phát sinh từ database (như lỗi trùng unique key, sai kiểu dữ liệu...)
    return res.status(500).json({
      success: false,
      message: 'Lỗi hệ thống khi tạo Journal',
      detail: error.message
    });
  }
};