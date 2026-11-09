import { Router } from 'express';
import { disableOwnIntegration, listOwnIntegrations, saveOwnIntegration } from '../controllers/integrationController.js';
import { authenticate } from '../middlewares/authenticate.js';
import { requireStoreAccess } from '../middlewares/requireStoreAccess.js';
import { IntegrationConnection } from '../models/IntegrationConnection.js';
import { validateBody } from '../validators/validate.js';
import { saveIntegrationSchema } from '../validators/integration.js';

export const integrationRoutes = Router();
integrationRoutes.use(authenticate);
integrationRoutes.get('/', requireStoreAccess(), listOwnIntegrations);
integrationRoutes.post('/', requireStoreAccess(), validateBody(saveIntegrationSchema), saveOwnIntegration);
integrationRoutes.delete('/:id', requireStoreAccess(IntegrationConnection), disableOwnIntegration);
