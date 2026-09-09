import { Router } from 'express';

import * as userController from '../controllers/user.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/authorize.middleware.js';
import { validate } from '../middlewares/validator.js';
import { idParamSchema } from '../validations/common.js';
import {
    createUserSchema,
    listUsersQuerySchema,
    updateUserSchema,
    updateUserStatusSchema,
} from '../validations/user.validation.js';

const router = Router();

router.use(authenticate, requireRole('admin', 'employee'));

router.get('/', validate(listUsersQuerySchema, 'query'), userController.list);
router.get('/:id', validate(idParamSchema, 'params'), userController.getById);
router.post('/', requireRole('admin'), validate(createUserSchema), userController.create);
router.put('/:id', validate(idParamSchema, 'params'), validate(updateUserSchema), userController.update);
router.patch(
    '/:id/status',
    requireRole('admin'),
    validate(idParamSchema, 'params'),
    validate(updateUserStatusSchema),
    userController.updateStatus,
);
router.delete('/:id', requireRole('admin'), validate(idParamSchema, 'params'), userController.remove);

export default router;
