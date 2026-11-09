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
import { rateLimit } from 'express-rate-limit';

export const customerRoutes = Router();
customerRoutes.use(authenticate);
const createCustomerLimiter = rateLimit({ windowMs: 60_000, limit: 10, standardHeaders: 'draft-8', legacyHeaders: false });
const requireOwnCustomer = requireStoreAccess(Customer, true);
customerRoutes.get('/', requireStoreAccess(), listOwnCustomers);
customerRoutes.post('/', createCustomerLimiter, validateBody(createCustomerSchema), requireStoreAccess(), createOwnCustomer);
customerRoutes.get('/:id', requireOwnCustomer, getOwnCustomer);
customerRoutes.patch('/:id', validateBody(updateCustomerSchema), requireOwnCustomer, updateOwnCustomer);
customerRoutes.delete('/:id', requireOwnCustomer, deleteOwnCustomer);
customerRoutes.patch('/:id/sharing', validateBody(shareCustomerSchema), requireOwnCustomer, shareOwnCustomer);
