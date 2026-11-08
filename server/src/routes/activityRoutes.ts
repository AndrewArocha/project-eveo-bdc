import { Router } from 'express';
import { createOwnActivityEvent, listOwnActivityEvents } from '../controllers/showroomController.js';
import { authenticate } from '../middlewares/authenticate.js';
import { validateBody } from '../validators/validate.js';
import { createActivityEventSchema } from '../validators/showroom.js';

export const activityRoutes = Router();
activityRoutes.use(authenticate);
activityRoutes.get('/', listOwnActivityEvents);
activityRoutes.post('/', validateBody(createActivityEventSchema), createOwnActivityEvent);
