import express from 'express';
import userRouter from './user.route.js';
import authRouter from './auth.route.js';

const router = express.Router();

// Gom router của user vào đường dẫn /users
router.use('/users', userRouter);

// Gom router của auth vào đường dẫn /auth
router.use('/auth', authRouter);

export default router;