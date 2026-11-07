import { Router } from 'express';
import {
  createOwnInventoryVehicle,
  getOwnInventoryVehicle,
  listOwnInventory,
  observeOwnInventoryVehicle,
  resolveOwnInventoryDiscrepancy,
  updateOwnInventoryVehicle,
} from '../controllers/inventoryController.js';
import { authenticate } from '../middlewares/authenticate.js';
import { validateBody } from '../validators/validate.js';
import {
  createInventoryVehicleSchema,
  recordInventoryObservationSchema,
  resolveInventoryDiscrepancySchema,
  updateInventoryVehicleSchema,
} from '../validators/inventory.js';

export const inventoryRoutes = Router();
inventoryRoutes.use(authenticate);
inventoryRoutes.get('/', listOwnInventory);
inventoryRoutes.post('/', validateBody(createInventoryVehicleSchema), createOwnInventoryVehicle);
inventoryRoutes.get('/:id', getOwnInventoryVehicle);
inventoryRoutes.patch('/:id', validateBody(updateInventoryVehicleSchema), updateOwnInventoryVehicle);
inventoryRoutes.post('/:id/observations', validateBody(recordInventoryObservationSchema), observeOwnInventoryVehicle);
inventoryRoutes.patch('/:id/discrepancies/:discrepancyId', validateBody(resolveInventoryDiscrepancySchema), resolveOwnInventoryDiscrepancy);
