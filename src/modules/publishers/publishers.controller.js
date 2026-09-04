import * as publisherService from './publishers.service.js';

export const getPublishers = async (request, reply) => {
    try {
        const { page = 1, limit = 100, search = '' } = request.query;
        const result = await publisherService.getPublishers({ page, limit, search });
        
        return reply.code(200).send({
            success: true,
            message: 'Lấy danh sách nhà xuất bản thành công',
            data: result.data,
            pagination: result.pagination
        });
    } catch (error) {
        return reply.code(500).send({
            success: false,
            message: 'Lỗi hệ thống khi lấy danh sách nhà xuất bản',
            errorCode: 'INTERNAL_ERROR',
            error: error.message
        });
    }
};

export const getPublisherById = async (request, reply) => {
    try {
        const { id } = request.params;
        const publisher = await publisherService.getPublisherById(id);
        
        if (!publisher) {
            return reply.code(404).send({
                success: false,
                message: 'Không tìm thấy nhà xuất bản',
                errorCode: 'NOT_FOUND'
            });
        }
        
        return reply.code(200).send({
            success: true,
            message: 'Lấy thông tin nhà xuất bản thành công',
            data: publisher
        });
    } catch (error) {
        return reply.code(500).send({
            success: false,
            message: 'Lỗi hệ thống khi lấy thông tin nhà xuất bản',
            errorCode: 'INTERNAL_ERROR',
            error: error.message
        });
    }
};

export const createPublisher = async (request, reply) => {
    try {
        const { display_name, image_url } = request.body;
        
        const newPublisher = await publisherService.createPublisher({ display_name, image_url });
        
        return reply.code(201).send({
            success: true,
            message: 'Tạo nhà xuất bản thành công',
            data: newPublisher
        });
    } catch (error) {
        if (error.code === '23505') { // Postgres unique constraint violation
            return reply.code(400).send({
                success: false,
                message: 'Tên nhà xuất bản đã tồn tại',
                errorCode: 'VALIDATION_ERROR'
            });
        }
        return reply.code(500).send({
            success: false,
            message: 'Lỗi hệ thống khi tạo nhà xuất bản',
            errorCode: 'INTERNAL_ERROR',
            error: error.message
        });
    }
};

export const updatePublisher = async (request, reply) => {
    try {
        const { id } = request.params;
        const { display_name, image_url } = request.body;
        
        const updatedPublisher = await publisherService.updatePublisher(id, { display_name, image_url });
        
        if (!updatedPublisher) {
            return reply.code(404).send({
                success: false,
                message: 'Không tìm thấy nhà xuất bản để cập nhật',
                errorCode: 'NOT_FOUND'
            });
        }
        
        return reply.code(200).send({
            success: true,
            message: 'Cập nhật nhà xuất bản thành công',
            data: updatedPublisher
        });
    } catch (error) {
        if (error.code === '23505') {
            return reply.code(400).send({
                success: false,
                message: 'Tên nhà xuất bản đã tồn tại',
                errorCode: 'VALIDATION_ERROR'
            });
        }
        return reply.code(500).send({
            success: false,
            message: 'Lỗi hệ thống khi cập nhật nhà xuất bản',
            errorCode: 'INTERNAL_ERROR',
            error: error.message
        });
    }
};

export const deletePublisher = async (request, reply) => {
    try {
        const { id } = request.params;
        
        const exists = await publisherService.publisherExist(id);
        if (!exists) {
            return reply.code(404).send({
                success: false,
                message: 'Không tìm thấy nhà xuất bản',
                errorCode: 'NOT_FOUND'
            });
        }

        const isDeleted = await publisherService.publisherIsDeleted(id);
        if (isDeleted) {
            return reply.code(400).send({
                success: false,
                message: 'Nhà xuất bản đã bị xóa từ trước',
                errorCode: 'ALREADY_DELETED'
            });
        }

        await publisherService.deletePublisher(id);
        
        return reply.code(200).send({
            success: true,
            message: 'Xóa nhà xuất bản thành công'
        });
    } catch (error) {
        if (error.code === '23503') { // Foreign key violation (ràng buộc toàn vẹn)
            return reply.code(400).send({
                success: false,
                message: 'Không thể xóa nhà xuất bản vì đang có tạp chí hoặc thực thể khác liên kết',
                errorCode: 'VALIDATION_ERROR'
            });
        }
        return reply.code(500).send({
            success: false,
            message: 'Lỗi hệ thống khi xóa nhà xuất bản',
            errorCode: 'INTERNAL_ERROR',
            error: error.message
        });
    }
};

export const restorePublisher = async (request, reply) => {
    try {
        const { id } = request.params;

        const exists = await publisherService.publisherExist(id);
        if (!exists) {
            return reply.code(404).send({
                success: false,
                message: 'Không tìm thấy nhà xuất bản',
                errorCode: 'NOT_FOUND'
            });
        }

        const isDeleted = await publisherService.publisherIsDeleted(id);
        if (!isDeleted) {
            return reply.code(400).send({
                success: false,
                message: 'Nhà xuất bản đang hoạt động, không cần khôi phục',
                errorCode: 'NOT_DELETED'
            });
        }

        const restoredPublisher = await publisherService.restorePublisher(id);
        
        return reply.code(200).send({
            success: true,
            message: 'Khôi phục nhà xuất bản thành công',
            data: restoredPublisher
        });
    } catch (error) {
        return reply.code(500).send({
            success: false,
            message: 'Lỗi hệ thống khi khôi phục nhà xuất bản',
            errorCode: 'INTERNAL_ERROR',
            error: error.message
        });
    }
};
