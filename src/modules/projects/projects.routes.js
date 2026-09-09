import {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  getRelatedArticles,
  deleteProject,
  restoreProject,
  getProjectAnalytics,
  getProjectOverview,
  activateProject
} from "./projects.controller.js";

import {
  getProjectsSchema,
  getProjectByIdSchema,
  getRelatedArticlesSchema,
  createProjectSchema,
  updateProjectSchema,
  deleteProjectSchema,
  getProjectOverviewSchema,
  getProjectAnalyticsSchema,
  restoreProjectSchema,
  activateProjectSchema
} from "./projects.schema.js";

import { verifyTokenFastify } from "../auth/auth.middleware.js";

/**
 * Fastify plugin for Projects routes
 * @param {import('fastify').FastifyInstance} fastify
 */
export default async function projectsRoutes(fastify, options) {
  // All project routes require authentication
  fastify.addHook("preHandler", verifyTokenFastify);

  fastify.get("/", getProjectsSchema, getProjects);
  fastify.post("/", createProjectSchema, createProject);
  
  fastify.get("/:id", getProjectByIdSchema, getProjectById);
  fastify.put("/:id", updateProjectSchema, updateProject);
  fastify.delete("/:id", deleteProjectSchema, deleteProject);
  
  fastify.get("/:id/related-articles", getRelatedArticlesSchema, getRelatedArticles);
  fastify.get("/:id/overview", getProjectOverviewSchema, getProjectOverview);
  fastify.get("/:id/analytics", getProjectAnalyticsSchema, getProjectAnalytics);
  
  fastify.put("/:id/restore", restoreProjectSchema, restoreProject);
  fastify.put("/:id/activate", activateProjectSchema, activateProject);
}
