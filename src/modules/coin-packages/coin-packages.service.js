import * as coinPackagesRepository from './coin-packages.repository.js';

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;

const normalizePagination = ({ page, limit }) => {
    const safePage = Number.isInteger(Number(page)) && Number(page) > 0 ? Number(page) : DEFAULT_PAGE;
    const safeLimit = Number.isInteger(Number(limit)) && Number(limit) > 0 ? Math.min(Number(limit), MAX_LIMIT) : DEFAULT_LIMIT;

    return {
        page: safePage,
        limit: safeLimit,
        offset: (safePage - 1) * safeLimit,
    };
};

export const getActiveCoinPackages = async () => {
    return await coinPackagesRepository.getActiveCoinPackages();
};

export const getAdminCoinPackages = async (options = {}) => {
    const { page, limit, offset } = normalizePagination(options);
    const { items, total } = await coinPackagesRepository.getAdminCoinPackages({ limit, offset, isActive: options.isActive });

    return {
        items,
        pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        }
    };
};

export const createCoinPackage = async (data) => {
    return await coinPackagesRepository.createCoinPackage(data);
};

export const updateCoinPackage = async (packageId, data) => {
    return await coinPackagesRepository.updateCoinPackage(packageId, data);
};

export const deactivateCoinPackage = async (packageId) => {
    return await coinPackagesRepository.deactivateCoinPackage(packageId);
};
