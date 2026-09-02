import {
  getIssues,
  getIssueById,
  createIssue,
  updateIssue,
  deleteIssue,
  restoreIssue
} from "./issues.controller.js";

import {
  getIssuesSchema,
  getIssueByIdSchema,
  createIssueSchema,
  updateIssueSchema,
  deleteIssueSchema,
  restoreIssueSchema
} from "./issues.schema.js";

import { verifyTokenFastify } from "../auth/auth.middleware.js";

/**
 * Fastify plugin for Issues routes
 * @param {import('fastify').FastifyInstance} fastify
 */
export default async function issuesRoutes(fastify, options) {
  // Public routes (if any)
  fastify.get("/", getIssuesSchema, getIssues);

  // Protected routes
  fastify.register(async (protectedRoutes) => {
    protectedRoutes.addHook("preHandler", verifyTokenFastify);

    protectedRoutes.get("/:id", getIssueByIdSchema, getIssueById);
    
    protectedRoutes.post("/", createIssueSchema, createIssue);
    protectedRoutes.put("/:id", updateIssueSchema, updateIssue);
    protectedRoutes.delete("/:id", deleteIssueSchema, deleteIssue);
    protectedRoutes.patch("/:id/restore", restoreIssueSchema, restoreIssue);
  });
}
