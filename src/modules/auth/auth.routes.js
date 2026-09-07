import { login, register, refreshToken, logout, checkAuth, verifyAccount } from './auth.controller.js';
import { verifyTokenFastify } from './auth.middleware.js';
import { loginSchema, registerSchema } from './auth.schema.js';

/**
 * Auth plugin for Fastify
 * @param {import('fastify').FastifyInstance} fastify 
 * @param {Object} options 
 */
export default async function authRoutes(fastify, options) {
  fastify.post('/login', { schema: loginSchema }, login);
  
  fastify.post('/register', { schema: registerSchema }, register);
  
  fastify.get('/verify', { schema: { tags: ['Auth'] } }, verifyAccount);
  
  fastify.get('/refresh', { schema: { tags: ['Auth'] } }, refreshToken);
  
  fastify.get('/check-auth', { preHandler: [verifyTokenFastify], schema: { tags: ['Auth'] } }, checkAuth);
  
  fastify.post('/logout', { schema: { tags: ['Auth'] } }, logout);
}

