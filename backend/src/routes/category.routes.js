import { Router } from 'express';

import * as categoryController from '../controllers/category.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/authorize.middleware.js';
import { validate } from '../middlewares/validator.js';
import { idParamSchema } from '../validations/common.js';
import { createCategorySchema, listCategoriesQuerySchema, updateCategorySchema } from '../validations/category.validation.js';

const router = Router();

router.get('/', validate(listCategoriesQuerySchema, 'query'), categoryController.list);

router.use(authenticate, requireRole('admin'));

router.post('/', validate(createCategorySchema), categoryController.create);
router.put('/:id', validate(idParamSchema, 'params'), validate(updateCategorySchema), categoryController.update);
router.delete('/:id', validate(idParamSchema, 'params'), categoryController.remove);

export default router;
