import * as catalogService from './catalog.service.js';
import logger from '../../utils/logger.js';

export const getSubjectAreas = async (req, reply) => {
    try {
        const result = await catalogService.getSubjectAreas();
        return reply.send({
            success: true,
            code: 'CATALOG_SUBJECT_AREA_LIST_SUCCESS',
            message: 'Lấy danh sách subject area thành công',
            data: result
        });
    } catch (error) {
        logger.error('Lỗi khi lấy danh sách subject areas:', error);
        return reply.status(500).send({
            success: false,
            code: 'CATALOG_SUBJECT_AREA_LIST_ERROR',
            message: 'Lỗi hệ thống khi lấy danh sách subject areas'
        });
    }
};

export const getSubjectCategories = async (req, reply) => {
    try {
        const { subject_area_id } = req.query;
        const result = await catalogService.getSubjectCategories({ subjectAreaId: subject_area_id });
        return reply.send({
            success: true,
            code: 'CATALOG_SUBJECT_CATEGORY_LIST_SUCCESS',
            message: 'Lấy danh sách subject category thành công',
            data: result
        });
    } catch (error) {
        logger.error('Lỗi khi lấy danh sách subject categories:', error);
        return reply.status(500).send({
            success: false,
            code: 'CATALOG_SUBJECT_CATEGORY_LIST_ERROR',
            message: 'Lỗi hệ thống khi lấy danh sách subject categories'
        });
    }
};

export const getJournalRankings = async (req, reply) => {
    try {
        const { id } = req.params;
        const filters = req.query;

        if (!id || id.trim() === '') {
            return reply.status(400).send({
                success: false,
                code: 'CATALOG_JOURNAL_ID_REQUIRED',
                message: 'ID của journal không được bỏ trống'
            });
        }

        const result = await catalogService.getJournalRankings(id.trim(), filters);
        return reply.send({
            success: true,
            code: 'CATALOG_JOURNAL_RANKING_HISTORY_SUCCESS',
            message: 'Lấy lịch sử ranking của journal thành công',
            data: result
        });
    } catch (error) {
        logger.error(`Lỗi khi lấy lịch sử ranking cho journal ${req.params?.id}:`, error);
        if (error.statusCode) {
            return reply.status(error.statusCode).send({
                success: false,
                message: error.message
            });
        }
        return reply.status(500).send({
            success: false,
            code: 'CATALOG_JOURNAL_RANKING_HISTORY_ERROR',
            message: 'Lỗi hệ thống khi lấy lịch sử ranking của journal'
        });
    }
};

export const getVolumes = async (req, reply) => {
    try {
        const { journal_id, page, limit } = req.query;

        if (journal_id !== undefined) {
            const idNum = Number(journal_id);
            if (isNaN(idNum) || idNum <= 0 || !/^\\d+$/.test(String(journal_id).trim())) {
                return reply.status(400).send({
                    success: false,
                    code: 'CATALOG_JOURNAL_ID_INVALID',
                    message: 'Tham số journal_id phải là số nguyên dương lớn hơn 0'
                });
            }
        }

        const result = await catalogService.getVolumes({ journalId: journal_id, page, limit });
        return reply.send({
            success: true,
            code: 'CATALOG_VOLUME_LIST_SUCCESS',
            message: 'Lấy danh sách volume thành công',
            data: result
        });
    } catch (error) {
        logger.error('Lỗi khi lấy danh sách volume:', error);
        return reply.status(500).send({
            success: false,
            code: 'CATALOG_VOLUME_LIST_ERROR',
            message: 'Lỗi hệ thống khi lấy danh sách volume'
        });
    }
};

export const getIssues = async (req, reply) => {
    try {
        const { volume_id, page, limit } = req.query;

        if (volume_id !== undefined) {
            const idNum = Number(volume_id);
            if (isNaN(idNum) || idNum <= 0 || !/^\\d+$/.test(String(volume_id).trim())) {
                return reply.status(400).send({
                    success: false,
                    code: 'CATALOG_VOLUME_ID_INVALID',
                    message: 'Tham số volume_id phải là số nguyên dương lớn hơn 0'
                });
            }
        }

        const result = await catalogService.getIssues({ volumeId: volume_id, page, limit });
        return reply.send({
            success: true,
            code: 'CATALOG_ISSUE_LIST_SUCCESS',
            message: 'Lấy danh sách issue thành công',
            data: result
        });
    } catch (error) {
        logger.error('Lỗi khi lấy danh sách issue:', error);
        return reply.status(500).send({
            success: false,
            code: 'CATALOG_ISSUE_LIST_ERROR',
            message: 'Lỗi hệ thống khi lấy danh sách issue'
        });
    }
};
