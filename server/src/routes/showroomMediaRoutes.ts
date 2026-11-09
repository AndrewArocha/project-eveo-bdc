import { Router, raw } from 'express';
import { getShowroomMediaContent, uploadShowroomMedia } from '../controllers/showroomMediaController.js';
import { authenticate } from '../middlewares/authenticate.js';
import { requireStoreAccess } from '../middlewares/requireStoreAccess.js';
export const showroomMediaRoutes = Router();
showroomMediaRoutes.use(authenticate);
showroomMediaRoutes.post('/', requireStoreAccess(), raw({ type: ['image/*', 'video/*'], limit: '25mb' }), uploadShowroomMedia);
showroomMediaRoutes.get('/:id/content', getShowroomMediaContent);
