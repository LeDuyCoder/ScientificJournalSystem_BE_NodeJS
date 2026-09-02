import * as adminRepository from './admin.repository.js';
import * as journalService from '../journals/journals.service.js';
import logger from '../../utils/logger.js';

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;

const normalizePagination = ({ page, limit }) => {
    const safePage = Number.isInteger(Number(page)) && Number(page) > 0 ? Number(page) : DEFAULT_PAGE;
    const safeLimit = Number.isInteger(Number(limit)) && Number(limit) > 0 ? Number(limit) : DEFAULT_LIMIT;
    return {
        page: safePage,
        limit: safeLimit,
        offset: (safePage - 1) * safeLimit
    };
};

export const summary = async () => {
    return adminRepository.summary();
};

export const getPublicationTrends = async (year, limit) => {
    return adminRepository.getPublicationTrends(year, limit);
};

export const getVolumeIssueStatus = async (options = {}) => {
    const { page, limit, offset } = normalizePagination(options);
    const { items, total } = await adminRepository.getVolumeIssueStatus({ limit, offset });
    
    return {
        items,
        pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        }
    };
};

export const exportVolumeIssueStatus = async () => {
    return adminRepository.exportVolumeIssueStatus();
};

export const getUsersList = async (options = {}) => {
    const { page, limit, offset } = normalizePagination(options);
    const { items, total } = await adminRepository.getUsersList({ 
        search: options.search, 
        role: options.role, 
        status: options.status, 
        sortBy: options.sortBy, 
        sortOrder: options.sortOrder,
        limit, 
        offset 
    });
    
    return {
        items,
        pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        }
    };
};

export const getUserDetailById = async (userId) => {
    return adminRepository.getUserDetailById(userId);
};

export const createUser = async (userData) => {
    return adminRepository.createUser(userData);
};

export const updateUserByAdmin = async (userId, data) => {
    return adminRepository.updateUserByAdmin(userId, data);
};

export const getJournalRepositorySummary = async (journalId) => {
    const exists = await journalService.journalExist(journalId);
    if (!exists) {
        const error = new Error(`Không tìm thấy tạp chí với ID: ${journalId}`);
        error.statusCode = 404;
        error.code = 'JOURNAL_NOT_FOUND';
        throw error;
    }
    return journalService.getJournalRepositorySummary(journalId);
};
