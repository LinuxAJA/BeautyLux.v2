import { Router } from 'express';

import * as serviceController from '../controllers/service.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/authorize.middleware.js';
import { validate } from '../middlewares/validator.js';
import { idParamSchema } from '../validations/common.js';
import {
    createServiceSchema,
    listServicesQuerySchema,
    updateServiceSchema,
    updateServiceStatusSchema,
} from '../validations/service.validation.js';

const router = Router();

router.get('/', validate(listServicesQuerySchema, 'query'), serviceController.list);
router.get('/:idOrSlug', serviceController.getOne);

router.use(authenticate, requireRole('admin', 'employee'));

router.post('/', validate(createServiceSchema), serviceController.create);
router.put('/:id', validate(idParamSchema, 'params'), validate(updateServiceSchema), serviceController.update);
router.patch(
    '/:id/status',
    validate(idParamSchema, 'params'),
    validate(updateServiceStatusSchema),
    serviceController.updateStatus,
);
router.delete('/:id', requireRole('admin'), validate(idParamSchema, 'params'), serviceController.remove);

export default router;
