import { Router } from 'express';
import { createOwnAppointment, listOwnAppointments, updateOwnAppointmentDetails, updateOwnAppointmentStatus } from '../controllers/appointmentController.js';
import { authenticate } from '../middlewares/authenticate.js';
import { requireStoreAccess } from '../middlewares/requireStoreAccess.js';
import { Appointment } from '../models/Appointment.js';
import { validateBody } from '../validators/validate.js';
import { createAppointmentSchema, updateAppointmentDetailsSchema, updateAppointmentStatusSchema } from '../validators/appointment.js';

export const appointmentRoutes = Router();
appointmentRoutes.use(authenticate);
appointmentRoutes.get('/', requireStoreAccess(), listOwnAppointments);
appointmentRoutes.post('/', requireStoreAccess(), validateBody(createAppointmentSchema), createOwnAppointment);
appointmentRoutes.patch('/:id', requireStoreAccess(Appointment), validateBody(updateAppointmentDetailsSchema), updateOwnAppointmentDetails);
appointmentRoutes.patch('/:id/status', requireStoreAccess(Appointment), validateBody(updateAppointmentStatusSchema), updateOwnAppointmentStatus);
