import { Router } from 'express';
import { appendOwnShowroomEvent, assignOwnShowroomVisit, createOwnShowroomVisit, getOwnShowroomVisit, listOwnShowroomVisits } from '../controllers/showroomController.js';
import { authenticate } from '../middlewares/authenticate.js';
import { requireStoreAccess } from '../middlewares/requireStoreAccess.js';
import { ShowroomVisit } from '../models/ShowroomVisit.js';
import { validateBody } from '../validators/validate.js';
import { appendShowroomEventSchema, assignShowroomVisitSchema, createShowroomVisitSchema } from '../validators/showroom.js';

export const showroomRoutes = Router();
showroomRoutes.use(authenticate);
showroomRoutes.get('/', requireStoreAccess(), listOwnShowroomVisits);
showroomRoutes.post('/', requireStoreAccess(), validateBody(createShowroomVisitSchema), createOwnShowroomVisit);
showroomRoutes.get('/:id', requireStoreAccess(ShowroomVisit), getOwnShowroomVisit);
showroomRoutes.post('/:id/events', requireStoreAccess(ShowroomVisit), validateBody(appendShowroomEventSchema), appendOwnShowroomEvent);
showroomRoutes.patch('/:id/assignment', requireStoreAccess(ShowroomVisit), validateBody(assignShowroomVisitSchema), assignOwnShowroomVisit);
