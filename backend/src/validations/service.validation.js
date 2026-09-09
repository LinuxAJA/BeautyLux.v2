import { z } from 'zod';

import { paginationQuerySchema } from './common.js';

const priceSchema = z
    .coerce.number({ error: 'El precio es obligatorio.' })
    .nonnegative('El precio no puede ser negativo.')
    .max(99999999.99, 'El precio es demasiado alto.');

export const createServiceSchema = z.object({
    name: z.string({ error: 'El nombre es obligatorio.' }).trim().min(2).max(120),
    description: z.string().trim().max(2000).optional(),
    categoryId: z.coerce.number().int().positive().optional(),
    price: priceSchema,
    durationMinutes: z.coerce.number().int().positive().max(600),
    imageUrl: z.string().trim().max(500).optional(),
    status: z.enum(['active', 'inactive']).optional(),
});

export const updateServiceSchema = createServiceSchema.partial();

export const updateServiceStatusSchema = z.object({
    status: z.enum(['active', 'inactive'], { error: 'El estado debe ser "active" o "inactive".' }),
});

export const listServicesQuerySchema = paginationQuerySchema.extend({
    category: z.string().optional(),
    status: z.enum(['active', 'inactive']).optional(),
});

export default { createServiceSchema, updateServiceSchema, updateServiceStatusSchema, listServicesQuerySchema };
