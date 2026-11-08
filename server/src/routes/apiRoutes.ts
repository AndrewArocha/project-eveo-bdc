import { Router } from 'express';
import { authRoutes } from './authRoutes.js';
import { customerRoutes } from './customerRoutes.js';
import { userRoutes } from './userRoutes.js';
import { storeRoutes } from './storeRoutes.js';
import { inventoryRoutes } from './inventoryRoutes.js';
import { leadRoutes } from './leadRoutes.js';
import { appointmentRoutes } from './appointmentRoutes.js';

export const apiRoutes = Router();
apiRoutes.use('/auth', authRoutes);
apiRoutes.use('/users', userRoutes);
apiRoutes.use('/stores', storeRoutes);
apiRoutes.use('/customers', customerRoutes);
apiRoutes.use('/inventory', inventoryRoutes);
apiRoutes.use('/leads', leadRoutes);
apiRoutes.use('/appointments', appointmentRoutes);
