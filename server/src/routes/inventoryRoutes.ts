import { Router } from 'express';
import {
  createOwnInventoryVehicle,
  getOwnInventoryVehicle,
  listOwnInventory,
  observeOwnInventoryVehicle,
  resolveOwnInventoryDiscrepancy,
  syncOwnWebsiteInventory,
  updateOwnInventoryVehicle,
} from '../controllers/inventoryController.js';
import { createOwnInventoryImport, listOwnInventoryImports } from '../controllers/inventoryImportController.js';
import { authenticate } from '../middlewares/authenticate.js';
import { requireStoreAccess } from '../middlewares/requireStoreAccess.js';
import { InventoryVehicle } from '../models/InventoryVehicle.js';
import { validateBody } from '../validators/validate.js';
import {
  createInventoryVehicleSchema,
  recordInventoryObservationSchema,
  resolveInventoryDiscrepancySchema,
  syncWebsiteInventorySchema,
  updateInventoryVehicleSchema,
} from '../validators/inventory.js';
import { inventoryCsvImportSchema } from '../validators/integration.js';

export const inventoryRoutes = Router();
inventoryRoutes.use(authenticate);
inventoryRoutes.get('/', requireStoreAccess(), listOwnInventory);
inventoryRoutes.post('/sync/website', requireStoreAccess(), validateBody(syncWebsiteInventorySchema), syncOwnWebsiteInventory);
inventoryRoutes.get('/imports', requireStoreAccess(), listOwnInventoryImports);
inventoryRoutes.post('/imports/csv', requireStoreAccess(), validateBody(inventoryCsvImportSchema), createOwnInventoryImport);
inventoryRoutes.post('/', requireStoreAccess(), validateBody(createInventoryVehicleSchema), createOwnInventoryVehicle);
inventoryRoutes.get('/:id', requireStoreAccess(InventoryVehicle), getOwnInventoryVehicle);
inventoryRoutes.patch('/:id', requireStoreAccess(InventoryVehicle), validateBody(updateInventoryVehicleSchema), updateOwnInventoryVehicle);
inventoryRoutes.post('/:id/observations', requireStoreAccess(InventoryVehicle), validateBody(recordInventoryObservationSchema), observeOwnInventoryVehicle);
inventoryRoutes.patch('/:id/discrepancies/:discrepancyId', requireStoreAccess(InventoryVehicle), validateBody(resolveInventoryDiscrepancySchema), resolveOwnInventoryDiscrepancy);
