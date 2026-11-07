import { Router } from 'express';
import {
  createOwnCustomer,
  deleteOwnCustomer,
  getOwnCustomer,
  listOwnCustomers,
  updateOwnCustomer,
} from '../controllers/customerController.js';
import { authenticate } from '../middlewares/authenticate.js';
import { validateBody } from '../validators/validate.js';
import { createCustomerSchema, updateCustomerSchema } from '../validators/customer.js';

export const customerRoutes = Router();
customerRoutes.use(authenticate);
customerRoutes.get('/', listOwnCustomers);
customerRoutes.post('/', validateBody(createCustomerSchema), createOwnCustomer);
customerRoutes.get('/:id', getOwnCustomer);
customerRoutes.patch('/:id', validateBody(updateCustomerSchema), updateOwnCustomer);
customerRoutes.delete('/:id', deleteOwnCustomer);
