import { Router } from 'express';
import { createOwnLead, listOwnLeads } from '../controllers/leadController.js';
import { authenticate } from '../middlewares/authenticate.js';
import { createLeadSchema } from '../validators/lead.js';
import { validateBody } from '../validators/validate.js';

export const leadRoutes = Router();
leadRoutes.use(authenticate);
leadRoutes.get('/', listOwnLeads);
leadRoutes.post('/', validateBody(createLeadSchema), createOwnLead);
