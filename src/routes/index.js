import express from "express";
import projectRouter from "./project.route.js";
import zoneRouter from "./zone.route.js";
import keywordRouter from "./keyword.route.js";
import catalogRouter from "./catalog.route.js";
// import authorRouter from "./author.route.js";
// import topicRouter from "./topic.route.js";
// import volumeRouter from "./volume.route.js";
// import issueRouter from "./issue.route.js";
// import subjectAreaRouter from "./subjectArea.route.js";
// import subjectCategoryRouter from "./subjectCategory.route.js";
import searchRotuer from "./search.route.js";
import adminRouter from "./admin.route.js";
// import publisherRouter from "./publisher.route.js";
import statisticsRouter from "./statistics.route.js";
import dashboardRouter from "./dashboard.route.js";
import walletRouter from "./wallet.route.js";
import coinPackageRouter from "./coinPackage.route.js";
import paymentRouter from "./payment.route.js";
import projectMemberRouter from "./projectMember.route.js";

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
/**
 * Fastify root router
 * @param {import('fastify').FastifyInstance} fastify 
 */
export default async function rootRoutes(fastify, options) {
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

  // 2. Wrap các route Express cũ
  const expressRouter = express.Router();
  
  expressRouter.use("/projects", projectRouter);
  expressRouter.use("/zones", zoneRouter);
  expressRouter.use("/catalog", catalogRouter);
  expressRouter.use("/projects", keywordRouter);
  // expressRouter.use("/author", authorRouter); // Moved to Fastify
  // expressRouter.use("/topics", topicRouter); // Moved to Fastify
  // expressRouter.use("/keywords", keywordRouter); // Moved to Fastify
  // expressRouter.use("/journal", journalRouter); // Moved to Fastify
  // expressRouter.use("/volumes", volumeRouter); // Moved to Fastify
  // expressRouter.use("/subject-areas", subjectAreaRouter); // Moved to Fastify
  // expressRouter.use("/subject-categories", subjectCategoryRouter); // Moved to Fastify
  // expressRouter.use("/issues", issueRouter); // Moved to Fastify
  expressRouter.use("/search", searchRotuer);
  expressRouter.use("/admin", adminRouter);
  // expressRouter.use("/publishers", publisherRouter); // Moved to Fastify
  expressRouter.use("/statistics", statisticsRouter);
  expressRouter.use("/dashboard", dashboardRouter);
  expressRouter.use("/wallet", walletRouter);
  expressRouter.use("/coin-packages", coinPackageRouter);
  expressRouter.use("/payments", paymentRouter);
  expressRouter.use("/projects", projectMemberRouter);

  fastify.use(expressRouter);
}
