import { z } from 'zod';

import { paginationQuerySchema } from './common.js';

const priceSchema = z
    .coerce.number({ error: 'El precio es obligatorio.' })
    .nonnegative('El precio no puede ser negativo.')
    .max(99999999.99, 'El precio es demasiado alto.');

export const createProductSchema = z.object({
    sku: z.string({ error: 'El SKU es obligatorio.' }).trim().min(2).max(40),
    name: z.string({ error: 'El nombre es obligatorio.' }).trim().min(2).max(120),
    description: z.string().trim().max(2000).optional(),
    categoryId: z.coerce.number().int().positive().optional(),
    price: priceSchema,
    oldPrice: z.coerce.number().nonnegative().max(99999999.99).optional().nullable(),
    stock: z.coerce.number().int().nonnegative().default(0).optional(),
    imageUrl: z.string().trim().max(500).optional(),
    badge: z.string().trim().max(40).optional().nullable(),
    status: z.enum(['active', 'inactive']).optional(),
});

export const updateProductSchema = createProductSchema.partial();

export const updateProductStatusSchema = z.object({
    status: z.enum(['active', 'inactive'], { error: 'El estado debe ser "active" o "inactive".' }),
});

export const listProductsQuerySchema = paginationQuerySchema.extend({
    category: z.string().optional(),
    status: z.enum(['active', 'inactive']).optional(),
    minPrice: z.coerce.number().nonnegative().optional(),
    maxPrice: z.coerce.number().nonnegative().optional(),
});

export default { createProductSchema, updateProductSchema, updateProductStatusSchema, listProductsQuerySchema };
