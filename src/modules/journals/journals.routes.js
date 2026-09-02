import {
  getJournalsController,
  getJournalsByIdController,
  createJournalController,
  updateJournalController,
  deleteJournalController,
  restoreJournalController,
} from "./journals.controller.js";

import {
  getJournalsSchema,
  getJournalsByIdSchema,
  createJournalSchema,
  updateJournalSchema,
  deleteJournalSchema,
  restoreJournalSchema,
} from "./journals.schema.js";

import { verifyTokenFastify } from "../auth/auth.middleware.js";

/**
 * Fastify plugin for Journals routes
 * @param {import('fastify').FastifyInstance} fastify
 */
export default async function journalsRoutes(fastify, options) {
  // Public routes or routes that might need cache
  fastify.get("/", getJournalsSchema, getJournalsController);
  
  // Protected routes
  fastify.register(async (protectedRoutes) => {
    protectedRoutes.addHook("preHandler", verifyTokenFastify);

    protectedRoutes.get("/:id", getJournalsByIdSchema, getJournalsByIdController);
    
    protectedRoutes.post("/", createJournalSchema, createJournalController);
    protectedRoutes.put("/:id", updateJournalSchema, updateJournalController);
    protectedRoutes.delete("/:id", deleteJournalSchema, deleteJournalController);
    protectedRoutes.patch("/:id/restore", restoreJournalSchema, restoreJournalController);
  });
}
