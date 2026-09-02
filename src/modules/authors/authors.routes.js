import {
  getAuthorAreasBreakdown,
  getAuthorArticles,
  getAuthorLeaderboard,
  getAllAuthorsController,
  getAuthorByIdController,
  createAuthorController,
  updateAuthorController,
  deleteAuthorController,
  restoreAuthorController,
} from "./authors.controller.js";

import {
  getAuthorAreasBreakdownSchema,
  getAuthorArticlesSchema,
  getAuthorLeaderboardSchema,
  getAllAuthorsSchema,
  createAuthorSchema,
  updateAuthorSchema,
  deleteAuthorSchema,
  restoreAuthorSchema,
  getAuthorByIdSchema,
} from "./authors.schema.js";

import { verifyTokenFastify } from "../auth/auth.middleware.js";

/**
 * Fastify plugin for Authors routes
 * @param {import('fastify').FastifyInstance} fastify
 */
export default async function authorsRoutes(fastify, options) {
  // Public routes
  fastify.get("/", getAllAuthorsSchema, getAllAuthorsController);
  fastify.get("/leaderboard", getAuthorLeaderboardSchema, getAuthorLeaderboard);

  // Protected routes
  fastify.register(async (protectedRoutes) => {
    protectedRoutes.addHook("preHandler", verifyTokenFastify);

    protectedRoutes.get("/:id", getAuthorByIdSchema, getAuthorByIdController);
    protectedRoutes.get("/:id/areas-breakdown", getAuthorAreasBreakdownSchema, getAuthorAreasBreakdown);
    protectedRoutes.get("/:id/articles", getAuthorArticlesSchema, getAuthorArticles);

    protectedRoutes.post("/", createAuthorSchema, createAuthorController);
    protectedRoutes.put("/:id", updateAuthorSchema, updateAuthorController);
    protectedRoutes.delete("/:id", deleteAuthorSchema, deleteAuthorController);
    protectedRoutes.patch("/:id/restore", restoreAuthorSchema, restoreAuthorController);
  });
}
