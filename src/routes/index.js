import express from 'express';
import userRouter from './user.route.js';
import loginRouter from './login.route.js';
import registerRouter from './register.route.js';

const router = express.Router();

// Gom router của user vào đường dẫn /users
router.use('/users', userRouter);

// Gom router của login và register vào đường dẫn /auth
router.use('/auth', loginRouter);
router.use('/auth', registerRouter);

export default router;