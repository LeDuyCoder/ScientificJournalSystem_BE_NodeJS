import { getMe, updateMe, deleteMe, updateUserById } from './users.controller.js';
import { verifyTokenFastify } from '../auth/auth.middleware.js';
import { updateProfileSchema } from './users.schema.js';

/**
 * Users plugin for Fastify
 * @param {import('fastify').FastifyInstance} fastify 
 * @param {Object} options 
 */
export default async function usersRoutes(fastify, options) {
  // Yêu cầu token cho toàn bộ route trong module users
  fastify.addHook('preHandler', verifyTokenFastify);

  fastify.get('/me', { schema: { tags: ['Users'] } }, getMe);
  fastify.put('/me', { schema: updateProfileSchema }, updateMe);
  fastify.delete('/me', { schema: { tags: ['Users'] } }, deleteMe);
  
  fastify.put('/:id', { schema: updateProfileSchema }, updateUserById);
}
