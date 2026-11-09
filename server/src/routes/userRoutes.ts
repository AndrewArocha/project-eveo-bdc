import { Router } from 'express';
import { changeCurrentUserPassword, createOwnUserInvitation, getCurrentUser, listOwnStoreUsers, listOwnUserInvitations, revokeOwnUserInvitation, updateCurrentUser, updateCurrentUserSchedule } from '../controllers/userController.js';
import { authenticate } from '../middlewares/authenticate.js';
import { requireStoreAccess } from '../middlewares/requireStoreAccess.js';
import { validateBody } from '../validators/validate.js';
import { changeMyPasswordSchema, createUserInvitationSchema, updateMyProfileSchema, updateMyScheduleSchema } from '../validators/user.js';

export const userRoutes = Router();
userRoutes.use(authenticate);
userRoutes.get('/invitations', listOwnUserInvitations);
userRoutes.post('/invitations', validateBody(createUserInvitationSchema), createOwnUserInvitation);
userRoutes.delete('/invitations/:id', revokeOwnUserInvitation);
userRoutes.get('/me', getCurrentUser);
userRoutes.patch('/me', validateBody(updateMyProfileSchema), updateCurrentUser);
userRoutes.patch('/me/schedule', validateBody(updateMyScheduleSchema), updateCurrentUserSchedule);
userRoutes.patch('/me/password', validateBody(changeMyPasswordSchema), changeCurrentUserPassword);
userRoutes.get('/', requireStoreAccess(), listOwnStoreUsers);
