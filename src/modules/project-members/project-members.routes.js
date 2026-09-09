import {
  getProjectMembers,
  inviteMember,
  acceptInvite,
  updateMemberRole,
  removeMember
} from "./project-members.controller.js";

import {
  getProjectMembersSchema,
  inviteMemberSchema,
  acceptInviteSchema,
  updateMemberRoleSchema,
  removeMemberSchema
} from "./project-members.schema.js";

import { verifyTokenFastify } from "../auth/auth.middleware.js";

/**
 * Fastify plugin for Project Members routes
 * @param {import('fastify').FastifyInstance} fastify
 */
export default async function projectMembersRoutes(fastify, options) {
  // Public route
  fastify.get("/project-invite/accept", acceptInviteSchema, acceptInvite);

  // Protected routes
  fastify.register(async (protectedRoutes) => {
    protectedRoutes.addHook("preHandler", verifyTokenFastify);

    protectedRoutes.get("/:projectId/members", getProjectMembersSchema, getProjectMembers);
    protectedRoutes.post("/:projectId/members/invite", inviteMemberSchema, inviteMember);
    protectedRoutes.put("/:projectId/members/:userId/role", updateMemberRoleSchema, updateMemberRole);
    protectedRoutes.delete("/:projectId/members/:userId", removeMemberSchema, removeMember);
  });
}
