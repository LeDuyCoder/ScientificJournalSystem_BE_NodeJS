import express from 'express';
import userRouter from './user.route.js';

const router = express.Router();

// Gom router của user vào đường dẫn /users
router.use('/users', userRouter);

export default router;