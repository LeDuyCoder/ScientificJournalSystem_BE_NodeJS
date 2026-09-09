import {
    summary,
    publicationTrends,
    getVolumeIssueStatus,
    exportVolumeIssueStatusCSV,
    getRecentActivities,
    getJournalRepositorySummary,
    getUsers,
    getUserDetail,
    createUser,
    adminUpdateUser
} from './admin.controller.js';
import {
    getAdminPayments
} from '../payments/payments.controller.js';
import {
    getAdminWalletTransactions,
    adjustWallet
} from '../wallet/wallet.controller.js';
import {
    createCoinPackage,
    deleteCoinPackage,
    getAdminCoinPackages,
    updateCoinPackage
} from '../coin-packages/coin-packages.controller.js';
import {
    publicationTrendsQuerySchema,
    volumeIssueStatusQuerySchema,
    recentActivitiesQuerySchema,
    usersQuerySchema,
    createUserBodySchema,
    updateUserBodySchema,
    userIdParamSchema,
    journalIdParamSchema
} from './admin.schema.js';
import {
    adminWalletTransactionsQuerySchema,
    adjustWalletBodySchema,
} from '../wallet/wallet.schema.js';
import {
    adminPaymentsQuerySchema
} from '../payments/payments.schema.js';
import {
    createCoinPackageBodySchema,
    updateCoinPackageBodySchema,
    packageIdParamSchema,
    adminCoinPackagesQuerySchema
} from '../coin-packages/coin-packages.schema.js';
import { verifyAdminFastify } from '../auth/auth.middleware.js';

export default async function adminRoutes(fastify, options) {
    // Tüm route'lar için preValidation ekle (Token + Admin check)
    fastify.addHook('preValidation', fastify.authenticate);
    fastify.addHook('preValidation', verifyAdminFastify);

    // --- Coin Packages ---
    fastify.get('/coin-packages', {
        schema: {
            tags: ['Coin Admin'],
            summary: 'Admin lay danh sach tat ca goi coin',
            querystring: adminCoinPackagesQuerySchema
        }
    }, getAdminCoinPackages);

    fastify.post('/coin-packages', {
        schema: {
            tags: ['Coin Admin'],
            summary: 'Admin tao goi coin',
            body: createCoinPackageBodySchema
        }
    }, createCoinPackage);

    fastify.put('/coin-packages/:packageId', {
        schema: {
            tags: ['Coin Admin'],
            summary: 'Admin cap nhat goi coin',
            params: packageIdParamSchema,
            body: updateCoinPackageBodySchema
        }
    }, updateCoinPackage);

    fastify.delete('/coin-packages/:packageId', {
        schema: {
            tags: ['Coin Admin'],
            summary: 'Admin vo hieu hoa goi coin',
            params: packageIdParamSchema
        }
    }, deleteCoinPackage);

    // --- Payments ---
    fastify.get('/payments', {
        schema: {
            tags: ['Coin Admin'],
            summary: 'Admin lay danh sach giao dich thanh toan',
            querystring: adminPaymentsQuerySchema
        }
    }, getAdminPayments);

    // --- Wallet ---
    fastify.get('/wallet-transactions', {
        schema: {
            tags: ['Coin Admin'],
            summary: 'Admin lay danh sach lich su giao dich coin',
            querystring: adminWalletTransactionsQuerySchema
        }
    }, getAdminWalletTransactions);

    fastify.post('/wallets/:userId/adjust', {
        schema: {
            tags: ['Coin Admin'],
            summary: 'Admin dieu chinh coin thu cong',
            params: userIdParamSchema,
            body: adjustWalletBodySchema
        }
    }, adjustWallet);

    // --- Dashboard ---
    fastify.get('/dashboard/summary', {
        schema: {
            tags: ['Admin'],
            summary: 'Lấy số liệu thống kê tổng quan cho Admin Dashboard'
        }
    }, summary);

    fastify.get('/dashboard/publication-trends', {
        schema: {
            tags: ['Admin'],
            summary: 'Lấy dữ liệu biểu đồ xu hướng xuất bản',
            querystring: publicationTrendsQuerySchema
        }
    }, publicationTrends);

    fastify.get('/dashboard/volume-issue-status', {
        schema: {
            tags: ['Admin'],
            summary: 'Lấy danh sách trạng thái Volume & Issue cho Dashboard',
            querystring: volumeIssueStatusQuerySchema
        }
    }, getVolumeIssueStatus);

    fastify.get('/dashboard/volume-issue-status/export', {
        schema: {
            tags: ['Admin'],
            summary: 'Export danh sách trạng thái Volume & Issue thành CSV'
        }
    }, exportVolumeIssueStatusCSV);

    fastify.get('/dashboard/recent-activities', {
        schema: {
            tags: ['Admin'],
            summary: 'Lấy danh sách hoạt động gần đây của hệ thống',
            querystring: recentActivitiesQuerySchema
        }
    }, getRecentActivities);

    // --- Users ---
    fastify.get('/users', {
        schema: {
            tags: ['Users'],
            summary: '[ADMIN] Lấy danh sách tài khoản User',
            querystring: usersQuerySchema
        }
    }, getUsers);

    fastify.post('/users', {
        schema: {
            tags: ['Users'],
            summary: '[ADMIN] Tạo tài khoản người dùng mới',
            body: createUserBodySchema
        }
    }, createUser);

    fastify.get('/users/:id', {
        schema: {
            tags: ['Users'],
            summary: '[ADMIN] Lấy chi tiết một User theo ID',
            params: userIdParamSchema
        }
    }, getUserDetail);

    fastify.put('/users/:id', {
        schema: {
            tags: ['Users'],
            summary: '[ADMIN] Cập nhật toàn bộ thông tin người dùng',
            params: userIdParamSchema,
            body: updateUserBodySchema
        }
    }, adminUpdateUser);

    // --- Repositories ---
    fastify.get('/repositories/journals/:journalId/summary', {
        schema: {
            tags: ['Admin'],
            summary: 'Lấy dữ liệu tổng quan cho một tạp chí trong Repository Management',
            params: journalIdParamSchema
        }
    }, getJournalRepositorySummary);
}
