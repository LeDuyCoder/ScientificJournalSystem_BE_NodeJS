import {
  getTopics,
  getTopicById,
  createTopic,
  getArticlesByTopic,
  updateTopic,
  deleteTopic,
  restoreTopic
} from "./topics.controller.js";

import {
  getTopicsSchema,
  getTopicByIdSchema,
  getArticlesByTopicSchema,
  createTopicSchema,
  updateTopicSchema,
  deleteTopicSchema,
  restoreTopicSchema
} from "./topics.schema.js";

import { verifyTokenFastify } from "../auth/auth.middleware.js";

/**
 * Fastify plugin for Topics routes
 * @param {import('fastify').FastifyInstance} fastify
 */
export default async function topicsRoutes(fastify, options) {
  // Public routes
  fastify.get("/", getTopicsSchema, getTopics);
  fastify.get("/:id", getTopicByIdSchema, getTopicById);
  fastify.get("/:id/articles", getArticlesByTopicSchema, getArticlesByTopic);

  // Protected routes
  fastify.register(async (protectedRoutes) => {
    protectedRoutes.addHook("preHandler", verifyTokenFastify);

    protectedRoutes.post("/", createTopicSchema, createTopic);
    protectedRoutes.put("/:id", updateTopicSchema, updateTopic);
    protectedRoutes.delete("/:id", deleteTopicSchema, deleteTopic);
    protectedRoutes.patch("/:id/restore", restoreTopicSchema, restoreTopic);
  });
}
