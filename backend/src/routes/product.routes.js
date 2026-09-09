import { Router } from 'express';

import * as productController from '../controllers/product.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/authorize.middleware.js';
import { validate } from '../middlewares/validator.js';
import { idParamSchema } from '../validations/common.js';
import {
    createProductSchema,
    listProductsQuerySchema,
    updateProductSchema,
    updateProductStatusSchema,
} from '../validations/product.validation.js';

const router = Router();

router.get('/', validate(listProductsQuerySchema, 'query'), productController.list);
router.get('/:idOrSlug', productController.getOne);

router.use(authenticate, requireRole('admin', 'employee'));

router.post('/', validate(createProductSchema), productController.create);
router.put('/:id', validate(idParamSchema, 'params'), validate(updateProductSchema), productController.update);
router.patch(
    '/:id/status',
    validate(idParamSchema, 'params'),
    validate(updateProductStatusSchema),
    productController.updateStatus,
);
router.delete('/:id', requireRole('admin'), validate(idParamSchema, 'params'), productController.remove);

export default router;
