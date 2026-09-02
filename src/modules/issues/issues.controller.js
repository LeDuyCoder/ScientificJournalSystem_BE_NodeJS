import * as issueService from "./issues.service.js";
import logger from "../../utils/logger.js";

/**
 * Controller lấy danh sách Issue.
 * @param {import('fastify').FastifyRequest} request - Fastify request object.
 * @param {import('fastify').FastifyReply} reply - Fastify reply object.
 */
export const getIssues = async (request, reply) => {
    try {
        const {
            page = 1,
            limit = 10,
            volume_id,
            journal_id
        } = request.query;

        // Custom validation logic that was in middleware
        if (volume_id) {
            const exists = await issueService.volumeExist(volume_id);
            if (!exists) {
                return reply.code(404).send({
                    success: false,
                    code: "VOLUME_NOT_FOUND",
                    message: "volume_id không tồn tại hoặc đã bị xóa mềm"
                });
            }
        }

        const result = await issueService.getIssues({
            page: parseInt(page, 10),
            limit: parseInt(limit, 10),
            volume_id,
            journal_id
        });

        return reply.code(200).send({
            success: true,
            message: 'Lấy danh sách Issue thành công',
            data: result.items,
            pagination: result.pagination
        });
    } catch (error) {
        logger.error('Lỗi hệ thống khi lấy danh sách Issue:', error.message);
        return reply.code(500).send({
            success: false,
            message: 'Lỗi hệ thống khi lấy danh sách Issue',
            errorCode: 'INTERNAL_ERROR'
        });
    }
};

export const createIssue = async (request, reply) => {
    try {
        const { volume_id, issue_number, publication_year } = request.body;
        
        // Business logic from middleware
        const volumeExists = await issueService.volumeExist(volume_id);
        if (!volumeExists) {
            return reply.code(400).send({
                success: false,
                code: "VOLUME_NOT_FOUND",
                message: "volume_id không tồn tại hoặc đã bị xóa mềm trong hệ thống"
            });
        }

        const isDuplicate = await issueService.checkDuplicateIssue(volume_id, issue_number);
        if (isDuplicate) {
            return reply.code(400).send({
                success: false,
                code: "DUPLICATE_ISSUE",
                message: "Số issue đã tồn tại trong cùng volume này"
            });
        }

        const newIssue = await issueService.createIssue({ volume_id, issue_number, publication_year });
        
        return reply.code(201).send({
            success: true,
            code: 'CREATE_ISSUE_SUCCESS',
            message: 'Tạo Issue thành công',
            data: newIssue
        });
    } catch (error) {
        logger.error('Lỗi khi tạo Issue ở controller:', error.message);
        return reply.code(500).send({
            success: false,
            code: 'SERVER_ERROR',
            message: 'Lỗi hệ thống khi tạo mới Issue'
        });
    }
};

export const getIssueById = async (request, reply) => {
    try {
        const { id } = request.params;
        const issue = await issueService.getIssueById(id);
        
        if (!issue) {
            return reply.code(404).send({
                success: false,
                code: 'ISSUE_NOT_FOUND',
                message: 'Không tìm thấy Issue hoặc đã bị xóa'
            });
        }
        
        return reply.code(200).send({
            success: true,
            code: 'GET_ISSUE_DETAIL_SUCCESS',
            message: 'Lấy chi tiết Issue thành công',
            data: issue
        });
    } catch (error) {
        logger.error(`Lỗi khi lấy chi tiết Issue ID ${request.params.id} ở controller:`, error.message);
        return reply.code(500).send({
            success: false,
            code: 'SERVER_ERROR',
            message: 'Lỗi hệ thống khi lấy chi tiết Issue'
        });
    }
};

export const updateIssue = async (request, reply) => {
    try {
        const { id } = request.params;
        const { issue_number, publication_year } = request.body;
        
        const issue = await issueService.getIssueByIdInternal(id);
        if (!issue) {
            return reply.code(404).send({
                success: false,
                code: "ISSUE_NOT_FOUND",
                message: "Issue không tồn tại"
            });
        }

        if (issue.is_deleted) {
            return reply.code(400).send({
                success: false,
                code: "ISSUE_ALREADY_DELETED",
                message: "Issue đã bị xóa mềm, không thể cập nhật"
            });
        }

        const finalIssueNum = issue_number !== undefined ? Number(issue_number) : issue.issue_number;
        const isDuplicate = await issueService.checkDuplicateIssue(issue.volume_id, finalIssueNum, id);
        if (isDuplicate) {
            return reply.code(400).send({
                success: false,
                code: "DUPLICATE_ISSUE",
                message: "Số issue đã tồn tại trong cùng volume này"
            });
        }

        const updatedIssue = await issueService.updateIssue(id, { issue_number, publication_year });
        
        return reply.code(200).send({
            success: true,
            code: 'UPDATE_ISSUE_SUCCESS',
            message: 'Cập nhật Issue thành công',
            data: updatedIssue
        });
    } catch (error) {
        logger.error(`Lỗi khi cập nhật Issue ID ${request.params.id} ở controller:`, error.message);
        return reply.code(500).send({
            success: false,
            code: 'SERVER_ERROR',
            message: 'Lỗi hệ thống khi cập nhật Issue'
        });
    }
};

export const deleteIssue = async (request, reply) => {
    try {
        const { id } = request.params;
        
        const exists = await issueService.issueExist(id);
        if (!exists) {
            return reply.code(404).send({ success: false, code: 'ISSUE_NOT_FOUND', message: 'Issue không tồn tại' });
        }
        
        const isDeleted = await issueService.issueIsDeleted(id);
        if (isDeleted) {
            return reply.code(400).send({ success: false, code: 'ISSUE_ALREADY_DELETED', message: 'Issue đã bị xóa' });
        }
        
        const deletedIssue = await issueService.deleteIssue(id);
        
        return reply.code(200).send({
            success: true,
            code: 'DELETE_ISSUE_SUCCESS',
            message: 'Xóa Issue thành công',
            data: deletedIssue
        });
    } catch (error) {
        logger.error(`Lỗi khi xóa Issue ID ${request.params.id} ở controller:`, error.message);
        return reply.code(500).send({
            success: false,
            code: 'SERVER_ERROR',
            message: 'Lỗi hệ thống khi xóa Issue'
        });
    }
};

export const restoreIssue = async (request, reply) => {
    try {
        const { id } = request.params;
        
        const exists = await issueService.issueExist(id);
        if (!exists) {
            return reply.code(404).send({ success: false, code: 'ISSUE_NOT_FOUND', message: 'Issue không tồn tại' });
        }
        
        const isDeleted = await issueService.issueIsDeleted(id);
        if (!isDeleted) {
            return reply.code(400).send({ success: false, code: 'ISSUE_NOT_DELETED', message: 'Issue chưa bị xóa' });
        }
        
        const restoredIssue = await issueService.restoreIssue(id);
        
        return reply.code(200).send({
            success: true,
            code: 'RESTORE_ISSUE_SUCCESS',
            message: 'Khôi phục Issue thành công',
            data: restoredIssue
        });
    } catch (error) {
        logger.error(`Lỗi khi khôi phục Issue ID ${request.params.id} ở controller:`, error.message);
        return reply.code(500).send({
            success: false,
            code: 'SERVER_ERROR',
            message: 'Lỗi hệ thống khi khôi phục Issue'
        });
    }
};
