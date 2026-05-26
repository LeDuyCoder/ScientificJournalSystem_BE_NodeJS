import express from 'express';
import { getUserProfile } from '../controllers/user.controller.js';

const router = express.Router();

// Khi client gọi GET: /api/v1/users/profile
router.get('/profile', getUserProfile);

export default router;