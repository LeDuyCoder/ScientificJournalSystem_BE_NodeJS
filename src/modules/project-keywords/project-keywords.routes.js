import {
  getTrendingKeywords,
  getWatchedKeywordArticles,
  watchKeywords,
  updateWatchedKeywords,
  deleteWatchedKeyword
} from "./project-keywords.controller.js";

import {
  getTrendingKeywordsSchema,
  getWatchedKeywordArticlesSchema,
  watchKeywordsSchema,
  updateWatchedKeywordsSchema,
  deleteWatchedKeywordSchema
} from "./project-keywords.schema.js";

import { verifyTokenFastify } from "../auth/auth.middleware.js";

/**
 * Fastify plugin for Project Keywords routes
 * @param {import('fastify').FastifyInstance} fastify
 */
export default async function projectKeywordsRoutes(fastify, options) {
  fastify.addHook("preHandler", verifyTokenFastify);

  fastify.get("/:projectId/keywords/trending", getTrendingKeywordsSchema, getTrendingKeywords);
  fastify.get("/:projectId/keywords/watch/articles", getWatchedKeywordArticlesSchema, getWatchedKeywordArticles);
  fastify.post("/:projectId/keywords/watch", watchKeywordsSchema, watchKeywords);
  fastify.put("/:projectId/keywords/watch", updateWatchedKeywordsSchema, updateWatchedKeywords);
  fastify.delete("/:projectId/keywords/watch/:keywordId", deleteWatchedKeywordSchema, deleteWatchedKeyword);
}
