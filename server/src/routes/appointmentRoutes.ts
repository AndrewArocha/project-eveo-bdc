import { Router } from 'express';
import { createOwnAppointment, listOwnAppointments, updateOwnAppointmentStatus } from '../controllers/appointmentController.js';
import { authenticate } from '../middlewares/authenticate.js';
import { requireStoreAccess } from '../middlewares/requireStoreAccess.js';
import { Appointment } from '../models/Appointment.js';
import { validateBody } from '../validators/validate.js';
import { createAppointmentSchema, updateAppointmentStatusSchema } from '../validators/appointment.js';

export const appointmentRoutes = Router();
appointmentRoutes.use(authenticate);
appointmentRoutes.get('/', requireStoreAccess(), listOwnAppointments);
appointmentRoutes.post('/', requireStoreAccess(), validateBody(createAppointmentSchema), createOwnAppointment);
appointmentRoutes.patch('/:id/status', requireStoreAccess(Appointment), validateBody(updateAppointmentStatusSchema), updateOwnAppointmentStatus);
