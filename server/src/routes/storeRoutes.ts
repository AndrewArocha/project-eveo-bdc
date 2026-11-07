import { Router } from 'express';
import { createOwnStore, listOwnStores, updateOwnStore } from '../controllers/storeController.js';
import { authenticate } from '../middlewares/authenticate.js';
import { validateBody } from '../validators/validate.js';
import { createStoreSchema, updateStoreSchema } from '../validators/store.js';

export const storeRoutes = Router();
storeRoutes.use(authenticate);
storeRoutes.get('/', listOwnStores);
storeRoutes.post('/', validateBody(createStoreSchema), createOwnStore);
storeRoutes.patch('/:id', validateBody(updateStoreSchema), updateOwnStore);
