import {
  createSubjectCategory,
  getSubjectCategories,
  getSubjectCategoryById,
  updateSubjectCategory,
  deleteSubjectCategory,
  restoreSubjectCategory,
  getSubjectCategoryStatistics
} from "./subject-categories.controller.js";

import {
  createSubjectCategorySchema,
  getSubjectCategoriesSchema,
  getSubjectCategoryByIdSchema,
  updateSubjectCategorySchema,
  deleteSubjectCategorySchema,
  restoreSubjectCategorySchema,
  getSubjectCategoryStatisticsSchema
} from "./subject-categories.schema.js";

import { verifyTokenFastify } from "../auth/auth.middleware.js";

/**
 * Fastify plugin for Subject Categories routes
 * @param {import('fastify').FastifyInstance} fastify
 */
export default async function subjectCategoriesRoutes(fastify, options) {
  // Public routes
  fastify.get("/", getSubjectCategoriesSchema, getSubjectCategories);
  fastify.get("/:id", getSubjectCategoryByIdSchema, getSubjectCategoryById);
  fastify.get("/:id/statistics", getSubjectCategoryStatisticsSchema, getSubjectCategoryStatistics);

  // Protected routes
  fastify.register(async (protectedRoutes) => {
    protectedRoutes.addHook("preHandler", verifyTokenFastify);

    protectedRoutes.post("/", createSubjectCategorySchema, createSubjectCategory);
    protectedRoutes.put("/:id", updateSubjectCategorySchema, updateSubjectCategory);
    protectedRoutes.delete("/:id", deleteSubjectCategorySchema, deleteSubjectCategory);
    protectedRoutes.patch("/:id/restore", restoreSubjectCategorySchema, restoreSubjectCategory);
  });
}
