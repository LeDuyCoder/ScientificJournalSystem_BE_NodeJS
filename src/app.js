import Fastify from 'fastify';
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';
import fastifyExpress from '@fastify/express';
import rootRoutes from './routes/index.js';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';

export const buildApp = async (opts = {}) => {
  const app = Fastify({ logger: opts.logger ?? true });

  const parseCorsOrigins = (envVar) => {
    if (!envVar) return [];
    let cleaned = envVar.trim();
    if (cleaned.startsWith('[') && cleaned.endsWith(']')) {
      cleaned = cleaned.slice(1, -1);
    }
    return cleaned.split(',').map(url => url.trim()).filter(Boolean);
  };

  const frontendUrls = parseCorsOrigins(process.env.FRONTEND_URL);
  const frontendTrendingUrls = parseCorsOrigins(process.env.FRONTEND_URL_TRENDING);

  await app.register(cors, {
    origin: [...frontendUrls, ...frontendTrendingUrls],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS']
  });

  await app.register(cookie);
  
  // Kích hoạt Swagger Fastify
  await app.register(fastifySwagger, {
    openapi: {
      info: {
        title: "Tuyển Tập API Hệ Thống",
        version: "1.0.0",
        description: "Tài liệu hướng dẫn sử dụng các API hệ thống (Fastify)",
      },
      servers: [
        {
          url: process.env.BASE_URL || `http://localhost:${process.env.PORT || 8000}`,
          description: "API Server",
        },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT'
          }
        }
      },
    }
  });

  await app.register(fastifySwaggerUi, {
    routePrefix: '/api-docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: false
    }
  });

  await app.register(fastifyExpress);

  // Removed express.json() and express.urlencoded() to prevent Fastify body parser from hanging

  await app.register(rootRoutes, { prefix: '/api/v1' });

  return app;
};
