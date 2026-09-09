import {
    getPublishers,
    getPublisherById,
    createPublisher,
    updatePublisher,
    deletePublisher,
    restorePublisher
} from './publishers.controller.js';

import {
    getPublishersSchema,
    getPublisherByIdSchema,
    createPublisherSchema,
    updatePublisherSchema,
    deletePublisherSchema,
    restorePublisherSchema
} from './publishers.schema.js';

import { verifyTokenFastify, verifyAdminFastify } from '../auth/auth.middleware.js';

/**
 * Fastify plugin for Publisher routes
 * @param {import('fastify').FastifyInstance} fastify 
 */
export default async function publishersRoutes(fastify, options) {
    // Không cần bảo vệ (Public)
    fastify.get('/', getPublishersSchema, getPublishers);
    fastify.get('/:id', getPublisherByIdSchema, getPublisherById);

    // Cần quyền Admin
    fastify.register(async (protectedRoutes) => {
        // Đăng ký hook bảo vệ auth và admin
        protectedRoutes.addHook('preHandler', verifyTokenFastify);
        protectedRoutes.addHook('preHandler', verifyAdminFastify);

        protectedRoutes.post('/', createPublisherSchema, createPublisher);
        protectedRoutes.put('/:id', updatePublisherSchema, updatePublisher);
        protectedRoutes.delete('/:id', deletePublisherSchema, deletePublisher);
        protectedRoutes.patch('/:id/restore', restorePublisherSchema, restorePublisher);
    });
}
