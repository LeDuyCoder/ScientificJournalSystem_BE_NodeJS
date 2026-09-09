import * as coinPackageService from './coin-packages.service.js';
import logger from '../../utils/logger.js';

const handleControllerError = (reply, error, fallbackMessage) => {
    if (error.statusCode) {
        return reply.status(error.statusCode).send({
            success: false,
            code: error.code || 'REQUEST_FAILED',
            message: error.message,
        });
    }

    logger.error('[CoinPackage Controller] Error:', error);
    return reply.status(500).send({
        success: false,
        code: 'INTERNAL_SERVER_ERROR',
        message: fallbackMessage,
    });
};

export const getCoinPackages = async (req, reply) => {
    try {
        const packages = await coinPackageService.getActiveCoinPackages();
        return reply.send({
            success: true,
            code: 'GET_COIN_PACKAGES_SUCCESS',
            message: 'Lay danh sach goi coin thanh cong',
            data: packages,
        });
    } catch (error) {
        return handleControllerError(reply, error, 'Co loi xay ra khi lay danh sach goi coin');
    }
};

export const getAdminCoinPackages = async (req, reply) => {
    try {
        const isActive = req.query.isActive === undefined ? undefined : req.query.isActive === 'true';
        const result = await coinPackageService.getAdminCoinPackages({
            page: req.query.page,
            limit: req.query.limit,
            isActive,
        });
        return reply.send({
            success: true,
            code: 'GET_ADMIN_COIN_PACKAGES_SUCCESS',
            message: 'Lay danh sach goi coin cho admin thanh cong',
            data: result.items,
            pagination: result.pagination,
        });
    } catch (error) {
        return handleControllerError(reply, error, 'Co loi xay ra khi lay danh sach goi coin');
    }
};

export const createCoinPackage = async (req, reply) => {
    try {
        const coinPackage = await coinPackageService.createCoinPackage(req.body);
        return reply.code(201).send({
            success: true,
            code: 'CREATE_COIN_PACKAGE_SUCCESS',
            message: 'Tao goi coin thanh cong',
            data: coinPackage,
        });
    } catch (error) {
        return handleControllerError(reply, error, 'Co loi xay ra khi tao goi coin');
    }
};

export const updateCoinPackage = async (req, reply) => {
    try {
        const coinPackage = await coinPackageService.updateCoinPackage(req.params.packageId, req.body);
        return reply.send({
            success: true,
            code: 'UPDATE_COIN_PACKAGE_SUCCESS',
            message: 'Cap nhat goi coin thanh cong',
            data: coinPackage,
        });
    } catch (error) {
        return handleControllerError(reply, error, 'Co loi xay ra khi cap nhat goi coin');
    }
};

export const deleteCoinPackage = async (req, reply) => {
    try {
        const coinPackage = await coinPackageService.deactivateCoinPackage(req.params.packageId);
        return reply.send({
            success: true,
            code: 'DELETE_COIN_PACKAGE_SUCCESS',
            message: 'Vo hieu hoa goi coin thanh cong',
            data: coinPackage,
        });
    } catch (error) {
        return handleControllerError(reply, error, 'Co loi xay ra khi vo hieu hoa goi coin');
    }
};
