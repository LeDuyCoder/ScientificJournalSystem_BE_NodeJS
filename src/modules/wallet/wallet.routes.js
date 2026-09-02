import { getMyWallet, getMyWalletTransactions, spendCoins } from './wallet.controller.js';
import { walletTransactionsQuerySchema, spendCoinsBodySchema } from './wallet.schema.js';

export default async function walletRoutes(fastify, options) {
    fastify.addHook('preValidation', fastify.authenticate);

    fastify.get('/me', {
        schema: {
            tags: ['Coin Wallet'],
            summary: 'Lay thong tin vi coin cua nguoi dung hien tai'
        }
    }, getMyWallet);

    fastify.get('/me/transactions', {
        schema: {
            tags: ['Coin Wallet'],
            summary: 'Lay lich su giao dich coin cua nguoi dung hien tai',
            querystring: walletTransactionsQuerySchema
        }
    }, getMyWalletTransactions);

    fastify.post('/spend', {
        schema: {
            tags: ['Coin Wallet'],
            summary: 'Tieu coin cua nguoi dung hien tai',
            body: spendCoinsBodySchema
        }
    }, spendCoins);
}
