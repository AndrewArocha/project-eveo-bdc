import { Router } from 'express';
import { authRoutes } from './authRoutes.js';
import { customerRoutes } from './customerRoutes.js';
import { userRoutes } from './userRoutes.js';
import { storeRoutes } from './storeRoutes.js';
import { inventoryRoutes } from './inventoryRoutes.js';

export const apiRoutes = Router();
apiRoutes.use('/auth', authRoutes);
apiRoutes.use('/users', userRoutes);
apiRoutes.use('/stores', storeRoutes);
apiRoutes.use('/customers', customerRoutes);
apiRoutes.use('/inventory', inventoryRoutes);
