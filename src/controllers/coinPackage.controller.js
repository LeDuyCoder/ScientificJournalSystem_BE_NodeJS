import * as coinPackageService from '../services/coinPackage.service.js';
import logger from '../utils/logger.js';

export const coinPackageServiceRef = { ...coinPackageService };

const handleControllerError = (res, error, fallbackMessage) => {
  if (error.statusCode) {
    return res.status(error.statusCode).json({
      success: false,
      code: error.code || 'REQUEST_FAILED',
      message: error.message,
    });
  }

  logger.error('[CoinPackage Controller] Error:', error);
  return res.status(500).json({
    success: false,
    code: 'INTERNAL_SERVER_ERROR',
    message: fallbackMessage,
  });
};

export const getCoinPackages = async (req, res) => {
  try {
    const packages = await coinPackageServiceRef.getActiveCoinPackages();

    return res.status(200).json({
      success: true,
      code: 'GET_COIN_PACKAGES_SUCCESS',
      message: 'Lay danh sach goi coin thanh cong',
      data: packages,
    });
  } catch (error) {
    return handleControllerError(res, error, 'Co loi xay ra khi lay danh sach goi coin');
  }
};

export const getAdminCoinPackages = async (req, res) => {
  try {
    const isActive = req.query.isActive === undefined
      ? undefined
      : req.query.isActive === 'true';

    const result = await coinPackageServiceRef.getAdminCoinPackages({
      page: req.query.page,
      limit: req.query.limit,
      isActive,
    });

    return res.status(200).json({
      success: true,
      code: 'GET_ADMIN_COIN_PACKAGES_SUCCESS',
      message: 'Lay danh sach goi coin cho admin thanh cong',
      data: result.items,
      pagination: result.pagination,
    });
  } catch (error) {
    return handleControllerError(res, error, 'Co loi xay ra khi lay danh sach goi coin');
  }
};

export const createCoinPackage = async (req, res) => {
  try {
    const coinPackage = await coinPackageServiceRef.createCoinPackage(req.body);

    return res.status(201).json({
      success: true,
      code: 'CREATE_COIN_PACKAGE_SUCCESS',
      message: 'Tao goi coin thanh cong',
      data: coinPackage,
    });
  } catch (error) {
    return handleControllerError(res, error, 'Co loi xay ra khi tao goi coin');
  }
};

export const updateCoinPackage = async (req, res) => {
  try {
    const coinPackage = await coinPackageServiceRef.updateCoinPackage(
      req.params.packageId,
      req.body
    );

    return res.status(200).json({
      success: true,
      code: 'UPDATE_COIN_PACKAGE_SUCCESS',
      message: 'Cap nhat goi coin thanh cong',
      data: coinPackage,
    });
  } catch (error) {
    return handleControllerError(res, error, 'Co loi xay ra khi cap nhat goi coin');
  }
};

export const deleteCoinPackage = async (req, res) => {
  try {
    const coinPackage = await coinPackageServiceRef.deactivateCoinPackage(req.params.packageId);

    return res.status(200).json({
      success: true,
      code: 'DELETE_COIN_PACKAGE_SUCCESS',
      message: 'Vo hieu hoa goi coin thanh cong',
      data: coinPackage,
    });
  } catch (error) {
    return handleControllerError(res, error, 'Co loi xay ra khi vo hieu hoa goi coin');
  }
};
