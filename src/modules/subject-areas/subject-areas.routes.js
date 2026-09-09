import {
  createSubjectArea,
  getSubjectAreas,
  getSubjectAreaById,
  updateSubjectArea,
  deleteSubjectArea,
  restoreSubjectArea,
  getSubjectAreaStatistics
} from "./subject-areas.controller.js";

import {
  createSubjectAreaSchema,
  getSubjectAreasSchema,
  getSubjectAreaByIdSchema,
  updateSubjectAreaSchema,
  deleteSubjectAreaSchema,
  restoreSubjectAreaSchema,
  getSubjectAreaStatisticsSchema
} from "./subject-areas.schema.js";

import { verifyTokenFastify } from "../auth/auth.middleware.js";

/**
 * Fastify plugin for Subject Areas routes
 * @param {import('fastify').FastifyInstance} fastify
 */
export default async function subjectAreasRoutes(fastify, options) {
  // Public routes
  fastify.get("/", getSubjectAreasSchema, getSubjectAreas);
  fastify.get("/:id", getSubjectAreaByIdSchema, getSubjectAreaById);
  fastify.get("/:id/statistics", getSubjectAreaStatisticsSchema, getSubjectAreaStatistics);

  // Protected routes
  fastify.register(async (protectedRoutes) => {
    protectedRoutes.addHook("preHandler", verifyTokenFastify);

    protectedRoutes.post("/", createSubjectAreaSchema, createSubjectArea);
    protectedRoutes.put("/:id", updateSubjectAreaSchema, updateSubjectArea);
    protectedRoutes.delete("/:id", deleteSubjectAreaSchema, deleteSubjectArea);
    protectedRoutes.patch("/:id/restore", restoreSubjectAreaSchema, restoreSubjectArea);
  });
}
