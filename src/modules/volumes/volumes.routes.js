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
  // Public routes (if any, although volumes GET requires verifyToken per legacy routes)
  // But wait, the legacy routes had `verifyToken` for all. Let's keep them protected.
  fastify.register(async (protectedRoutes) => {
    protectedRoutes.addHook("preHandler", verifyTokenFastify);

    protectedRoutes.get("/", getVolumesSchema, getVolumes);
    protectedRoutes.get("/:id", getVolumeByIdSchema, getVolumeById);
    
    protectedRoutes.post("/", createVolumeSchema, createVolume);
    protectedRoutes.put("/:id", updateVolumeSchema, updateVolume);
    protectedRoutes.delete("/:id", deleteVolumeSchema, deleteVolume);
    protectedRoutes.patch("/:id/restore", restoreVolumeSchema, restoreVolume);
  });
}
