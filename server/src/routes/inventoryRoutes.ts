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
import { requireStoreAccess } from '../middlewares/requireStoreAccess.js';
import { InventoryVehicle } from '../models/InventoryVehicle.js';
import { validateBody } from '../validators/validate.js';
import {
  createInventoryVehicleSchema,
  recordInventoryObservationSchema,
  resolveInventoryDiscrepancySchema,
  updateInventoryVehicleSchema,
} from '../validators/inventory.js';

export const inventoryRoutes = Router();
inventoryRoutes.use(authenticate);
inventoryRoutes.get('/', requireStoreAccess(), listOwnInventory);
inventoryRoutes.post('/', requireStoreAccess(), validateBody(createInventoryVehicleSchema), createOwnInventoryVehicle);
inventoryRoutes.get('/:id', requireStoreAccess(InventoryVehicle), getOwnInventoryVehicle);
inventoryRoutes.patch('/:id', requireStoreAccess(InventoryVehicle), validateBody(updateInventoryVehicleSchema), updateOwnInventoryVehicle);
inventoryRoutes.post('/:id/observations', requireStoreAccess(InventoryVehicle), validateBody(recordInventoryObservationSchema), observeOwnInventoryVehicle);
inventoryRoutes.patch('/:id/discrepancies/:discrepancyId', requireStoreAccess(InventoryVehicle), validateBody(resolveInventoryDiscrepancySchema), resolveOwnInventoryDiscrepancy);
