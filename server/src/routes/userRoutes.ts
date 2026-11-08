import { Router } from 'express';
import { createOwnUserInvitation, getCurrentUser, listOwnStoreUsers, listOwnUserInvitations, revokeOwnUserInvitation } from '../controllers/userController.js';
import { authenticate } from '../middlewares/authenticate.js';
import { requireStoreAccess } from '../middlewares/requireStoreAccess.js';
import { validateBody } from '../validators/validate.js';
import { createUserInvitationSchema } from '../validators/user.js';

export const userRoutes = Router();
userRoutes.use(authenticate);
userRoutes.get('/invitations', listOwnUserInvitations);
userRoutes.post('/invitations', validateBody(createUserInvitationSchema), createOwnUserInvitation);
userRoutes.delete('/invitations/:id', revokeOwnUserInvitation);
userRoutes.get('/me', getCurrentUser);
userRoutes.get('/', requireStoreAccess(), listOwnStoreUsers);
