import { getCoinPackages } from './coin-packages.controller.js';

export default async function coinPackagesRoutes(fastify, options) {
    fastify.get('/', {
        schema: {
            tags: ['Coin Packages'],
            summary: 'Lay danh sach goi coin dang ban'
        }
    }, getCoinPackages);
}
