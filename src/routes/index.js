import express from "express";
import userRouter from "./user.route.js";
import loginRouter from "./login.route.js";
import registerRouter from "./register.route.js";
import projectRouter from "./project.route.js";
import googleRouter from "./google.route.js";
import keywordRouter from "./keyword.route.js";
const router = express.Router();

// Gom router của user vào đường dẫn /users
router.use('/users', userRouter);
router.use('/projects', projectRouter);

// Gom router của login, register và google vào đường dẫn /auth
router.use('/auth', loginRouter);
router.use('/auth', registerRouter);
router.use('/auth', googleRouter);

// Gom router của keyword vào đường dẫn /projects
router.use("/projects", keywordRouter);
export default router;
