import express from 'express';
import userRouter from './user.route.js';
import loginRouter from './login.route.js';
import registerRouter from './register.route.js';
import googleRouter from './google.route.js';

const router = express.Router();

// Gom router của user vào đường dẫn /users
router.use('/users', userRouter);

// Gom router của login, register và google vào đường dẫn /auth
router.use('/auth', loginRouter);
router.use('/auth', registerRouter);
router.use('/auth', googleRouter);

export default router;