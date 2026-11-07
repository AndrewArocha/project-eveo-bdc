import { Router } from 'express';
import { getCurrentUser } from '../controllers/userController.js';
import { authenticate } from '../middlewares/authenticate.js';

export const userRoutes = Router();
userRoutes.use(authenticate);
userRoutes.get('/me', getCurrentUser);
