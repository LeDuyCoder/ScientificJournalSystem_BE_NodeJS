import fp from 'fastify-plugin';
import { verifyTokenFastify, verifyAdminFastify } from './auth.middleware.js';

async function authPlugin(fastify, options) {
    fastify.decorate('authenticate', verifyTokenFastify);
    fastify.decorate('verifyAdmin', verifyAdminFastify);
}

export default fp(authPlugin);
