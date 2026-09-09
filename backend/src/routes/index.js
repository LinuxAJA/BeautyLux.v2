import { Router } from 'express';

import authRoutes from './auth.routes.js';
import categoryRoutes from './category.routes.js';
import metaRoutes from './meta.routes.js';
import productRoutes from './product.routes.js';
import serviceRoutes from './service.routes.js';
import userRoutes from './user.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/products', productRoutes);
router.use('/services', serviceRoutes);
router.use('/categories', categoryRoutes);
router.use('/', metaRoutes);

export default router;
