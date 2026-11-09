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
import { AppError } from '../utils/AppError.js';

export const customerRoutes = Router();
customerRoutes.use(authenticate);
const createCustomerLimiter = rateLimit({ windowMs: 60_000, limit: 10, standardHeaders: 'draft-8', legacyHeaders: false });
const blockDemoCustomerWrites: import('express').RequestHandler = (request, _response, next) => {
  if (request.auth?.demoMode) { next(new AppError(403, 'Demo customers are stored only in this browser tab.', 'DEMO_CUSTOMER_LOCAL_ONLY')); return; }
  next();
};
customerRoutes.get('/', requireStoreAccess(), listOwnCustomers);
customerRoutes.post('/', createCustomerLimiter, blockDemoCustomerWrites, requireStoreAccess(), validateBody(createCustomerSchema), createOwnCustomer);
customerRoutes.get('/:id', requireStoreAccess(Customer), getOwnCustomer);
customerRoutes.patch('/:id', blockDemoCustomerWrites, requireStoreAccess(Customer), validateBody(updateCustomerSchema), updateOwnCustomer);
customerRoutes.delete('/:id', blockDemoCustomerWrites, requireStoreAccess(Customer), deleteOwnCustomer);
customerRoutes.patch('/:id/sharing', requireStoreAccess(Customer), validateBody(shareCustomerSchema), shareOwnCustomer);
