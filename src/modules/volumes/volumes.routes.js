import {
  createVolume,
  getVolumes,
  getVolumeById,
  updateVolume,
  deleteVolume,
  restoreVolume
} from "./volumes.controller.js";

import {
  getVolumesSchema,
  getVolumeByIdSchema,
  createVolumeSchema,
  updateVolumeSchema,
  deleteVolumeSchema,
  restoreVolumeSchema
} from "./volumes.schema.js";

import { verifyTokenFastify } from "../auth/auth.middleware.js";

/**
 * Fastify plugin for Volumes routes
 * @param {import('fastify').FastifyInstance} fastify
 */
export default async function volumesRoutes(fastify, options) {
  // Public routes
  fastify.get("/", getVolumesSchema, getVolumes);
  fastify.get("/:id", getVolumeByIdSchema, getVolumeById);

  // Protected routes
  fastify.register(async (protectedRoutes) => {
    protectedRoutes.addHook("preHandler", verifyTokenFastify);
    
    protectedRoutes.post("/", createVolumeSchema, createVolume);
    protectedRoutes.put("/:id", updateVolumeSchema, updateVolume);
    protectedRoutes.delete("/:id", deleteVolumeSchema, deleteVolume);
    protectedRoutes.patch("/:id/restore", restoreVolumeSchema, restoreVolume);
  });
}
