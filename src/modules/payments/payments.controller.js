import * as paymentService from './payments.service.js';
import logger from '../../utils/logger.js';

const handleControllerError = (reply, error, fallbackMessage) => {
    if (error.statusCode) {
        return reply.status(error.statusCode).send({
            success: false,
            code: error.code || 'REQUEST_FAILED',
            message: error.message,
        });
    }

    logger.error('[Payment Controller] Error:', error);
    return reply.status(500).send({
        success: false,
        code: 'INTERNAL_SERVER_ERROR',
        message: fallbackMessage,
    });
};

export const createPayment = async (req, reply) => {
    try {
        const result = await paymentService.createPayment({
            userId: req.user.user_id,
            packageId: req.body.packageId,
            paymentMethod: req.body.paymentMethod,
            ipAddr: req.ip,
        });

        return reply.code(201).send({
            success: true,
            code: 'CREATE_PAYMENT_SUCCESS',
            message: 'Tao giao dich thanh toan thanh cong',
            data: {
                transactionId: result.payment.transaction_id,
                transaction_id: result.payment.transaction_id,
                paymentUrl: result.paymentUrl,
                payment_url: result.paymentUrl,
                payment: result.payment,
            },
        });
    } catch (error) {
        return handleControllerError(reply, error, 'Co loi xay ra khi tao giao dich thanh toan');
    }
};

export const getPaymentById = async (req, reply) => {
    try {
        const payment = await paymentService.getPaymentById({
            transactionId: req.params.transactionId,
            user: req.user,
        });

        if (!payment) {
            return reply.status(404).send({
                success: false,
                code: 'PAYMENT_NOT_FOUND',
                message: 'Khong tim thay giao dich thanh toan',
            });
        }

        return reply.send({
            success: true,
            code: 'GET_PAYMENT_SUCCESS',
            message: 'Lay trang thai giao dich thanh toan thanh cong',
            data: payment,
        });
    } catch (error) {
        return handleControllerError(reply, error, 'Co loi xay ra khi lay giao dich thanh toan');
    }
};

export const getMyPayments = async (req, reply) => {
    try {
        const result = await paymentService.getPaymentsByUserId(req.user.user_id, {
            page: req.query.page,
            limit: req.query.limit,
            status: req.query.status,
        });

        return reply.send({
            success: true,
            code: 'GET_MY_PAYMENTS_SUCCESS',
            message: 'Lay lich su nap tien thanh cong',
            data: result.items,
            pagination: result.pagination,
        });
    } catch (error) {
        return handleControllerError(reply, error, 'Co loi xay ra khi lay lich su nap tien');
    }
};

export const getAdminPayments = async (req, reply) => {
    try {
        const result = await paymentService.getAdminPayments({
            page: req.query.page,
            limit: req.query.limit,
            userId: req.query.userId,
            status: req.query.status,
            paymentMethod: req.query.paymentMethod,
        });

        return reply.send({
            success: true,
            code: 'GET_ADMIN_PAYMENTS_SUCCESS',
            message: 'Lay danh sach giao dich thanh toan thanh cong',
            data: result.items,
            pagination: result.pagination,
        });
    } catch (error) {
        return handleControllerError(reply, error, 'Co loi xay ra khi lay danh sach giao dich thanh toan');
    }
};

export const handleVnpayReturn = async (req, reply) => {
    try {
        const result = await paymentService.handleVnpayReturn(req.query);

        return reply.send({
            success: true,
            code: result.isValidSignature ? 'VNPAY_RETURN_RECEIVED' : 'VNPAY_RETURN_INVALID_SIGNATURE',
            message: result.isValidSignature
                ? 'Da nhan ket qua thanh toan VNPay, vui long cho IPN xac nhan'
                : 'Chu ky VNPay return khong hop le',
            data: result,
        });
    } catch (error) {
        return handleControllerError(reply, error, 'Co loi xay ra khi xu ly VNPay return');
    }
};

export const handleVnpayIpn = async (req, reply) => {
    const result = await paymentService.handleVnpayIpn({
        ...req.query,
        ...req.body,
    });

    return reply.send({
        RspCode: result.rspCode,
        Message: result.message,
    });
};

export const handleMomoIpn = async (req, reply) => {
    const result = await paymentService.handleMomoIpn(req.body);
    return reply.send(result);
};
