import { Router } from 'express';
import { createOwnLead, listOwnLeads } from '../controllers/leadController.js';
import { authenticate } from '../middlewares/authenticate.js';
import { requireStoreAccess } from '../middlewares/requireStoreAccess.js';
import { createLeadSchema } from '../validators/lead.js';
import { validateBody } from '../validators/validate.js';

export const leadRoutes = Router();
leadRoutes.use(authenticate);
leadRoutes.get('/', requireStoreAccess(), listOwnLeads);
leadRoutes.post('/', requireStoreAccess(), validateBody(createLeadSchema), createOwnLead);
