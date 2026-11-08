import { Router } from 'express';
import { createOwnStoreKpiSnapshot, getOwnStoreKpiSnapshot, getStoreKpiSummary, listOwnStoreKpiSnapshots } from '../controllers/reportController.js';
import { authenticate } from '../middlewares/authenticate.js';
import { requireStoreAccess } from '../middlewares/requireStoreAccess.js';
import { ReportSnapshot } from '../models/ReportSnapshot.js';

export const reportRoutes = Router();
reportRoutes.use(authenticate);
reportRoutes.get('/summary', requireStoreAccess(), getStoreKpiSummary);
reportRoutes.get('/snapshots', requireStoreAccess(), listOwnStoreKpiSnapshots);
reportRoutes.get('/snapshots/:id', requireStoreAccess(ReportSnapshot), getOwnStoreKpiSnapshot);
reportRoutes.post('/snapshots', requireStoreAccess(), createOwnStoreKpiSnapshot);
