import * as adminService from '../services/admin.service.js';
import logger from '../utils/logger.js';
import * as logService from '../services/log.service.js';

/**
 * Controller xử lý yêu cầu lấy số liệu thống kê tổng quan (Dashboard Summary) dành cho Admin.
 * Tuyến đường (Route) này sẽ gọi đến Admin Service để tổng hợp số lượng Journal, Article, User,...
 * 
 * @async
 * @param {import('express').Request} req - Đối tượng Request của Express
 * @param {import('express').Response} res - Đối tượng Response của Express dùng để trả về kết quả
 * @returns {Promise<import('express').Response>} Trả về đối tượng Response với định dạng JSON:
 * - **200**: Nếu lấy dữ liệu thống kê thành công (kèm theo object `data`).
 * - **500**: Nếu có lỗi xảy ra ở phía Server (Database, Network,...).
 */
export const summary = async (req, res) => {
    try{
        const data = await adminService.summary();
        
        return res.status(200).json({
            success: true,
            code: "GET_SUMMARY_SUCCESS",
            message: "Lấy số liệu thống kê tổng quan thành công",
            data
        });
    }catch(error){
        logger.error("Lỗi khi lấy số liệu tổng quan (Admin Controller):", error);
        return res.status(500).json({
            success: false,
            code: "INTERNAL_SERVER_ERROR",
            message: "Lỗi hệ thống khi lấy số liệu thống kê"
        });
    }
}

/**
 * Controller xử lý yêu cầu lấy dữ liệu biểu đồ Publication Trends.
 * Trả về số lượng bài báo gửi vào và xuất bản qua các năm (mặc định 5 năm).
 * 
 * @async
 * @param {import('express').Request} req 
 * @param {import('express').Response} res 
 */
export const publicationTrends = async (req, res) => {
    try {
        const { year, limit } = req.query;
        const data = await adminService.getPublicationTrends(year, limit);
        
        return res.status(200).json({
            success: true,
            code: "GET_PUBLICATION_TRENDS_SUCCESS",
            message: "Lấy dữ liệu biểu đồ xu hướng xuất bản thành công",
            data
        });
    } catch (error) {
        logger.error("Lỗi khi lấy publication trends (Admin Controller):", error);
        return res.status(500).json({
            success: false,
            code: "INTERNAL_SERVER_ERROR",
            message: "Lỗi hệ thống khi lấy dữ liệu biểu đồ"
        });
    }
};

/**
 * Controller xử lý yêu cầu lấy danh sách hoạt động gần đây của hệ thống.
 * Dữ liệu được lấy từ bảng system_log và có phân trang.
 * 
 * @async
 * @param {import('express').Request} req 
 * @param {import('express').Response} res 
 * @returns {Promise<import('express').Response>}
 */
export const getRecentActivities = async (req, res) => {
    try {
        const options = {
            page: parseInt(req.query.page, 10) || 1,
            limit: parseInt(req.query.limit, 10) || 10,
        };

        const { logs, pagination } = await logService.getLogs(options);

        return res.status(200).json({
            success: true,
            code: "GET_RECENT_ACTIVITIES_SUCCESS",
            message: "Lấy danh sách hoạt động gần đây thành công",
            data: logs,
            pagination: pagination
        });
    } catch (error) {
        logger.error("Lỗi khi lấy hoạt động gần đây (Admin Controller):", error);
        return res.status(500).json({
            success: false,
            code: "INTERNAL_SERVER_ERROR",
            message: "Lỗi hệ thống khi lấy hoạt động gần đây"
        });
    }
};

/**
 * Controller lấy danh sách trạng thái Volume & Issue cho Admin Dashboard.
 * 
 * @async
 * @param {import('express').Request} req 
 * @param {import('express').Response} res 
 * @returns {Promise<import('express').Response>}
 */
export const getVolumeIssueStatus = async (req, res) => {
    try {
        const options = {
            page: parseInt(req.query.page, 10) || 1,
            limit: parseInt(req.query.limit, 10) || 10,
        };

        const result = await adminService.getVolumeIssueStatus(options);

        return res.status(200).json({
            success: true,
            code: "GET_VOLUME_ISSUE_STATUS_SUCCESS",
            message: "Lấy danh sách Volume & Issue Status thành công",
            data: result.items,
            pagination: result.pagination
        });
    } catch (error) {
        logger.error("Lỗi khi lấy Volume & Issue Status (Admin Controller):", error);
        return res.status(500).json({
            success: false,
            code: "INTERNAL_SERVER_ERROR",
            message: "Lỗi hệ thống khi lấy Volume & Issue Status"
        });
    }
};

/**
 * Controller xử lý yêu cầu export danh sách Volume & Issue Status ra file CSV.
 * 
 * @async
 * @param {import('express').Request} req 
 * @param {import('express').Response} res 
 */
export const exportVolumeIssueStatusCSV = async (req, res) => {
    try {
        const data = await adminService.exportVolumeIssueStatus();

        // Tạo nội dung CSV
        const header = ['Volume ID', 'Volume Number', 'Publication Year', 'Journal Name', 'Total Issues', 'Status', 'Progress'];
        const rows = data.map(item => [
            item.volume_id,
            item.volume_number,
            item.publication_year,
            `"${(item.journal_name || '').replace(/"/g, '""')}"`, // Xử lý dấu nháy kép và dấu phẩy trong tên journal
            item.total_issues,
            item.status,
            `${item.progress}%`
        ]);

        const csvContent = [header.join(','), ...rows.map(row => row.join(','))].join('\n');

        // Ghi log hành động export
        logService.createLog({
            userId: req.user?.user_id,
            userRole: req.user?.role,
            action: 'EXPORT',
            source: 'ADMIN_PANEL',
            entityTable: 'Volume',
            message: 'Admin đã export dữ liệu Volume & Issue Status ra file CSV.',
            metadata: { ip: req.ip, total_records: data.length }
        });

        // Đặt header trả về file CSV
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', 'attachment; filename="volume_issue_status.csv"');
        
        // Trả về BOM (\uFEFF) để Excel nhận diện đúng UTF-8
        return res.status(200).send('\uFEFF' + csvContent);
    } catch (error) {
        logger.error("Lỗi khi export Volume & Issue Status (Admin Controller):", error);
        return res.status(500).json({
            success: false,
            code: "INTERNAL_SERVER_ERROR",
            message: "Lỗi hệ thống khi export dữ liệu"
        });
    }
};