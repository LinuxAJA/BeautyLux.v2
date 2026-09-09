import { Router } from 'express';

import * as metaController from '../controllers/meta.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/authorize.middleware.js';

const router = Router();

router.get('/health', metaController.health);
router.get('/document-types', metaController.documentTypes);

router.get('/roles', authenticate, requireRole('admin'), metaController.roles);
router.get('/permissions', authenticate, requireRole('admin'), metaController.permissions);
router.get('/audit-logs', authenticate, requireRole('admin'), metaController.auditLogs);

export default router;
