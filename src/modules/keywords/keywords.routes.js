import {
  getTrendingKeywords,
  getWatchedKeywordArticles,
  watchKeywords,
  getKeywordByIdController,
  getAllKeywordsController,
  createKeywordController,
  updateKeywordController,
  deleteKeywordController,
  restoreKeywordController,
  deleteWatchedKeyword,
  updateWatchedKeywords,
  getArticlesByKeywordController,
} from "./keywords.controller.js";

import {
  getTrendingKeywordsSchema,
  getWatchedKeywordArticlesSchema,
  watchKeywordsSchema,
  updateWatchedKeywordsSchema,
  deleteWatchedKeywordSchema,
  getAllKeywordsSchema,
  createKeywordSchema,
  restoreKeywordSchema,
  getArticlesByKeywordSchema,
  getKeywordByIdSchema,
  updateKeywordSchema,
  deleteKeywordSchema
} from "./keywords.schema.js";

import { verifyTokenFastify } from "../auth/auth.middleware.js";

/**
 * Fastify plugin for Keywords routes
 * @param {import('fastify').FastifyInstance} fastify
 */
export default async function keywordsRoutes(fastify, options) {
  // Public routes
  fastify.get("/", getAllKeywordsSchema, getAllKeywordsController);
  fastify.get("/:id", getKeywordByIdSchema, getKeywordByIdController);
  fastify.get("/:id/articles", getArticlesByKeywordSchema, getArticlesByKeywordController);

  // Protected routes
  fastify.register(async (protectedRoutes) => {
    protectedRoutes.addHook("preHandler", verifyTokenFastify);

    // Watch list routes
    protectedRoutes.get("/project/:id/trending", getTrendingKeywordsSchema, getTrendingKeywords);
    protectedRoutes.get("/project/:id/watch/articles", getWatchedKeywordArticlesSchema, getWatchedKeywordArticles);
    protectedRoutes.post("/project/:id/watch", watchKeywordsSchema, watchKeywords);
    protectedRoutes.put("/project/:id/watch", updateWatchedKeywordsSchema, updateWatchedKeywords);
    protectedRoutes.delete("/project/:id/watch/:keywordId", deleteWatchedKeywordSchema, deleteWatchedKeyword);

    // CRUD system keywords
    protectedRoutes.post("/", createKeywordSchema, createKeywordController);
    protectedRoutes.put("/:id", updateKeywordSchema, updateKeywordController);
    protectedRoutes.delete("/:id", deleteKeywordSchema, deleteKeywordController);
    protectedRoutes.patch("/:id/restore", restoreKeywordSchema, restoreKeywordController);
  });
}

