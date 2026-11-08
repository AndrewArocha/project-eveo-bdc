import { Router } from 'express';
import { authRoutes } from './authRoutes.js';
import { customerRoutes } from './customerRoutes.js';
import { userRoutes } from './userRoutes.js';
import { storeRoutes } from './storeRoutes.js';
import { inventoryRoutes } from './inventoryRoutes.js';
import { leadRoutes } from './leadRoutes.js';
import { appointmentRoutes } from './appointmentRoutes.js';
import { showroomRoutes } from './showroomRoutes.js';
import { activityRoutes } from './activityRoutes.js';
import { reportRoutes } from './reportRoutes.js';
import { integrationRoutes } from './integrationRoutes.js';

export const apiRoutes = Router();
// Keep the concise paths required by the full-stack assessment while retaining
// the namespaced paths already used by the client.
apiRoutes.use(authRoutes);
apiRoutes.use('/auth', authRoutes);
apiRoutes.use('/users', userRoutes);
apiRoutes.use('/stores', storeRoutes);
apiRoutes.use('/customers', customerRoutes);
apiRoutes.use('/inventory', inventoryRoutes);
apiRoutes.use('/leads', leadRoutes);
apiRoutes.use('/appointments', appointmentRoutes);
apiRoutes.use('/showroom', showroomRoutes);
apiRoutes.use('/activity', activityRoutes);
apiRoutes.use('/reports', reportRoutes);
apiRoutes.use('/integrations', integrationRoutes);
