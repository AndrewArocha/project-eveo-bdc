import { Router } from 'express';
import {
  createOwnCustomer,
  deleteOwnCustomer,
  getOwnCustomer,
  listOwnCustomers,
  updateOwnCustomer,
  shareOwnCustomer,
} from '../controllers/customerController.js';
import { authenticate } from '../middlewares/authenticate.js';
import { validateBody } from '../validators/validate.js';
import { createCustomerSchema, shareCustomerSchema, updateCustomerSchema } from '../validators/customer.js';
import { requireStoreAccess } from '../middlewares/requireStoreAccess.js';
import { Customer } from '../models/Customer.js';

export const customerRoutes = Router();
customerRoutes.use(authenticate);
customerRoutes.get('/', requireStoreAccess(), listOwnCustomers);
customerRoutes.post('/', requireStoreAccess(), validateBody(createCustomerSchema), createOwnCustomer);
customerRoutes.get('/:id', requireStoreAccess(Customer), getOwnCustomer);
customerRoutes.patch('/:id', requireStoreAccess(Customer), validateBody(updateCustomerSchema), updateOwnCustomer);
customerRoutes.delete('/:id', requireStoreAccess(Customer), deleteOwnCustomer);
customerRoutes.patch('/:id/sharing', requireStoreAccess(Customer), validateBody(shareCustomerSchema), shareOwnCustomer);
