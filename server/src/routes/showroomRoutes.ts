import { Router } from 'express';
import { appendOwnShowroomEvent, assignOwnShowroomVisit, createOwnShowroomVisit, getOwnShowroomVisit, listOwnShowroomVisits } from '../controllers/showroomController.js';
import { authenticate } from '../middlewares/authenticate.js';
import { validateBody } from '../validators/validate.js';
import { appendShowroomEventSchema, assignShowroomVisitSchema, createShowroomVisitSchema } from '../validators/showroom.js';

export const showroomRoutes = Router();
showroomRoutes.use(authenticate);
showroomRoutes.get('/', listOwnShowroomVisits);
showroomRoutes.post('/', validateBody(createShowroomVisitSchema), createOwnShowroomVisit);
showroomRoutes.get('/:id', getOwnShowroomVisit);
showroomRoutes.post('/:id/events', validateBody(appendShowroomEventSchema), appendOwnShowroomEvent);
showroomRoutes.patch('/:id/assignment', validateBody(assignShowroomVisitSchema), assignOwnShowroomVisit);
