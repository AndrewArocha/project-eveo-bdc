import { Router } from 'express';
import { createOwnAppointment, listOwnAppointments, updateOwnAppointmentStatus } from '../controllers/appointmentController.js';
import { authenticate } from '../middlewares/authenticate.js';
import { validateBody } from '../validators/validate.js';
import { createAppointmentSchema, updateAppointmentStatusSchema } from '../validators/appointment.js';

export const appointmentRoutes = Router();
appointmentRoutes.use(authenticate);
appointmentRoutes.get('/', listOwnAppointments);
appointmentRoutes.post('/', validateBody(createAppointmentSchema), createOwnAppointment);
appointmentRoutes.patch('/:id/status', validateBody(updateAppointmentStatusSchema), updateOwnAppointmentStatus);
