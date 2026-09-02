import * as zoneService from './zones.service.js';
import logger from '../../utils/logger.js';

export const getCountryStats = async (req, reply) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        let year = req.query.year || req.query.publication_year;

        if (year !== undefined && year !== '') {
            if (isNaN(Number(year))) {
                return reply.status(400).send({
                    success: false,
                    code: 'YEAR_INVALID',
                    message: 'Năm phải là số'
                });
            }
            year = Number(year);
        } else {
            year = undefined;
        }

        const { countries, total } = await zoneService.getCountryStats({ page, limit, year });

        return reply.send({
            success: true,
            code: 'GET_COUNTRY_STATS_SUCCESS',
            message: 'Lấy danh sách thống kê quốc gia thành công',
            data: countries,
            pagination: {
                total,
                page: Number(page),
                limit: Number(limit),
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        logger.error('Lỗi khi lấy danh sách thống kê quốc gia:', error);
        return reply.status(500).send({
            success: false,
            code: 'SERVER_ERROR',
            message: 'Lỗi hệ thống khi lấy thống kê quốc gia'
        });
    }
};

export const getRegionStats = async (req, reply) => {
    try {
        const countryCode = req.query.country_code || req.query.countryCode;
        const regions = await zoneService.getRegionStats({ countryCode });

        return reply.send({
            success: true,
            code: 'GET_REGION_STATS_SUCCESS',
            message: countryCode
                ? `Lấy danh sách phân vùng của quốc gia '${countryCode}' thành công`
                : 'Lấy danh sách phân vùng toàn cầu thành công',
            data: regions
        });
    } catch (error) {
        logger.error('Lỗi khi lấy thống kê phân vùng:', error);
        if (error.statusCode) {
            return reply.status(error.statusCode).send({
                success: false,
                code: error.statusCode === 400 ? 'REGION_STATS_ERROR' : 'SERVER_ERROR',
                message: error.message
            });
        }
        return reply.status(500).send({
            success: false,
            code: 'SERVER_ERROR',
            message: 'Lỗi hệ thống khi lấy thống kê phân vùng'
        });
    }
};

export const getCountryRegionsStats = async (req, reply) => {
    try {
        const { code } = req.params;

        if (!code || code.trim() === '') {
            return reply.status(400).send({
                success: false,
                code: 'COUNTRY_CODE_REQUIRED',
                message: 'Mã quốc gia không được để trống'
            });
        }

        const result = await zoneService.getCountryRegionsStats(code.trim());

        return reply.send({
            success: true,
            code: 'GET_COUNTRY_REGIONS_STATS_SUCCESS',
            message: 'Lấy thống kê region theo quốc gia thành công',
            data: {
                country: result.country,
                regions: result.regions
            }
        });
    } catch (error) {
        logger.error(`Lỗi khi lấy thống kê phân vùng cho quốc gia ${req.params?.code}:`, error);
        if (error.statusCode) {
            return reply.status(error.statusCode).send({
                success: false,
                code: error.statusCode === 400 ? 'COUNTRY_REGIONS_STATS_ERROR' : 'SERVER_ERROR',
                message: error.message
            });
        }
        return reply.status(500).send({
            success: false,
            code: 'SERVER_ERROR',
            message: 'Lỗi hệ thống khi lấy thống kê phân vùng theo quốc gia'
        });
    }
};
