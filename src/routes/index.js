
import projectsRoutes from "../modules/projects/projects.routes.js";
import projectMembersRoutes from "../modules/project-members/project-members.routes.js";
import projectKeywordsRoutes from "../modules/project-keywords/project-keywords.routes.js";
import authRoutes from "../modules/auth/auth.routes.js";
import usersRoutes from "../modules/users/users.routes.js";
import articlesRoutes from "../modules/articles/articles.routes.js";
import publishersRoutes from "../modules/publishers/publishers.routes.js";
import authorsRoutes from "../modules/authors/authors.routes.js";
import journalsRoutes from "../modules/journals/journals.routes.js";
import keywordsRoutes from "../modules/keywords/keywords.routes.js";
import subjectAreasRoutes from "../modules/subject-areas/subject-areas.routes.js";
import subjectCategoriesRoutes from "../modules/subject-categories/subject-categories.routes.js";
import topicsRoutes from "../modules/topics/topics.routes.js";
import volumesRoutes from "../modules/volumes/volumes.routes.js";
import issuesRoutes from "../modules/issues/issues.routes.js";

import searchRoutes from "../modules/search/search.routes.js";
import catalogRoutes from "../modules/catalog/catalog.routes.js";
import zonesRoutes from "../modules/zones/zones.routes.js";
import walletRoutes from "../modules/wallet/wallet.routes.js";
import coinPackagesRoutes from "../modules/coin-packages/coin-packages.routes.js";
import paymentsRoutes from "../modules/payments/payments.routes.js";
import adminRoutes from "../modules/admin/admin.routes.js";
import dashboardRoutes from "../modules/dashboard/dashboard.routes.js";
import statisticsRoutes from "../modules/statistics/statistics.routes.js";
import authPlugin from "../modules/auth/auth.plugin.js";

/**
 * Fastify root router
 * @param {import('fastify').FastifyInstance} fastify 
 */
export default async function rootRoutes(fastify, options) {
  // Đăng ký auth plugin toàn cục cho các router
  await fastify.register(authPlugin);

  // 1. Đăng ký các module Fastify mới
  fastify.register(authRoutes, { prefix: '/auth' });
  fastify.register(usersRoutes, { prefix: '/users' });
  fastify.register(articlesRoutes, { prefix: '/articles' });
  fastify.register(publishersRoutes, { prefix: '/publishers' });
  fastify.register(authorsRoutes, { prefix: '/authors' });
  fastify.register(journalsRoutes, { prefix: '/journal' }); // or /journals
  fastify.register(keywordsRoutes, { prefix: '/keywords' });
  fastify.register(subjectAreasRoutes, { prefix: '/subject-areas' });
  fastify.register(subjectCategoriesRoutes, { prefix: '/subject-categories' });
  fastify.register(topicsRoutes, { prefix: '/topics' });
  fastify.register(volumesRoutes, { prefix: '/volumes' });
  fastify.register(issuesRoutes, { prefix: '/issues' });
  fastify.register(projectsRoutes, { prefix: '/projects' });
  fastify.register(projectMembersRoutes, { prefix: '/projects' }); // /projects/:projectId/members
  fastify.register(projectKeywordsRoutes, { prefix: '/projects' }); // /projects/:projectId/keywords
  
  fastify.register(searchRoutes, { prefix: '/search' });
  fastify.register(catalogRoutes, { prefix: '/catalog' });
  fastify.register(zonesRoutes, { prefix: '/zones' });
  fastify.register(walletRoutes, { prefix: '/wallet' });
  fastify.register(coinPackagesRoutes, { prefix: '/coin-packages' });
  fastify.register(paymentsRoutes, { prefix: '/payments' });
  fastify.register(adminRoutes, { prefix: '/admin' });

  fastify.register(dashboardRoutes, { prefix: '/dashboard' });

  fastify.register(statisticsRoutes, { prefix: '/statistics' });
}
