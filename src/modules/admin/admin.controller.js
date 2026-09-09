import * as adminService from './admin.service.js';
import * as logService from '../../services/log.service.js';
import logger from '../../utils/logger.js';

export const summary = async (req, reply) => {
    try {
        const data = await adminService.summary();
        return reply.send({
            success: true,
            code: 'GET_SUMMARY_SUCCESS',
            message: 'Lấy số liệu thống kê tổng quan thành công',
            data,
        });
    } catch (error) {
        logger.error('[Admin Controller] Lỗi get summary:', error);
        return reply.status(500).send({ success: false, message: 'Lỗi hệ thống server' });
    }
};

export const publicationTrends = async (req, reply) => {
    try {
        const { year, limit } = req.query;
        const data = await adminService.getPublicationTrends(year, limit);
        return reply.send({
            success: true,
            code: 'GET_PUBLICATION_TRENDS_SUCCESS',
            message: 'Lấy dữ liệu biểu đồ xu hướng xuất bản thành công',
            data,
        });
    } catch (error) {
        logger.error('[Admin Controller] Lỗi get publication trends:', error);
        return reply.status(500).send({ success: false, message: 'Lỗi hệ thống server' });
    }
};

export const getVolumeIssueStatus = async (req, reply) => {
    try {
        const result = await adminService.getVolumeIssueStatus({ page: req.query.page, limit: req.query.limit });
        return reply.send({
            success: true,
            code: 'GET_VOLUME_ISSUE_STATUS_SUCCESS',
            message: 'Lấy danh sách Volume & Issue Status thành công',
            data: result.items,
            pagination: result.pagination,
        });
    } catch (error) {
        logger.error('[Admin Controller] Lỗi get volume issue status:', error);
        return reply.status(500).send({ success: false, message: 'Lỗi hệ thống server' });
    }
};

export const exportVolumeIssueStatusCSV = async (req, reply) => {
    try {
        const data = await adminService.exportVolumeIssueStatus();

        if (!data || data.length === 0) {
            reply.header('Content-Type', 'text/csv; charset=utf-8');
            reply.header('Content-Disposition', 'attachment; filename="volume_issue_status.csv"');
            return reply.send('volume_id,volume_number,publication_year,journal_name,total_issues,status,progress\n');
        }

        const header = Object.keys(data[0]).join(',') + '\n';
        const rows = data.map((row) => {
            return Object.values(row).map((val) => {
                if (val === null || val === undefined) return '""';
                // Xử lý BigInt: chuyển BigInt sang string trước khi replace
                const strVal = typeof val === 'bigint' ? val.toString() : String(val);
                return `"${strVal.replace(/"/g, '""')}"`;
            }).join(',');
        }).join('\n');

        const csvContent = '\uFEFF' + header + rows;
        reply.header('Content-Type', 'text/csv; charset=utf-8');
        reply.header('Content-Disposition', 'attachment; filename="volume_issue_status.csv"');
        return reply.send(csvContent);
    } catch (error) {
        logger.error('[Admin Controller] Lỗi export CSV:', error);
        return reply.status(500).send({ success: false, message: 'Lỗi hệ thống server' });
    }
};

export const getRecentActivities = async (req, reply) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        
        const result = await logService.getLogs({ page, limit });
        
        return reply.send({
            success: true,
            code: 'GET_RECENT_ACTIVITIES_SUCCESS',
            message: 'Lấy danh sách hoạt động gần đây thành công',
            data: result.logs,
            pagination: result.pagination,
        });
    } catch (error) {
        logger.error('[Admin Controller] Lỗi get recent activities:', error);
        return reply.status(500).send({ success: false, message: 'Lỗi hệ thống server' });
    }
};

export const getJournalRepositorySummary = async (req, reply) => {
    try {
        const { journalId } = req.params;
        const summaryData = await adminService.getJournalRepositorySummary(journalId);

        return reply.send({
            success: true,
            message: 'Lấy dữ liệu tổng quan của kho lưu trữ thành công',
            data: summaryData,
        });
    } catch (error) {
        if (error.statusCode) {
            return reply.status(error.statusCode).send({
                success: false,
                message: error.message,
                errorCode: error.code,
            });
        }
        logger.error('[Admin Controller] Lỗi khi lấy repository summary:', error);
        return reply.status(500).send({
            success: false,
            message: 'Lỗi hệ thống khi lấy dữ liệu tổng quan',
            errorCode: 'INTERNAL_ERROR',
        });
    }
};

export const getUsers = async (req, reply) => {
    try {
        const result = await adminService.getUsersList(req.query);
        return reply.send({
            success: true,
            data: result.items,
            pagination: result.pagination
        });
    } catch (error) {
        logger.error('[Admin Controller] Lỗi get users:', error);
        return reply.status(500).send({ success: false, message: 'Lỗi hệ thống server' });
    }
};

export const getUserDetail = async (req, reply) => {
    try {
        const user = await adminService.getUserDetailById(req.params.id);
        if (!user) {
            return reply.status(404).send({ success: false, message: 'Không tìm thấy người dùng' });
        }
        return reply.send({ success: true, data: user });
    } catch (error) {
        logger.error('[Admin Controller] Lỗi get user detail:', error);
        return reply.status(500).send({ success: false, message: 'Lỗi hệ thống server' });
    }
};

export const createUser = async (req, reply) => {
    try {
        const user = await adminService.createUser(req.body);
        return reply.status(201).send({ success: true, data: user });
    } catch (error) {
        if (error.statusCode === 409) {
            return reply.status(409).send({ success: false, message: error.message });
        }
        logger.error('[Admin Controller] Lỗi create user:', error);
        return reply.status(500).send({ success: false, message: 'Lỗi hệ thống server' });
    }
};

export const adminUpdateUser = async (req, reply) => {
    try {
        const user = await adminService.updateUserByAdmin(req.params.id, req.body);
        if (!user) {
            return reply.status(404).send({ success: false, message: 'Không tìm thấy người dùng' });
        }
        return reply.send({ success: true, data: user });
    } catch (error) {
        logger.error('[Admin Controller] Lỗi update user:', error);
        return reply.status(500).send({ success: false, message: 'Lỗi hệ thống server' });
    }
};
